"""
telemetry_receiver.py
=====================
Background service that reads MAVLink NAMED_VALUE_FLOAT messages from a
ground-station telemetry radio (COM port) and feeds complete sensor
snapshots into the E-Nose processing pipeline.

Data path:
    ESP32  ─►  Pixhawk TELEM2  ─►  Pixhawk TELEM1  ─►  Telemetry Radio
    ─►  Ground Radio  ─►  Laptop COM port  ─►  THIS SERVICE

The ESP32 sends the following named values via MAVLink:
    MQ2, MQ5, MQ9, MQ135, TEMP, HUMID

Once all six values have been received (a "complete frame"), this service
calls process_sensor_data() exactly once, then resets for the next frame.
"""

import threading
import time
import logging

# ── Logging ──────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        '[%(asctime)s] TELEMETRY %(levelname)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
    ))
    logger.addHandler(handler)

# ── Constants ────────────────────────────────────────────────────────

# Map from MAVLink NAMED_VALUE_FLOAT name (as sent by the ESP32)
# to the key expected by process_sensor_data().
# MAVLink name fields are 10-char max, uppercase by convention on the ESP32.
SENSOR_NAME_MAP = {
    'MQ2':   'mq2',
    'MQ5':   'mq5',
    'MQ9':   'mq9',
    'MQ135': 'mq135',
    'TEMP':  'temperature',
    'HUMID': 'humidity',
}

# The set of keys we need before we consider a frame "complete".
REQUIRED_KEYS = set(SENSOR_NAME_MAP.values())

# How long (seconds) to wait before retrying a failed connection.
RECONNECT_DELAY = 5

# If no message arrives for this many seconds, consider the link stale
# and trigger a reconnect.
RECEIVE_TIMEOUT = 10


class TelemetryReceiver:
    """
    Manages a background thread that:
      1. Connects to the telemetry COM port via pymavlink.
      2. Reads MAVLink NAMED_VALUE_FLOAT messages.
      3. Accumulates values into a dict until all required sensors report.
      4. Invokes process_sensor_data() with the complete dict.
      5. Automatically reconnects on link loss / errors.
    """

    def __init__(self):
        # ── State ────────────────────────────────────────────────────
        self._thread = None          # Background reader thread
        self._stop_event = threading.Event()  # Signals the thread to exit
        self._lock = threading.Lock()         # Guards _latest_values

        # Accumulated sensor values for the current frame.
        self._latest_values = {}

        # Saved Eventlet hub instance from the main thread.
        self._hub = None

        # Reference to the Flask app (set in start()) so we can push an
        # application context when calling process_sensor_data().
        self._app = None

        # Reference to the processing function (set in start()).
        self._process_fn = None

        # Reference to socketio instance (set in start()).
        self._socketio = None

        # Connection configuration (set in start()).
        self._port = None
        self._baud = None

        # Connection status exposed for the /api/system-health endpoint.
        self.status = 'disconnected'   # 'connected' | 'disconnected' | 'error'
        self.last_message_time = None  # datetime of most recent MAVLink msg
        self.message_count = 0         # total NAMED_VALUE_FLOAT msgs received

    # ── Public API ───────────────────────────────────────────────────

    def start(self, app, socketio, process_fn, port, baud):
        """
        Launch the telemetry receiver background thread.

        Parameters
        ----------
        app : Flask
            The Flask application instance (needed for app context).
        socketio : SocketIO
            The SocketIO instance (unused here but available for future
            direct emit if needed).
        process_fn : callable
            The process_sensor_data(data) function from app.py.
        port : str
            COM port string, e.g. "COM3" or "/dev/ttyUSB0".
        baud : int
            Baud rate for the serial connection.
        """
        if self._thread and self._thread.is_alive():
            logger.warning('Telemetry receiver thread is already running.')
            return

        self._app = app
        self._socketio = socketio
        self._process_fn = process_fn
        self._port = port
        self._baud = baud
        self._stop_event.clear()

        # Save the Eventlet hub of the main thread so we can schedule dispatches on it.
        try:
            import eventlet
            self._hub = eventlet.hubs.get_hub()
            logger.info('Saved main thread Eventlet hub reference.')
        except Exception as exc:
            self._hub = None
            logger.warning('Could not get Eventlet hub: %s', exc)

        # Daemon thread so it does not prevent interpreter shutdown.
        self._thread = threading.Thread(
            target=self._run_loop,
            name='TelemetryReceiver',
            daemon=True,
        )
        self._thread.start()
        logger.info(
            'Telemetry receiver started on %s @ %d baud', port, baud,
        )

    def stop(self):
        """Signal the background thread to stop and wait for it."""
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5)
            logger.info('Telemetry receiver stopped.')
        self.status = 'disconnected'

    def get_status(self):
        """Return a dict describing the current telemetry link state."""
        return {
            'status': self.status,
            'port': self._port,
            'baud': self._baud,
            'last_message_time': (
                self.last_message_time.isoformat() + 'Z'
                if self.last_message_time else None
            ),
            'message_count': self.message_count,
        }

    # ── Background thread ────────────────────────────────────────────

    def _run_loop(self):
        """
        Outer loop: connect → read → on error sleep → reconnect.
        Runs until _stop_event is set.
        """
        while not self._stop_event.is_set():
            try:
                self._connect_and_read()
            except Exception as exc:
                logger.error('Telemetry link error: %s', exc)
                self.status = 'error'

            # If we reach here the connection dropped or errored.
            if not self._stop_event.is_set():
                logger.info(
                    'Reconnecting in %d seconds...', RECONNECT_DELAY,
                )
                # Use _stop_event.wait() instead of time.sleep() so that
                # a stop() call can break out immediately.
                self._stop_event.wait(RECONNECT_DELAY)

    def _connect_and_read(self):
        from pymavlink import mavutil
        from datetime import datetime

        conn = None

        try:
            logger.info(
                'Connecting to MAVLink on %s @ %d ...',
                self._port,
                self._baud,
            )

            conn = mavutil.mavlink_connection(
                self._port,
                baud=self._baud,
            )

            logger.info('Waiting for MAVLink heartbeat...')

            heartbeat = conn.wait_heartbeat(timeout=30)

            if heartbeat is None:
                raise ConnectionError(
                    f'No MAVLink heartbeat received on {self._port} within 30s'
                )

            logger.info(
                'Heartbeat received from system %d, component %d',
                conn.target_system,
                conn.target_component,
            )

            self.status = 'connected'

            while not self._stop_event.is_set():

                msg = conn.recv_match(
                    type='NAMED_VALUE_FLOAT',
                    blocking=True,
                    timeout=RECEIVE_TIMEOUT,
                )

                if msg is None:
                    logger.warning(
                        'No NAMED_VALUE_FLOAT received for %ds, link may be stale.',
                        RECEIVE_TIMEOUT,
                    )
                    continue

                # Decode sensor name
                name = msg.name

                if isinstance(name, bytes):
                    name = name.decode('ascii', errors='ignore')

                name = name.rstrip('\x00').strip()

                value = msg.value
              

                logger.info(
                    "NAMED_VALUE_FLOAT: %s = %s",
                    name,
                    value
                )



                self.message_count += 1
                self.last_message_time = datetime.utcnow()

                mapped_key = SENSOR_NAME_MAP.get(name)

                if mapped_key is None:
                    continue

                frame = None

                with self._lock:
                    self._latest_values[mapped_key] = value

                    if REQUIRED_KEYS.issubset(self._latest_values):
                        frame = dict(self._latest_values)
                        self._latest_values.clear()

                if frame is not None:
                    self._dispatch_frame(frame)

        except Exception:
            raise

        finally:
            if conn is not None:
                try:
                    conn.close()
                    logger.info('Closed MAVLink connection')
                except Exception:
                    pass
      
    def _dispatch_frame(self, data):
        """
        Call process_sensor_data() inside a Flask application context
        on the main Eventlet hub thread.

        Parameters
        ----------
        data : dict
            Complete sensor dict, e.g.
            {"mq2": 1.2, "mq5": 0.8, ..., "temperature": 28.5, "humidity": 65.0}
        """
        logger.info('Complete sensor frame received via MAVLink: %s', data)
        if self._hub is not None:
            try:
                # Schedule the execution of _safe_dispatch on the main Eventlet thread/hub.
                # This is thread-safe and allows socketio.emit to work correctly.
                self._hub.schedule_call_global(0, self._safe_dispatch, data)
            except Exception as exc:
                logger.error('Error scheduling telemetry dispatch: %s', exc)
        else:
            # Fallback if no hub is available
            self._safe_dispatch(data)

    def _safe_dispatch(self, data):
        try:
            # process_sensor_data() uses db.session and socketio.emit(),
            # both of which require an active Flask application context.
            with self._app.app_context():
                result = self._process_fn(data)
                if result and result.get('status') == 'error':
                    logger.error(
                        'process_sensor_data returned error: %s',
                        result.get('message'),
                    )
        except Exception as exc:
            logger.error('Error dispatching telemetry frame: %s', exc)


# ── Module-level singleton ───────────────────────────────────────────
# Imported by app.py as:
#     from services.telemetry_receiver import telemetry_receiver
telemetry_receiver = TelemetryReceiver()

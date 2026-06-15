import os
from dotenv import load_dotenv

load_dotenv()
print("DOTENV LOADED")
print("TELEMETRY_ENABLED =", os.environ.get("TELEMETRY_ENABLED"))
print("TELEMETRY_PORT =", os.environ.get("TELEMETRY_PORT"))
print("TELEMETRY_BAUD =", os.environ.get("TELEMETRY_BAUD"))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev_secret_key')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://enose_user:enose_pass@localhost:5432/enose_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_HEADERS = 'Content-Type'

    # ── MAVLink Telemetry Configuration ──────────────────────────────
    # COM port where the ground-station telemetry radio is connected.
    # On Windows this is typically "COM3", "COM4", etc.
    # On Linux it would be "/dev/ttyUSB0" or "/dev/ttyACM0".
    TELEMETRY_PORT = os.environ.get('TELEMETRY_PORT', 'COM3')

    # Baud rate for the telemetry radio link.
    # 57600 is the default for SiK / 3DR telemetry radios.
    TELEMETRY_BAUD = int(os.environ.get('TELEMETRY_BAUD', '57600'))

    # Master switch: set to "true" to start the MAVLink receiver thread
    # on application boot.  When "false" the backend works exactly as
    # before (HTTP-only sensor ingestion).
    TELEMETRY_ENABLED = os.environ.get('TELEMETRY_ENABLED', 'false').lower() == 'true'

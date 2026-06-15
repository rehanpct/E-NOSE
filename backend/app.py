import os
import csv
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_migrate import Migrate
from sqlalchemy import text

from config import Config
from models import db
from models.sensor_reading import SensorReading
from models.prediction import Prediction
from models.alert import Alert
from models.telemetry import Telemetry
from models.dataset_sample import DatasetSample
from ml.inference import predictor
from services.alert_service import evaluate_thresholds
from services.normalization_service import normalizer
from services.aqi_service import aqi_engine
from services.training_service import trainer
from services.dataset_service import dataset_service
# ── NEW: Import the MAVLink telemetry receiver service ───────────────
from services.telemetry_receiver import telemetry_receiver
print("APP.PY LOADED")

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

db.init_app(app)
migrate = Migrate(app, db)
socketio = SocketIO(app, cors_allowed_origins="*")

app.config['START_TIME'] = datetime.utcnow()


# ═════════════════════════════════════════════════════════════════════
# REFACTORED: Core processing logic extracted into a standalone
# function so that it can be called from BOTH the HTTP endpoint
# AND the MAVLink telemetry receiver.
# ═════════════════════════════════════════════════════════════════════

def process_sensor_data(data):
    """
    Process a complete sensor data dictionary through the full pipeline:
      1. Parse & validate sensor values
      2. Normalize MQ sensor readings
      3. Calculate EQS (Environmental Quality Score)
      4. Store SensorReading in database
      5. Run ML prediction and store result
      6. Evaluate alert thresholds
      7. Record dataset sample (if collection is active)
      8. Emit Socket.IO events to connected dashboards

    Parameters
    ----------
    data : dict
        Must contain keys: mq2, mq5, mq9, mq135, temperature, humidity.
        Values can be numeric or string-numeric (will be cast to float).

    Returns
    -------
    dict
        {"status": "success", ...} on success, or
        {"status": "error", "message": "..."} on failure.
    """
    try:
        # ── 1. Parse incoming sensor values ──────────────────────────
        mq2 = float(data.get('mq2', 0))
        mq5 = float(data.get('mq5', 0))
        mq9 = float(data.get('mq9', 0))
        mq135 = float(data.get('mq135', 0))
        temperature = float(data.get('temperature', 0))
        humidity = float(data.get('humidity', 0))

        print("\n==============================")
        print("SENSOR DATA RECEIVED")
        print(data)
        print("==============================")

        # ── 2. Normalize MQ sensor readings ──────────────────────────
        raw_dict = {
            'mq2': mq2,
            'mq5': mq5,
            'mq9': mq9,
            'mq135': mq135
        }

        norm_dict = normalizer.process(raw_dict)

        # ── 3. Calculate Environmental Quality Score ─────────────────
        eqs_score = aqi_engine.calculate_eqs(
            norm_dict,
            temperature,
            humidity
        )

        # ── 4. Store the raw + normalized reading in the database ────
        reading = SensorReading(
            raw_mq2=mq2,
            raw_mq5=mq5,
            raw_mq9=mq9,
            raw_mq135=mq135,

            normalized_mq2=norm_dict['mq2'],
            normalized_mq5=norm_dict['mq5'],
            normalized_mq9=norm_dict['mq9'],
            normalized_mq135=norm_dict['mq135'],

            temperature=temperature,
            humidity=humidity,
            eqs=eqs_score
        )

        db.session.add(reading)

        # ── 5. Run ML gas-type prediction ────────────────────────────
        
       # ── 5. Run ML gas-type prediction ────────────────────────────

        print("\n========== ML INPUT ==========")
        print(f"MQ2={mq2}")
        print(f"MQ5={mq5}")
        print(f"MQ9={mq9}")
        print(f"MQ135={mq135}")
        print(f"TEMP={temperature}")
        print(f"HUMIDITY={humidity}")
        print("==============================")

        pred_result = predictor.predict(
            mq2,
            mq5,
            mq9,
            mq135,
            temperature,
            humidity
        )

        print("\n========== ML OUTPUT ==========")
        print(pred_result)
        print("==============================")

        prediction = Prediction(
            predicted_gas=pred_result['gas'],
            confidence=pred_result['confidence'],

            raw_mq2=mq2,
            raw_mq5=mq5,
            raw_mq9=mq9,
            raw_mq135=mq135,

            normalized_mq2=norm_dict['mq2'],
            normalized_mq5=norm_dict['mq5'],
            normalized_mq9=norm_dict['mq9'],
            normalized_mq135=norm_dict['mq135'],

            temperature=temperature,
            humidity=humidity
        )

        db.session.add(prediction)

        # ── 6. Evaluate alert thresholds ─────────────────────────────
        alerts = evaluate_thresholds(raw_dict)

        for alert in alerts:
            db.session.add(alert)

        # ── 7. Record dataset sample (if collection is active) ───────
        dataset_service.record_sample(
            raw_dict,
            norm_dict,
            temperature,
            humidity
        )

        db.session.commit()

        # ── 8. Build payload and emit Socket.IO events ───────────────
        reading_dict = reading.to_dict()

        indices = aqi_engine.calculate_indices(
            norm_dict,
            eqs_score
        )

        # Enrich hazard_level with prediction confidence + gas-type severity
        gas = (pred_result.get('gas', '') or '').lower()
        conf = pred_result.get('confidence', 0) or 0
        if any(k in gas for k in ('smoke', 'lpg', 'carbon', ' co')):
            gas_bonus = 40
        elif any(k in gas for k in ('alcohol', 'perfume', 'mixed')):
            gas_bonus = 20
        else:
            gas_bonus = 0
        indices['hazard_level'] = round(
            min(100, indices['hazard_level'] * 0.6 + (conf / 100) * gas_bonus), 2
        )

        reading_dict.update(indices)

        print("\nEMITTING SENSOR UPDATE")
        print(reading_dict)

        # ONLY ONE SENSOR_UPDATE EVENT
        socketio.emit('sensor_update', reading_dict)

        pred_dict = prediction.to_dict()
        pred_dict['distribution'] = pred_result.get(
            'distribution',
            {}
        )

        socketio.emit(
            'prediction_update',
            pred_dict
        )

        for alert in alerts:
            socketio.emit(
                'alert_update',
                alert.to_dict()
            )

        print("SOCKET EVENTS SENT\n")

        return {
            "status": "success",
            "message": "Data processed",
            "distribution": pred_dict['distribution']
        }

    except Exception as e:
        db.session.rollback()
        print("ERROR:", e)
        return {
            "status": "error",
            "message": str(e)
        }


# ═════════════════════════════════════════════════════════════════════
# HTTP ENDPOINT — now a thin wrapper around process_sensor_data()
# ═════════════════════════════════════════════════════════════════════

@app.route('/api/sensor-data', methods=['POST'])
def receive_sensor_data():
    """
    Original HTTP endpoint for receiving sensor data from the ESP32.
    Still fully functional — the ESP32 can POST JSON directly when
    using Wi-Fi instead of MAVLink telemetry.
    """
    data = request.json

    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400

    result = process_sensor_data(data)

    if result.get('status') == 'error':
        return jsonify({"error": result['message']}), 500

    return jsonify(result), 201

@app.route('/api/system-health', methods=['GET'])
def system_health():
    try:
        db.session.execute(text('SELECT 1'))
        db_status = 'online'
    except Exception:
        db_status = 'offline'
        
    ml_status = 'loaded' if "Loaded" in predictor.status else 'failed'
    
    # We use timestamps of last reading to define esp32 status
    last_reading = SensorReading.query.order_by(SensorReading.timestamp.desc()).first()
    esp32_status = 'offline'
    if last_reading:
        diff = (datetime.utcnow() - last_reading.timestamp).total_seconds()
        if diff < 30:
            esp32_status = 'online'
            
    uptime = (datetime.utcnow() - app.config['START_TIME']).total_seconds()
    total_samples = DatasetSample.query.count()
    total_predictions = Prediction.query.count()
    total_sensor_readings = SensorReading.query.count()

    # Predictions in the last 60 seconds for rate metrics
    one_min_ago = datetime.utcnow() - timedelta(minutes=1)
    predictions_last_min = Prediction.query.filter(Prediction.timestamp >= one_min_ago).count()

    # ── NEW: Include telemetry link status in system health ──────────
    telemetry_status = telemetry_receiver.get_status()
            
    return jsonify({
        "backend": "online",
        "database": db_status,
        "socketio": "online",
        "model": ml_status,
        "esp32": esp32_status,
        "last_sensor_update": last_reading.timestamp.isoformat() + 'Z' if last_reading else None,
        "uptime": uptime,
        "total_samples": total_samples,
        "total_predictions": total_predictions,
        "total_sensor_readings": total_sensor_readings,
        "predictions_per_minute": predictions_last_min,
        "active_model": predictor.model_filename or "None",
        # ── NEW: Telemetry link info ─────────────────────────────────
        "telemetry": telemetry_status,
    })

@app.route('/api/model-debug', methods=['GET'])
def model_debug():
    metadata = predictor.get_metadata()
    return jsonify({
        "loaded": metadata["loaded"],
        "filename": metadata["model_filename"],
        "model_type": metadata["model_type"],
        "features": metadata["feature_names"],
        "classes": metadata["classes"],
        "feature_count": metadata["feature_count"],
        "framework": metadata.get("framework", "Unknown")
    })

@app.route('/api/model-status', methods=['GET'])
def model_status():
    metadata = predictor.get_metadata()
    feature_importance = None
    if predictor.model is not None and hasattr(predictor.model, 'feature_importances_'):
        feature_importance = []
        importances = predictor.model.feature_importances_
        features = metadata["feature_names"] or []
        for feat, imp in zip(features, importances):
            feature_importance.append({
                'name': feat.upper() if feat.startswith('mq') else feat.capitalize(),
                'value': round(float(imp) * 100, 2),
            })
        feature_importance.sort(key=lambda x: x['value'], reverse=True)

    active_metrics = trainer.active_metrics or {}

    return jsonify({
        "loaded": metadata["loaded"],
        "model_type": metadata["model_type"],
        "feature_count": metadata["feature_count"],
        "features": metadata["feature_names"],
        "classes": metadata["classes"],
        "filename": metadata["model_filename"],
        "status": metadata["status"],
        "feature_importance": feature_importance,
        "deployed_at": metadata["training_timestamp"] or active_metrics.get('deployed_at'),
        "active_metrics": active_metrics,
        "model_modified": metadata["training_timestamp"],
        "framework": metadata.get("framework", "Unknown"),
    })


@app.route('/api/predict-manual', methods=['POST'])
def predict_manual():
    data = request.json
    try:
        mq2 = float(data.get('mq2', 0))
        mq5 = float(data.get('mq5', 0))
        mq9 = float(data.get('mq9', 0))
        mq135 = float(data.get('mq135', 0))
        temperature = float(data.get('temperature', 0))
        humidity = float(data.get('humidity', 0))

        raw_dict = {'mq2': mq2, 'mq5': mq5, 'mq9': mq9, 'mq135': mq135}
        norm_dict = normalizer.process(raw_dict)
        eqs_score = aqi_engine.calculate_eqs(norm_dict, temperature, humidity)
        category = aqi_engine.get_category(eqs_score)

        pred_result = predictor.predict(mq2, mq5, mq9, mq135, temperature, humidity)

        return jsonify({
            "status": "success",
            "prediction": {**pred_result, "distribution": pred_result.get("distribution", {})},
            "eqs": eqs_score,
            "category": category
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/sensor-baselines', methods=['GET'])
def get_sensor_baselines():
    baselines = {}
    for sensor in ['mq2', 'mq5', 'mq9', 'mq135']:
        min_val = normalizer.bounds[sensor]['min']
        max_val = normalizer.bounds[sensor]['max']
        # If no readings yet, use 0
        baselines[sensor] = {
            'baseline': min_val if min_val != float('inf') else 0,
            'max_seen': max_val if max_val != float('-inf') else 0
        }
    return jsonify(baselines)

@app.route('/api/dataset/collect', methods=['POST'])
def manage_collection():
    req = request.json
    action = req.get('action')
    label = req.get('label')
    target_count = req.get('target_count')
    
    if action == 'start':
        dataset_service.state["is_collecting"] = True
        dataset_service.state["start_time"] = datetime.utcnow().isoformat()
        dataset_service.state["samples_collected"] = 0
        if label:
            dataset_service.state["current_label"] = label
        if target_count:
            dataset_service.state["target_count"] = int(target_count)
        else:
            dataset_service.state["target_count"] = None
    elif action == 'stop':
        dataset_service.state["is_collecting"] = False
    elif action == 'pause':
        dataset_service.state["is_collecting"] = False
    elif action == 'resume':
        dataset_service.state["is_collecting"] = True
        
    return jsonify(dataset_service.state)

@app.route('/api/dataset/stats', methods=['GET'])
def dataset_stats():
    quality_metrics = dataset_service.get_quality_metrics()
    return jsonify({
        "state": dataset_service.state,
        "quality": quality_metrics
    })

@app.route('/api/prediction-history', methods=['GET'])
def prediction_history():
    limit = request.args.get('limit', 100, type=int)
    preds = Prediction.query.order_by(Prediction.timestamp.desc()).limit(limit).all()
    return jsonify([p.to_dict() for p in preds])

@app.route('/api/latest', methods=['GET'])
def get_latest():
    reading = SensorReading.query.order_by(SensorReading.timestamp.desc()).first()
    prediction = Prediction.query.order_by(Prediction.timestamp.desc()).first()

    sensor_dict = None
    if reading:
        sensor_dict = reading.to_dict()
        # Compute all 5 derived indices so the frontend gauges are populated
        # on page load (not just when a live sensor_update socket event fires).
        norm_dict = {
            'mq2':   reading.normalized_mq2,
            'mq5':   reading.normalized_mq5,
            'mq9':   reading.normalized_mq9,
            'mq135': reading.normalized_mq135,
        }
        eqs_val = reading.eqs or 0.0

        # Also compute a richer hazard_level that factors in prediction confidence
        base_hazard = aqi_engine.calculate_indices(norm_dict, eqs_val)

        if prediction:
            gas = (prediction.predicted_gas or '').lower()
            conf = prediction.confidence or 0
            # Gas-type severity modifier (0-40 bonus)
            if any(k in gas for k in ('smoke', 'lpg', 'carbon', ' co')):
                gas_bonus = 40
            elif any(k in gas for k in ('alcohol', 'perfume', 'mixed')):
                gas_bonus = 20
            else:
                gas_bonus = 0
            hazard = min(100, base_hazard['hazard_level'] * 0.6 + (conf / 100) * gas_bonus)
            base_hazard['hazard_level'] = round(hazard, 2)

        sensor_dict.update(base_hazard)

    return jsonify({
        "sensor": sensor_dict,
        "prediction": prediction.to_dict() if prediction else None
    })

@app.route('/api/train-model', methods=['POST'])
def train_model_endpoint():
    try:
        result = trainer.train_new_model()
        if "error" in result:
            return jsonify(result), 400
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/deploy-model', methods=['POST'])
def deploy_model_endpoint():
    try:
        result = trainer.deploy_pending_model()
        if "error" in result:
            return jsonify(result), 400
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics/trends', methods=['GET'])
def get_trends():
    from datetime import timedelta
    from collections import Counter

    range_type = request.args.get('range', 'hour')
    now = datetime.utcnow()
    if range_type == 'day':
        since = now - timedelta(days=1)
    elif range_type == 'week':
        since = now - timedelta(days=7)
    else:
        since = now - timedelta(hours=1)

    preds = Prediction.query.filter(Prediction.timestamp >= since).order_by(Prediction.timestamp.asc()).all()
    readings = SensorReading.query.filter(SensorReading.timestamp >= since).order_by(SensorReading.timestamp.asc()).all()

    timeline = [p.timestamp.isoformat() + 'Z' for p in preds]
    frequency = dict(Counter(p.predicted_gas for p in preds))
    confidence_trend = [{'timestamp': p.timestamp.isoformat() + 'Z', 'confidence': p.confidence} for p in preds]

    # Sensor correlation: mean normalized values per sensor
    correlation = {}
    if readings:
        correlation = {
            'MQ2': round(sum(r.normalized_mq2 for r in readings) / len(readings), 2),
            'MQ5': round(sum(r.normalized_mq5 for r in readings) / len(readings), 2),
            'MQ9': round(sum(r.normalized_mq9 for r in readings) / len(readings), 2),
            'MQ135': round(sum(r.normalized_mq135 for r in readings) / len(readings), 2),
            'Temp': round(sum(r.temperature for r in readings) / len(readings), 2),
            'Humidity': round(sum(r.humidity for r in readings) / len(readings), 2),
        }

    return jsonify({
        "status": "success",
        "range": range_type,
        "timeline": timeline,
        "frequency": frequency,
        "confidence_trend": confidence_trend,
        "sensor_correlation": correlation,
        "prediction_count": len(preds),
        "reading_count": len(readings),
    })

@app.route('/api/deployment-info', methods=['GET'])
def deployment_info():
    metadata = predictor.get_metadata()
    active_metrics = trainer.active_metrics or {}
    history = trainer.get_deployment_history()

    # Build deployment log from model backups + current model load event
    logs = []
    if metadata["loaded"]:
        model_path = os.path.join(os.path.dirname(__file__), 'ml', metadata["model_filename"])
        if os.path.exists(model_path):
            mtime = datetime.utcfromtimestamp(os.path.getmtime(model_path))
            logs.append({
                'timestamp': mtime.strftime('%H:%M:%S'),
                'message': f'Model {metadata["model_filename"]} active ({metadata["model_type"]})',
                'level': 'success',
            })
    for entry in history[:5]:
        logs.append({
            'timestamp': datetime.fromisoformat(entry['deployed_at'].replace('Z', '')).strftime('%H:%M:%S'),
            'message': f'Model archived: {entry["filename"]}',
            'level': 'info',
        })

    uptime = (datetime.utcnow() - app.config['START_TIME']).total_seconds()

    return jsonify({
        "active_model": metadata["model_filename"],
        "model_type": metadata["model_type"],
        "model_status": metadata["status"],
        "deployed_at": metadata["training_timestamp"] or active_metrics.get('deployed_at'),
        "active_metrics": active_metrics,
        "deployment_history": history,
        "deployment_log": logs,
        "uptime_seconds": uptime,
        "predictions_per_minute": Prediction.query.filter(
            Prediction.timestamp >= datetime.utcnow() - timedelta(minutes=1)
        ).count(),
    })

@app.route('/api/telemetry/latest', methods=['GET'])
def latest_telemetry():
    record = Telemetry.query.order_by(Telemetry.timestamp.desc()).first()
    return jsonify(record.to_dict() if record else None)


# ═════════════════════════════════════════════════════════════════════
# NEW ENDPOINT: Telemetry link status
# ═════════════════════════════════════════════════════════════════════

@app.route('/api/telemetry/status', methods=['GET'])
def telemetry_link_status():
    """
    Returns the current status of the MAVLink telemetry receiver:
    connection state, port, baud, last message time, message count.
    """
    return jsonify(telemetry_receiver.get_status())


@app.route('/api/backup', methods=['POST'])
def run_backup():
    try:
        backup_dir = os.path.join(os.path.dirname(__file__), 'backups')
        os.makedirs(os.path.join(backup_dir, 'database'), exist_ok=True)
        os.makedirs(os.path.join(backup_dir, 'datasets'), exist_ok=True)
        os.makedirs(os.path.join(backup_dir, 'models'), exist_ok=True)
        
        # Simple file copy for demonstration
        import shutil
        import time
        timestamp = int(time.time())
        
        # Backup CSV
        csv_path = os.path.join(os.path.dirname(__file__), 'datasets', 'collection.csv')
        if os.path.exists(csv_path):
            shutil.copy2(csv_path, os.path.join(backup_dir, 'datasets', f'collection_{timestamp}.csv'))
            
        # Backup Model
        model_path = os.path.join(os.path.dirname(__file__), 'ml', 'e_nose_model.pkl')
        if os.path.exists(model_path):
            shutil.copy2(model_path, os.path.join(backup_dir, 'models', f'e_nose_model_backup_{timestamp}.pkl'))
            
        return jsonify({"status": "success", "message": f"Backup completed at {timestamp}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("MAIN BLOCK EXECUTED")
    print("TELEMETRY_ENABLED =", app.config.get('TELEMETRY_ENABLED'))
    print("TELEMETRY_PORT =", app.config.get('TELEMETRY_PORT'))

    with app.app_context():
        db.create_all()

    # ── NEW: Start the MAVLink telemetry receiver if enabled ─────────
    # The receiver runs in a daemon thread alongside the Flask/SocketIO
    # event loop.  It calls process_sensor_data() whenever a complete
    # set of sensor values has been received over the radio link.
    if app.config.get('TELEMETRY_ENABLED'):
        import os
        print("Starting telemetry receiver, PID =", os.getpid())
        telemetry_receiver.start(
            app=app,
            socketio=socketio,
            process_fn=process_sensor_data,
            port=app.config['TELEMETRY_PORT'],
            baud=app.config['TELEMETRY_BAUD'],
        )
        print(f"\n[TELEMETRY] MAVLink telemetry receiver ENABLED")
        print(f"   Port: {app.config['TELEMETRY_PORT']}")
        print(f"   Baud: {app.config['TELEMETRY_BAUD']}\n")
    else:
        print("\n[WARNING] MAVLink telemetry receiver DISABLED (set TELEMETRY_ENABLED=true to activate)\n")

    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=True,
        use_reloader=False
    )
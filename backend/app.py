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

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

db.init_app(app)
migrate = Migrate(app, db)
socketio = SocketIO(app, cors_allowed_origins="*")

app.config['START_TIME'] = datetime.utcnow()



@@app.route('/api/sensor-data', methods=['POST'])
def receive_sensor_data():
    data = request.json

    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400

    try:
        # Parse incoming data
        mq2 = float(data.get('mq2', 0))
        mq5 = float(data.get('mq5', 0))
        mq9 = float(data.get('mq9', 0))
        mq135 = float(data.get('mq135', 0))
        temperature = float(data.get('temperature', 0))
        humidity = float(data.get('humidity', 0))

        print("\n==============================")
        print("ESP32 DATA RECEIVED")
        print(data)
        print("==============================")

        # Normalize
        raw_dict = {
            'mq2': mq2,
            'mq5': mq5,
            'mq9': mq9,
            'mq135': mq135
        }

        norm_dict = normalizer.process(raw_dict)

        eqs_score = aqi_engine.calculate_eqs(
            norm_dict,
            temperature,
            humidity
        )

        # Store reading
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

        # Prediction
        pred_result = predictor.predict(
            mq2,
            mq5,
            mq9,
            mq135,
            temperature,
            humidity
        )

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

        alerts = evaluate_thresholds(raw_dict)

        for alert in alerts:
            db.session.add(alert)

        dataset_service.record_sample(
            raw_dict,
            norm_dict,
            temperature,
            humidity
        )

        db.session.commit()

        # Create final payload
        reading_dict = reading.to_dict()

        indices = aqi_engine.calculate_indices(
            norm_dict,
            eqs_score
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

        return jsonify({
            "status": "success",
            "message": "Data processed",
            "distribution": pred_dict['distribution']
        }), 201

    except Exception as e:
        db.session.rollback()

        print("ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500

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
        "active_model": predictor.model_filename or "None"
    })

@app.route('/api/model-status', methods=['GET'])
def model_status():
    feature_importance = []
    if predictor.model is not None and hasattr(predictor.model, 'feature_importances_'):
        importances = predictor.model.feature_importances_
        features = predictor.features or []
        for feat, imp in zip(features, importances):
            feature_importance.append({
                'name': feat.upper() if feat.startswith('mq') else feat.capitalize(),
                'value': round(float(imp) * 100, 2),
            })
        feature_importance.sort(key=lambda x: x['value'], reverse=True)

    model_path = None
    model_modified = None
    if predictor.model_filename:
        model_path = os.path.join(os.path.dirname(__file__), 'ml', predictor.model_filename)
        if os.path.exists(model_path):
            model_modified = datetime.utcfromtimestamp(os.path.getmtime(model_path)).isoformat() + 'Z'

    active_metrics = trainer.active_metrics or {}

    return jsonify({
        "loaded": "Loaded" in predictor.status,
        "model_type": predictor.model_type,
        "feature_count": len(predictor.features),
        "features": predictor.features,
        "classes": predictor.classes,
        "filename": predictor.model_filename,
        "status": predictor.status,
        "feature_importance": feature_importance,
        "deployed_at": active_metrics.get('deployed_at'),
        "active_metrics": active_metrics,
        "model_modified": model_modified,
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
    return jsonify({
        "sensor": reading.to_dict() if reading else None,
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
    active_metrics = trainer.active_metrics or {}
    history = trainer.get_deployment_history()

    # Build deployment log from model backups + current model load event
    logs = []
    if predictor.model_filename and predictor.model_filename != "None":
        model_path = os.path.join(os.path.dirname(__file__), 'ml', predictor.model_filename)
        if os.path.exists(model_path):
            mtime = datetime.utcfromtimestamp(os.path.getmtime(model_path))
            logs.append({
                'timestamp': mtime.strftime('%H:%M:%S'),
                'message': f'Model {predictor.model_filename} active ({predictor.model_type})',
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
        "active_model": predictor.model_filename,
        "model_type": predictor.model_type,
        "model_status": predictor.status,
        "deployed_at": active_metrics.get('deployed_at'),
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
            shutil.copy2(model_path, os.path.join(backup_dir, 'models', f'active_model_{timestamp}.pkl'))
            
        return jsonify({"status": "success", "message": f"Backup completed at {timestamp}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':

    with app.app_context():
        db.create_all()

    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=True
    )
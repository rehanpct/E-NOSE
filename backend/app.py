import os
import csv
from datetime import datetime
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



@app.route('/api/sensor-data', methods=['POST'])
def receive_sensor_data():
    data = request.json
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400
        
    try:
        # 1. Parse Data
        mq2 = float(data.get('mq2', 0))
        mq5 = float(data.get('mq5', 0))
        mq9 = float(data.get('mq9', 0))
        mq135 = float(data.get('mq135', 0))
        temperature = float(data.get('temperature', 0))
        humidity = float(data.get('humidity', 0))

        # 2. Normalize and AQI
        raw_dict = {'mq2': mq2, 'mq5': mq5, 'mq9': mq9, 'mq135': mq135}
        norm_dict = normalizer.process(raw_dict)
        eqs_score = aqi_engine.calculate_eqs(norm_dict, temperature, humidity)

        # 3. Store Reading
        reading = SensorReading(
            raw_mq2=mq2, raw_mq5=mq5, raw_mq9=mq9, raw_mq135=mq135,
            normalized_mq2=norm_dict['mq2'], normalized_mq5=norm_dict['mq5'], 
            normalized_mq9=norm_dict['mq9'], normalized_mq135=norm_dict['mq135'],
            temperature=temperature, humidity=humidity,
            eqs=eqs_score
        )
        db.session.add(reading)

        # 4. Predict Gas
        pred_result = predictor.predict(mq2, mq5, mq9, mq135, temperature, humidity)
        prediction = Prediction(
            predicted_gas=pred_result['gas'],
            confidence=pred_result['confidence'],
            raw_mq2=mq2, raw_mq5=mq5, raw_mq9=mq9, raw_mq135=mq135,
            normalized_mq2=norm_dict['mq2'], normalized_mq5=norm_dict['mq5'], 
            normalized_mq9=norm_dict['mq9'], normalized_mq135=norm_dict['mq135'],
            temperature=temperature, humidity=humidity
        )
        db.session.add(prediction)

        # 5. Check Alerts
        alerts = evaluate_thresholds(raw_dict)
        for alert in alerts:
            db.session.add(alert)
            
        # 6. Dataset Collection
        dataset_service.record_sample(raw_dict, norm_dict, temperature, humidity)
            
        # 7. Commit to Database
        db.session.commit()

        # 8. Broadcast via Socket.IO
        socketio.emit('sensor_update', reading.to_dict())
        
        pred_dict = prediction.to_dict()
        pred_dict['distribution'] = pred_result.get('distribution', {})
        socketio.emit('prediction_update', pred_dict)
        
        for alert in alerts:
            socketio.emit('alert_update', alert.to_dict())
            
        return jsonify({"status": "success", "message": "Data processed", "distribution": pred_dict['distribution']}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error processing sensor data: {e}")
        return jsonify({"error": str(e)}), 500

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
            
    return jsonify({
        "backend": "online",
        "database": db_status,
        "socketio": "online",
        "model": ml_status,
        "esp32": esp32_status,
        "last_sensor_update": last_reading.timestamp.isoformat() + 'Z' if last_reading else None,
        "uptime": uptime,
        "total_samples": total_samples,
        "active_model": predictor.model_filename or "None"
    })

@app.route('/api/model-status', methods=['GET'])
def model_status():
    return jsonify({
        "loaded": "Loaded" in predictor.status,
        "model_type": predictor.model_type,
        "feature_count": len(predictor.features),
        "features": predictor.features,
        "classes": predictor.classes,
        "filename": predictor.model_filename,
        "status": predictor.status
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
            "prediction": pred_result,
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
    # Placeholder for advanced analytics, querying Prediction and SensorReading
    # In a real setup, we would group by hour/day/week using DB functions.
    # For now, return a mocked structure to satisfy the frontend requirement.
    range_type = request.args.get('range', 'hour')
    return jsonify({
        "status": "success",
        "range": range_type,
        "timeline": [],
        "frequency": {},
        "confidence_trend": []
    })

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
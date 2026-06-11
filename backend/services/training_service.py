import os
import json
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from models.dataset_sample import DatasetSample
from ml.inference import predictor
from datetime import datetime

class TrainingService:
    def __init__(self):
        self.pending_model_path = os.path.join(os.path.dirname(__file__), '..', 'ml', 'pending_model.pkl')
        self.model_dir = os.path.join(os.path.dirname(__file__), '..', 'ml')
        self.active_metrics_path = os.path.join(self.model_dir, 'active_model_metrics.json')
        self.last_metrics = None
        self.active_metrics = self._load_active_metrics()

    def _load_active_metrics(self):
        if os.path.exists(self.active_metrics_path):
            try:
                with open(self.active_metrics_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, OSError):
                pass
        return None

    def _save_active_metrics(self, metrics, filename):
        payload = {
            **metrics,
            'filename': filename,
            'deployed_at': datetime.utcnow().isoformat() + 'Z',
        }
        with open(self.active_metrics_path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, indent=2)
        self.active_metrics = payload
        return payload

    def train_new_model(self):
        # Fetch data from DB
        samples = DatasetSample.query.all()
        if len(samples) < 10:
            return {"error": "Not enough data to train. Minimum 10 samples required."}
            
        # Convert to pandas
        data = [s.to_dict() for s in samples]
        df = pd.DataFrame(data)
        
        X = df[['raw_mq2', 'raw_mq5', 'raw_mq9', 'raw_mq135', 'temperature', 'humidity']]
        y = df['label']
        
        # We must use exact feature names from old model to ensure compatibility
        X.columns = ['mq2', 'mq5', 'mq9', 'mq135', 'temp', 'humidity']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        
        metrics = {
            "accuracy": round(accuracy_score(y_test, y_pred), 4),
            "precision": round(precision_score(y_test, y_pred, average='weighted', zero_division=0), 4),
            "recall": round(recall_score(y_test, y_pred, average='weighted', zero_division=0), 4),
            "f1_score": round(f1_score(y_test, y_pred, average='weighted', zero_division=0), 4),
            "training_samples": len(X_train),
            "testing_samples": len(X_test)
        }
        
        # Save pending model
        joblib.dump(model, self.pending_model_path)
        self.last_metrics = metrics
        
        return {
            "status": "success",
            "metrics": metrics,
            "message": "Model trained and saved as pending. Awaiting deployment confirmation."
        }

    def deploy_pending_model(self):
        if not os.path.exists(self.pending_model_path):
            return {"error": "No pending model found to deploy."}
            
        # Backup old model with timestamp versioning
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
        # Currently active model filename is in predictor
        active_filename = predictor.model_filename
        if active_filename:
            active_path = os.path.join(self.model_dir, active_filename)
            backup_path = os.path.join(self.model_dir, f"e_nose_model_backup_{timestamp}.pkl")
            if os.path.exists(active_path):
                os.rename(active_path, backup_path)
                
        # Deploy new model as e_nose_model.pkl
        new_active_path = os.path.join(self.model_dir, 'e_nose_model.pkl')
        os.rename(self.pending_model_path, new_active_path)
        
        # Reload predictor
        predictor.load_model()

        if self.last_metrics:
            self._save_active_metrics(self.last_metrics, 'e_nose_model.pkl')
        
        return {
            "status": "success",
            "message": "Pending model successfully deployed."
        }

    def get_deployment_history(self):
        """List model backup files as deployment history entries."""
        history = []
        if not os.path.isdir(self.model_dir):
            return history
        for name in os.listdir(self.model_dir):
            if name.startswith('e_nose_model_backup_') and name.endswith('.pkl'):
                path = os.path.join(self.model_dir, name)
                mtime = datetime.utcfromtimestamp(os.path.getmtime(path))
                history.append({
                    'filename': name,
                    'deployed_at': mtime.isoformat() + 'Z',
                    'status': 'Archived',
                })
        history.sort(key=lambda x: x['deployed_at'], reverse=True)
        return history

trainer = TrainingService()

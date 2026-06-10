import os
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
        self.active_model_dir = os.path.join(os.path.dirname(__file__), '..', 'ml')
        self.last_metrics = None

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
            active_path = os.path.join(self.active_model_dir, active_filename)
            backup_path = os.path.join(self.active_model_dir, f"model_backup_{timestamp}.pkl")
            if os.path.exists(active_path):
                os.rename(active_path, backup_path)
                
        # Deploy new model as active_model.pkl
        new_active_path = os.path.join(self.active_model_dir, 'active_model.pkl')
        os.rename(self.pending_model_path, new_active_path)
        
        # Reload predictor
        predictor.load_model()
        
        return {
            "status": "success",
            "message": "Pending model successfully deployed."
        }

trainer = TrainingService()

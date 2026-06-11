import os
import joblib
import pandas as pd
import numpy as np
import datetime

class ENOSEPredictor:
    def __init__(self, models_dir="."):
        self.models_dir = models_dir
        self.model = None
        self.model_filename = None
        self.model_type = "Unknown"
        self.features = []
        self.classes = []
        self.status = "Initializing"
        self.load_model()

    def load_model(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        target_file = os.path.join(base_dir, "e_nose_model.pkl")

        if not os.path.exists(target_file):
            msg = f"CRITICAL ERROR: Model file not found at {target_file}"
            print(msg)
            raise FileNotFoundError(msg)

        try:
            self.model = joblib.load(target_file)
            self.model_filename = os.path.basename(target_file)
            self.model_type = type(self.model).__name__
            self.status = "Loaded"

            if hasattr(self.model, 'feature_names_in_'):
                self.features = list(self.model.feature_names_in_)
            elif hasattr(self.model, 'n_features_in_'):
                self.features = ['mq2', 'mq5', 'mq9', 'mq135', 'temp', 'humidity'][:self.model.n_features_in_]
            else:
                self.features = ['mq2', 'mq5', 'mq9', 'mq135', 'temp', 'humidity']

            if hasattr(self.model, 'classes_'):
                self.classes = [str(c) for c in self.model.classes_]
            else:
                self.classes = []

            # Print active model metadata exactly once in the required format
            print("ACTIVE MODEL")
            print(f"FILE: {self.model_filename}")
            print(f"TYPE: {self.model_type}")
            print(f"FEATURES: {self.features}")
            print(f"CLASSES: {self.classes}")
            print(f"MODEL PATH: {os.path.abspath(target_file)}")

        except Exception as e:
            print("ERROR LOADING MODEL:", e)
            self.status = f"Failed - {str(e)}"
            self.model = None
            self.model_filename = None
            self.model_type = "Unknown"
            self.features = []
            self.classes = []
            raise e

    def get_metadata(self):
        training_timestamp = None
        if self.model is not None:
            for attr in ['training_timestamp_', 'trained_at_', 'timestamp_', 'training_time_', 'deployed_at']:
                if hasattr(self.model, attr):
                    training_timestamp = str(getattr(self.model, attr))
                    break

        if not training_timestamp and self.model_filename:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            filepath = os.path.join(base_dir, self.model_filename)
            if os.path.exists(filepath):
                try:
                    mtime = os.path.getmtime(filepath)
                    training_timestamp = datetime.datetime.utcfromtimestamp(mtime).isoformat() + 'Z'
                except Exception:
                    pass

        framework = "Unknown"
        if self.model is not None:
            module_name = type(self.model).__module__
            if module_name.startswith('sklearn'):
                framework = "scikit-learn"
            elif module_name.startswith('xgboost'):
                framework = "XGBoost"
            elif module_name.startswith('lightgbm'):
                framework = "LightGBM"
            elif module_name.startswith('keras') or module_name.startswith('tensorflow'):
                framework = "TensorFlow/Keras"
            else:
                framework = module_name.split('.')[0]

        return {
            "model_filename": self.model_filename,
            "model_type": self.model_type if self.model is not None else "Unknown",
            "classes": self.classes,
            "feature_names": self.features,
            "training_timestamp": training_timestamp,
            "feature_count": len(self.features) if self.features else 0,
            "status": self.status,
            "loaded": self.model is not None,
            "framework": framework
        }

    

    def predict(self, mq2, mq5, mq9, mq135, temperature, humidity):
        if self.model is None or "Failed" in self.status:
            return {"gas": "Unknown (Model missing)", "confidence": 0.0}

        try:
            # Map parameters to exact names expected by the model
            # The model was trained with 'temp', so we use that if it exists in expected features
            input_dict = {
                "mq2": mq2,
                "mq5": mq5,
                "mq9": mq9,
                "mq135": mq135
            }
            
            if 'temp' in self.features:
                input_dict['temp'] = temperature
            elif 'temperature' in self.features:
                input_dict['temperature'] = temperature
                
            if 'humidity' in self.features:
                input_dict['humidity'] = humidity

            input_data = pd.DataFrame([input_dict])
            
            # Ensure order matches if feature_names_in_ is present
            if self.features:
                input_data = input_data[self.features]
            
            prediction = self.model.predict(input_data)[0]
            
            if hasattr(self.model, "predict_proba"):
                probabilities = self.model.predict_proba(input_data)[0]
                confidence = float(np.max(probabilities)) * 100.0
                prob_dist = {
                    cls: round(float(prob) * 100.0, 2)
                    for cls, prob in zip(self.classes, probabilities)
                }
            else:
                confidence = 100.0
                prob_dist = {str(prediction): 100.0}
                
            return {
                "gas": str(prediction),
                "confidence": round(confidence, 2),
                "distribution": prob_dist
            }
        except Exception as e:
            print(f"Prediction error: {e}")
            return {"gas": "Error", "confidence": 0.0}

predictor = ENOSEPredictor()

import os
import glob
import joblib
import pandas as pd
import numpy as np

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
        target_dir = os.path.join(base_dir, self.models_dir)
        
        # Search for model files
        pattern_pkl = os.path.join(target_dir, "*.pkl")
        pattern_joblib = os.path.join(target_dir, "*.joblib")
        
        files = glob.glob(pattern_pkl) + glob.glob(pattern_joblib)
        
        # Prefer e_nose_model.pkl if multiple exist
        target_file = None
        for f in files:
            if "e_nose_model.pkl" in f:
                target_file = f
                break
        
        if not target_file and files:
            target_file = files[0]
            
        if not target_file:
            print("No model found. Running without predictions.")
            self.status = "Failed - No model found"
            return
            
        try:
            self.model = joblib.load(target_file)
            self.model_filename = os.path.basename(target_file)
            self.model_type = type(self.model).__name__
            self.status = "Loaded"
            
            if hasattr(self.model, 'n_features_in_'):
                if self.model.n_features_in_ != 6:
                    print(f"WARNING: Expected 6 features, model has {self.model.n_features_in_}")
                    self.status = "Failed - Feature count mismatch"
                    self.model = None
                    return
            
            if hasattr(self.model, 'feature_names_in_'):
                self.features = list(self.model.feature_names_in_)
            else:
                self.features = ['mq2', 'mq5', 'mq9', 'mq135', 'temperature', 'humidity']
                
            if hasattr(self.model, 'classes_'):
                self.classes = list(self.model.classes_)
                
            print(f"Model loaded successfully from {target_file}")
            print(f"Features: {self.features}")
            print(f"Classes: {self.classes}")
            
        except Exception as e:
            print(f"Error loading model: {e}")
            self.status = f"Failed - {str(e)}"

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

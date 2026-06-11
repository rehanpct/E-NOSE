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

        pattern_pkl = os.path.join(target_dir, "*.pkl")
        pattern_joblib = os.path.join(target_dir, "*.joblib")

        files = glob.glob(pattern_pkl) + glob.glob(pattern_joblib)

        print("\n" + "=" * 70)
        print("SEARCHING FOR MODELS")
        print("=" * 70)

        if not files:
            print("No model files found.")
            self.status = "Failed - No model found"
            return

        for f in files:
            print("FOUND:", f)

        target_file = None

        for f in files:
            if os.path.basename(f).lower() == "e_nose_model_new.pkl":
                target_file = f
                print("\nUsing preferred model: e_nose_model_new.pkl")
                break

        if not target_file:
            for f in files:
                if os.path.basename(f).lower() == "e_nose_model.pkl":
                    target_file = f
                    print("\nUsing fallback model: e_nose_model.pkl")
                    break

        if not target_file:
            files.sort(key=os.path.getmtime, reverse=True)
            target_file = files[0]
            print("\nUsing newest available model")

        try:
            print("\n" + "=" * 70)
            print("LOADING MODEL:")
            print(target_file)
            print("=" * 70)

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

            print("MODEL TYPE:", self.model_type)

        except Exception as e:
            print("ERROR:", e)
            self.status = f"Failed - {str(e)}"
            self.model = None

    

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

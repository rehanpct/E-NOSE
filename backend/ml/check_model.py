# check_model.py

import joblib

model = joblib.load(r"E:\ENOSE\backend\ml\e_nose_model.pkl")

print(type(model).__name__)

if hasattr(model, "n_estimators"):
    print("n_estimators =", model.n_estimators)

if hasattr(model, "max_depth"):
    print("max_depth =", model.max_depth)

if hasattr(model, "classes_"):
    print("classes =", model.classes_)

if hasattr(model, "feature_names_in_"):
    print("features =", model.feature_names_in_)
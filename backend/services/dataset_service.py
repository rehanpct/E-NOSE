import os
import csv
from datetime import datetime
from models import db
from models.dataset_sample import DatasetSample

class DatasetService:
    def __init__(self):
        self.state = {
            "is_collecting": False,
            "current_label": "Clean Air",
            "samples_collected": 0,
            "start_time": None
        }

    def append_to_csv(self, raw_data, norm_data, temperature, humidity, label):
        csv_dir = os.path.join(os.path.dirname(__file__), '..', 'datasets')
        os.makedirs(csv_dir, exist_ok=True)
        csv_file = os.path.join(csv_dir, 'collection.csv')
        
        file_exists = os.path.isfile(csv_file)
        with open(csv_file, mode='a', newline='') as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow([
                    'timestamp', 
                    'raw_mq2', 'raw_mq5', 'raw_mq9', 'raw_mq135',
                    'norm_mq2', 'norm_mq5', 'norm_mq9', 'norm_mq135',
                    'temperature', 'humidity', 'label'
                ])
            
            writer.writerow([
                datetime.utcnow().isoformat(),
                raw_data['mq2'], raw_data['mq5'], raw_data['mq9'], raw_data['mq135'],
                norm_data['mq2'], norm_data['mq5'], norm_data['mq9'], norm_data['mq135'],
                temperature, humidity, label
            ])

    def record_sample(self, raw_data, norm_data, temperature, humidity):
        if not self.state["is_collecting"]:
            return None
            
        label = self.state["current_label"]
        sample = DatasetSample(
            raw_mq2=raw_data['mq2'], raw_mq5=raw_data['mq5'], 
            raw_mq9=raw_data['mq9'], raw_mq135=raw_data['mq135'],
            normalized_mq2=norm_data['mq2'], normalized_mq5=norm_data['mq5'], 
            normalized_mq9=norm_data['mq9'], normalized_mq135=norm_data['mq135'],
            temperature=temperature, humidity=humidity,
            label=label
        )
        db.session.add(sample)
        self.append_to_csv(raw_data, norm_data, temperature, humidity, label)
        self.state["samples_collected"] += 1
        
        # Stop capture automatically if target count reached
        if self.state.get("target_count") and self.state["samples_collected"] >= self.state["target_count"]:
            self.state["is_collecting"] = False
            
        return sample

    def get_quality_metrics(self):
        samples = DatasetSample.query.all()
        total_db = len(samples)
        
        # Count CSV rows
        csv_file = os.path.join(os.path.dirname(__file__), '..', 'datasets', 'collection.csv')
        total_csv = 0
        if os.path.isfile(csv_file):
            with open(csv_file, mode='r') as f:
                # subtract 1 for header
                total_csv = sum(1 for line in f) - 1
                
        # Class distribution
        class_counts = {}
        for s in samples:
            class_counts[s.label] = class_counts.get(s.label, 0) + 1
            
        # Class imbalance calculation
        if class_counts:
            max_class = max(class_counts.values())
            min_class = min(class_counts.values())
            imbalance_ratio = round(max_class / min_class, 2) if min_class > 0 else float('inf')
        else:
            imbalance_ratio = 0
            
        # Simulate missing values check (in reality would check each row)
        missing_values = sum(1 for s in samples if s.temperature is None or s.raw_mq2 is None)
        
        return {
            "total_db_samples": total_db,
            "total_csv_samples": total_csv,
            "integrity_match": total_db == max(0, total_csv),
            "class_distribution": class_counts,
            "imbalance_ratio": imbalance_ratio,
            "missing_values": missing_values,
            "duplicate_samples": 0 # simplified
        }

dataset_service = DatasetService()

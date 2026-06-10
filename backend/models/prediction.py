from datetime import datetime
from . import db

class Prediction(db.Model):
    __tablename__ = 'predictions'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    predicted_gas = db.Column(db.String(50), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    
    # Storing inputs for prediction history tracking
    raw_mq2 = db.Column(db.Float, nullable=False)
    raw_mq5 = db.Column(db.Float, nullable=False)
    raw_mq9 = db.Column(db.Float, nullable=False)
    raw_mq135 = db.Column(db.Float, nullable=False)
    
    normalized_mq2 = db.Column(db.Float, nullable=False)
    normalized_mq5 = db.Column(db.Float, nullable=False)
    normalized_mq9 = db.Column(db.Float, nullable=False)
    normalized_mq135 = db.Column(db.Float, nullable=False)
    
    temperature = db.Column(db.Float, nullable=False)
    humidity = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() + 'Z',
            'predicted_gas': self.predicted_gas,
            'confidence': self.confidence,
            'raw_mq2': self.raw_mq2,
            'raw_mq5': self.raw_mq5,
            'raw_mq9': self.raw_mq9,
            'raw_mq135': self.raw_mq135,
            'normalized_mq2': self.normalized_mq2,
            'normalized_mq5': self.normalized_mq5,
            'normalized_mq9': self.normalized_mq9,
            'normalized_mq135': self.normalized_mq135,
            'temperature': self.temperature,
            'humidity': self.humidity
        }

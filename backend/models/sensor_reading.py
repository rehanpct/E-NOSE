from datetime import datetime
from . import db

class SensorReading(db.Model):
    __tablename__ = 'sensor_readings'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Raw values
    raw_mq2 = db.Column(db.Float, nullable=False)
    raw_mq5 = db.Column(db.Float, nullable=False)
    raw_mq9 = db.Column(db.Float, nullable=False)
    raw_mq135 = db.Column(db.Float, nullable=False)
    
    # Normalized values (0-100)
    normalized_mq2 = db.Column(db.Float, nullable=False)
    normalized_mq5 = db.Column(db.Float, nullable=False)
    normalized_mq9 = db.Column(db.Float, nullable=False)
    normalized_mq135 = db.Column(db.Float, nullable=False)
    
    temperature = db.Column(db.Float, nullable=False)
    humidity = db.Column(db.Float, nullable=False)
    
    # Air Quality Engine Score (0-100)
    eqs = db.Column(db.Float, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() + 'Z',
            'raw_mq2': self.raw_mq2,
            'raw_mq5': self.raw_mq5,
            'raw_mq9': self.raw_mq9,
            'raw_mq135': self.raw_mq135,
            'normalized_mq2': self.normalized_mq2,
            'normalized_mq5': self.normalized_mq5,
            'normalized_mq9': self.normalized_mq9,
            'normalized_mq135': self.normalized_mq135,
            'temperature': self.temperature,
            'humidity': self.humidity,
            'eqs': self.eqs
        }

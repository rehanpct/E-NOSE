from datetime import datetime
from . import db

class Alert(db.Model):
    __tablename__ = 'alerts'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    sensor = db.Column(db.String(50), nullable=False)
    value = db.Column(db.Float, nullable=False)
    severity = db.Column(db.String(20), nullable=False)
    message = db.Column(db.String(255), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() + 'Z',
            'sensor': self.sensor,
            'value': self.value,
            'severity': self.severity,
            'message': self.message
        }

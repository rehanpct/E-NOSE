from datetime import datetime
from . import db

class Telemetry(db.Model):
    __tablename__ = 'telemetry'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    altitude = db.Column(db.Float, nullable=False)
    speed = db.Column(db.Float, nullable=False)
    battery = db.Column(db.Float, nullable=False)
    signal_strength = db.Column(db.Float, nullable=False)
    
    # New fields for Priority 11
    heading = db.Column(db.Float, nullable=True)
    mission_status = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() + 'Z',
            'latitude': self.latitude,
            'longitude': self.longitude,
            'altitude': self.altitude,
            'speed': self.speed,
            'battery': self.battery,
            'signal_strength': self.signal_strength,
            'heading': self.heading,
            'mission_status': self.mission_status
        }

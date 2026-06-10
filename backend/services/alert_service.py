from models.alert import Alert
from models import db

THRESHOLDS = {
    'mq2': {'warning': 1500, 'critical': 2500},
    'mq5': {'warning': 1000, 'critical': 1800},
    'mq9': {'warning': 800, 'critical': 1500},
    'mq135': {'warning': 600, 'critical': 1200},
}

def evaluate_thresholds(sensor_data):
    """
    Evaluates sensor readings against thresholds and returns any alerts generated.
    """
    alerts = []
    
    for sensor_name, value in sensor_data.items():
        if sensor_name in THRESHOLDS:
            thresholds = THRESHOLDS[sensor_name]
            if value >= thresholds['critical']:
                alert = Alert(
                    sensor=sensor_name,
                    value=value,
                    severity='CRITICAL',
                    message=f"{sensor_name.upper()} critical limit exceeded ({value})"
                )
                alerts.append(alert)
            elif value >= thresholds['warning']:
                alert = Alert(
                    sensor=sensor_name,
                    value=value,
                    severity='WARNING',
                    message=f"{sensor_name.upper()} warning limit exceeded ({value})"
                )
                alerts.append(alert)
                
    return alerts

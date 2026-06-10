class NormalizationService:
    def __init__(self):
        # In-memory min/max tracking for Min-Max scaling
        # Defaults based on typical analogRead ranges (0-4095 for ESP32)
        # But we will dynamically update these bounds.
        self.bounds = {
            'mq2': {'min': float('inf'), 'max': float('-inf')},
            'mq5': {'min': float('inf'), 'max': float('-inf')},
            'mq9': {'min': float('inf'), 'max': float('-inf')},
            'mq135': {'min': float('inf'), 'max': float('-inf')}
        }

    def _update_bounds(self, sensor, value):
        if value < self.bounds[sensor]['min']:
            self.bounds[sensor]['min'] = value
        if value > self.bounds[sensor]['max']:
            self.bounds[sensor]['max'] = value

    def _normalize(self, sensor, value):
        min_val = self.bounds[sensor]['min']
        max_val = self.bounds[sensor]['max']
        
        # Prevent division by zero if min == max
        if max_val == min_val:
            return 0.0
            
        normalized = ((value - min_val) / (max_val - min_val)) * 100.0
        return round(normalized, 2)

    def process(self, raw_data):
        normalized_data = {}
        for sensor in ['mq2', 'mq5', 'mq9', 'mq135']:
            value = raw_data.get(sensor, 0)
            self._update_bounds(sensor, value)
            normalized_data[sensor] = self._normalize(sensor, value)
            
        return normalized_data

normalizer = NormalizationService()

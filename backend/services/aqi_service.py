class AQIService:
    def __init__(self):
        self.weights = {
            'mq135': 0.35, # Air Quality
            'mq2': 0.25,   # Combustibles/Smoke
            'mq5': 0.20,   # LPG/Natural Gas
            'mq9': 0.15    # CO/Combustibles
        }
        self.temp_hum_weight = 0.05

    def calculate_eqs(self, normalized_data, temperature, humidity):
        """
        Calculates the Environmental Quality Score (0-100).
        100 = Excellent, 0 = Hazardous.
        Normalized data is 0-100 where 100 means max gas recorded (bad).
        """
        score = 0.0
        
        # For gas sensors, lower normalized value is better.
        # So we invert it: (100 - normalized_value)
        for sensor, weight in self.weights.items():
            val = normalized_data.get(sensor, 0)
            score += (100.0 - val) * weight
            
        # Add Temp/Hum compensation (simplified heuristic)
        # Optimal comfort: Temp 22-26C, Humidity 40-60%
        temp_score = 100.0
        if temperature < 20 or temperature > 28:
            temp_score -= abs(24 - temperature) * 5
            
        hum_score = 100.0
        if humidity < 30 or humidity > 70:
            hum_score -= abs(50 - humidity) * 2
            
        temp_score = max(0, min(100, temp_score))
        hum_score = max(0, min(100, hum_score))
        
        env_factor = (temp_score + hum_score) / 2.0
        score += env_factor * self.temp_hum_weight
        
        score = max(0.0, min(100.0, score))
        return round(score, 2)

    def get_category(self, eqs):
        if eqs >= 90: return "Excellent"
        if eqs >= 75: return "Good"
        if eqs >= 50: return "Moderate"
        if eqs >= 25: return "Poor"
        return "Hazardous"

    def calculate_indices(self, normalized_data, eqs):
        """Derived air-quality indices from normalized sensor readings (0-100 scale)."""
        mq2   = normalized_data.get('mq2',   0)
        mq5   = normalized_data.get('mq5',   0)
        mq9   = normalized_data.get('mq9',   0)
        mq135 = normalized_data.get('mq135', 0)

        # Smoke Index: MQ-2 (combustible/smoke, 60%) + MQ-9 (CO/combustible, 40%)
        smoke_index = round(min(100.0, mq2 * 0.6 + mq9 * 0.4), 2)

        # VOC Index: MQ-135 (air quality / VOC primary, 75%) + MQ-5 (organic vapours, 25%)
        voc_index = round(min(100.0, mq135 * 0.75 + mq5 * 0.25), 2)

        # Air Quality Index: EQS score (already 0-100, 100 = clean)
        air_quality_index = round(eqs, 2)

        # Hazard Level: sensor-weighted composite (before gas-type boost applied in app.py)
        # MQ-2=30%, MQ-5=20%, MQ-9=20%, MQ-135=30%
        hazard_level = round(
            min(100.0, mq2 * 0.30 + mq5 * 0.20 + mq9 * 0.20 + mq135 * 0.30), 2
        )

        # Pollution Score: inverse of EQS — higher pollution = lower environmental quality
        pollution_score = round(max(0.0, min(100.0, 100.0 - eqs)), 2)

        return {
            'smoke_index':      smoke_index,
            'voc_index':        voc_index,
            'air_quality_index': air_quality_index,
            'hazard_level':     hazard_level,
            'pollution_score':  pollution_score,
        }

aqi_engine = AQIService()

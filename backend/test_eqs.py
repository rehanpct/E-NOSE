import unittest
from services.aqi_service import AQIService

class TestAQIService(unittest.TestCase):
    def setUp(self):
        self.aqi_engine = AQIService()

    def test_excellent_air_quality(self):
        # 0 normalized gas means perfectly clean air
        norm_data = {'mq2': 0, 'mq5': 0, 'mq9': 0, 'mq135': 0}
        temperature = 24 # optimal
        humidity = 50    # optimal
        
        score = self.aqi_engine.calculate_eqs(norm_data, temperature, humidity)
        category = self.aqi_engine.get_category(score)
        
        # 95 from gas + 5 from env
        self.assertGreaterEqual(score, 99.0)
        self.assertEqual(category, "Excellent")

    def test_hazardous_air_quality(self):
        # 100 normalized gas means max detected
        norm_data = {'mq2': 100, 'mq5': 100, 'mq9': 100, 'mq135': 100}
        temperature = 40 # bad
        humidity = 10    # bad
        
        score = self.aqi_engine.calculate_eqs(norm_data, temperature, humidity)
        category = self.aqi_engine.get_category(score)
        
        self.assertLessEqual(score, 10.0)
        self.assertEqual(category, "Hazardous")

    def test_moderate_air_quality(self):
        # Mixed levels
        norm_data = {'mq2': 50, 'mq5': 30, 'mq9': 20, 'mq135': 60}
        temperature = 28 # slight penalty
        humidity = 60    # slight penalty
        
        score = self.aqi_engine.calculate_eqs(norm_data, temperature, humidity)
        category = self.aqi_engine.get_category(score)
        
        self.assertTrue(50 <= score <= 75)
        self.assertIn(category, ["Moderate", "Good"])

if __name__ == '__main__':
    unittest.main()

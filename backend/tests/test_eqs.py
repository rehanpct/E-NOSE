import unittest
from services.aqi_service import aqi_engine
from services.normalization_service import normalizer

class TestEQS(unittest.TestCase):
    def setUp(self):
        # Reset bounds for predictable testing
        normalizer.bounds = {
            'mq2': {'min': 100, 'max': 1000},
            'mq5': {'min': 100, 'max': 1000},
            'mq9': {'min': 100, 'max': 1000},
            'mq135': {'min': 100, 'max': 1000}
        }

    def test_clean_air_high_score(self):
        # Low gas readings
        raw_dict = {'mq2': 100, 'mq5': 100, 'mq9': 100, 'mq135': 100}
        norm_dict = normalizer.process(raw_dict)
        eqs = aqi_engine.calculate_eqs(norm_dict, temperature=25, humidity=50)
        self.assertGreaterEqual(eqs, 90)

    def test_hazardous_air_low_score(self):
        # High gas readings
        raw_dict = {'mq2': 1000, 'mq5': 1000, 'mq9': 1000, 'mq135': 1000}
        norm_dict = normalizer.process(raw_dict)
        eqs = aqi_engine.calculate_eqs(norm_dict, temperature=35, humidity=80)
        self.assertLessEqual(eqs, 30)

if __name__ == '__main__':
    unittest.main()

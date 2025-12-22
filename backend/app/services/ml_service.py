"""
ML Service wrapper for FastAPI backend
Interfaces with the ML engine for predictions and retraining
"""

import sys
import os

# Add ml_engine to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../ml_engine'))

try:
    from prediction_service import YieldPredictionService
    from retrain import ModelRetrainer
    ML_AVAILABLE = True
except Exception as e:
    print(f"⚠️ ML service unavailable: {e}")
    ML_AVAILABLE = False
    YieldPredictionService = None
    ModelRetrainer = None


class MLService:
    """ML service for yield prediction and model retraining"""
    
    def __init__(self):
        """Initialize prediction service and retrainer"""
        if not ML_AVAILABLE:
            print("⚠️ ML Service initialized (degraded mode - ML unavailable)")
            self.predictor = None
            self.retrainer = None
            return
            
        try:
            model_dir = os.path.join(os.path.dirname(__file__), '../../../data/models')
            self.predictor = YieldPredictionService(model_dir=model_dir)
            self.retrainer = ModelRetrainer(
                data_dir=os.path.join(os.path.dirname(__file__), '../../../data')
            )
            print("ML Service initialized")
        except Exception as e:
            print(f"⚠️ ML Service initialization failed: {e}")
            self.predictor = None
            self.retrainer = None
    
    def predict_yield(self, seed_config, daily_logs):
        """
        Make yield prediction
        
        Args:
            seed_config: Dict with seed parameters
            daily_logs: List of daily log dicts
        
        Returns:
            dict: Prediction with yield and suggestions
        """
        if not self.predictor:
            # Return default prediction if ML unavailable
            return {
                'predicted_yield': seed_config.get('base_yield', 500),
                'base_yield': seed_config.get('base_yield', 500),
                'yield_efficiency': 1.0,
                'potential_loss': 0,
                'suggestions': [],
                'status': 'degraded'
            }
        return self.predictor.predict_yield(seed_config, daily_logs)
    
    def add_training_data(self, seed, daily_logs, final_yield):
        """
        Add harvest data to training set
        
        Args:
            seed: Seed model instance
            daily_logs: List of daily log dicts
            final_yield: Actual harvested weight
        """
        # Prepare crop data
        crop_data = {
            'seed_type': seed.seed_type,
            'seed_config': {
                'name': seed.name,
                'difficulty': seed.difficulty,
                'base_yield': seed.avg_yield_grams,
                'growth_days': seed.growth_days,
                'ideal_temp': seed.ideal_temp,
                'ideal_humidity': seed.ideal_humidity
            },
            'daily_logs': daily_logs,
            'final_yield': final_yield
        }
        
        # Add to training set
        num_samples = self.retrainer.add_harvest_data(crop_data)
        
        # Check if should retrain
        if self.retrainer.should_retrain(min_new_samples=10):
            print(f"Triggering model retraining with {num_samples} real samples...")
            result = self.retrainer.retrain_models()
            
            if result['success']:
                # Reload predictor with new models
                model_dir = os.path.join(os.path.dirname(__file__), '../../../data/models')
                self.predictor = YieldPredictionService(model_dir=model_dir)
                print("Model successfully retrained and reloaded!")
            
            return result
        
        return {'success': True, 'retraining_triggered': False}


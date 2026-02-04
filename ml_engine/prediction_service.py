"""
Prediction service for real-time yield forecasting
Loads pre-trained models and provides prediction API
"""

import pandas as pd
import numpy as np
from train_model import MicrogreensYieldPredictor
import json


class YieldPredictionService:
    """Service for making real-time yield predictions"""
    
    def __init__(self, model_dir='../data/models'):
        """Load trained models"""
        self.predictor = MicrogreensYieldPredictor()
        self.predictor.load_models(model_dir)
        print("Prediction service initialized")
    
    def predict_yield(self, seed_config, daily_logs):
        """
        Predict final yield based on current progress
        
        Args:
            seed_config: Dict with seed parameters (name, base_yield, ideal_temp, target_density, etc.)
            daily_logs: List of daily log dictionaries
        
        Returns:
            dict: Prediction result with yield and suggestions
        """
        if not daily_logs:
            return {
                'predicted_yield': seed_config['base_yield'],
                'base_yield': seed_config['base_yield'],
                'yield_efficiency': 1.0,
                'potential_loss': 0,
                'suggestions': [{
                    'type': 'success',
                    'issue': 'Ready to Start!',
                    'message': 'Everything looks good. Prediction will update once cultivation begins.',
                    'potential_loss': None
                }],
                'status': 'excellent'
            }
            
        # Calculate aggregate features
        num_days = len(daily_logs)
        
        avg_temp = np.mean([log['temperature'] for log in daily_logs])
        avg_humidity = np.mean([log['humidity'] for log in daily_logs])
        watering_consistency = sum([log['watered'] for log in daily_logs]) / num_days
        
        temp_deviation = np.mean([
            abs(log['temperature'] - seed_config['ideal_temp']) for log in daily_logs
        ])
        humidity_deviation = np.mean([
            abs(log['humidity'] - seed_config['ideal_humidity']) for log in daily_logs
        ])
        
        # Count stress days
        temp_stress_days = sum([
            1 for log in daily_logs 
            if abs(log['temperature'] - seed_config['ideal_temp']) > 3
        ])
        humidity_stress_days = sum([
            1 for log in daily_logs 
            if abs(log['humidity'] - seed_config['ideal_humidity']) > 15
        ])
        missed_watering_days = sum([1 for log in daily_logs if not log['watered']])
        
        # Max/Min values
        max_humidity = max([log['humidity'] for log in daily_logs])
        min_humidity = min([log['humidity'] for log in daily_logs])
        
        # New Features: Latest Height and Seeding Density
        latest_height = daily_logs[-1].get('measured_height_mm', 0)
        # If density not provided in logs/config, use target density
        seeding_density = seed_config.get('seeding_density', seed_config.get('target_density', seed_config['base_yield'] / 1290.0))
        
        # Create feature DataFrame
        features = pd.DataFrame([{
            'seed_type': seed_config['seed_type'],
            'seed_name': seed_config['name'],
            'difficulty': seed_config['difficulty'],
            'base_yield': seed_config['base_yield'],
            'growth_days': seed_config['growth_days'],
            'ideal_temp': seed_config['ideal_temp'],
            'ideal_humidity': seed_config['ideal_humidity'],
            'avg_temp': round(avg_temp, 2),
            'avg_humidity': round(avg_humidity, 2),
            'temp_deviation': round(temp_deviation, 2),
            'humidity_deviation': round(humidity_deviation, 2),
            'watering_consistency': round(watering_consistency, 2),
            'temp_stress_days': temp_stress_days,
            'humidity_stress_days': humidity_stress_days,
            'missed_watering_days': missed_watering_days,
            'max_temp': max_temp,
            'min_temp': min_temp,
            'max_humidity': max_humidity,
            'min_humidity': min_humidity,
            'latest_height_mm': latest_height,
            'seeding_density_g_cm2': seeding_density
        }])
        
        # Make prediction
        predicted_yield = self.predictor.predict(features)[0]
        
        # Generate suggestions based on latest log
        latest_log = daily_logs[-1]
        suggestions = self._generate_suggestions(
            latest_log, seed_config, predicted_yield
        )
        
        return {
            'predicted_yield': round(predicted_yield, 1),
            'base_yield': seed_config['base_yield'],
            'yield_efficiency': round(predicted_yield / seed_config['base_yield'], 3),
            'potential_loss': round(seed_config['base_yield'] - predicted_yield, 1),
            'suggestions': suggestions,
            'status': self._get_status(predicted_yield, seed_config['base_yield'])
        }
    
    def _generate_suggestions(self, latest_log, seed_config, predicted_yield):
        """Generate actionable suggestions based on conditions"""
        suggestions = []
        
        temp = latest_log['temperature']
        humidity = latest_log['humidity']
        watered = latest_log['watered']
        
        ideal_temp = seed_config['ideal_temp']
        ideal_humidity = seed_config['ideal_humidity']
        
        # Temperature suggestions
        if temp > ideal_temp + 4:
            loss = round((temp - ideal_temp) * 8, 1)
            suggestions.append({
                'type': 'critical',
                'issue': 'Heat Stress Detected',
                'message': f'Temperature ({temp}°C) is too high. Move to cooler spot or add fan.',
                'potential_loss': f'{loss}g'
            })
        elif temp > ideal_temp + 2:
            suggestions.append({
                'type': 'warning',
                'issue': 'Above Ideal Temperature',
                'message': f'Try to lower temperature closer to {ideal_temp}°C for optimal growth.',
                'potential_loss': None
            })
        elif temp < ideal_temp - 4:
            suggestions.append({
                'type': 'warning',
                'issue': 'Temperature Too Low',
                'message': f'Consider moving to warmer location. Ideal: {ideal_temp}°C.',
                'potential_loss': None
            })
        
        # Humidity suggestions
        if humidity < 35:
            suggestions.append({
                'type': 'warning',
                'issue': 'Air Too Dry',
                'message': 'Mist lightly or add humidity dome to prevent wilting.',
                'potential_loss': None
            })
        elif humidity > 70:
            suggestions.append({
                'type': 'warning',
                'issue': 'High Humidity',
                'message': 'Improve air circulation to prevent mold growth.',
                'potential_loss': None
            })
        
        # Watering suggestions
        if not watered:
            suggestions.append({
                'type': 'critical',
                'issue': 'Missed Watering!',
                'message': 'Water immediately to prevent wilting and yield loss.',
                'potential_loss': '25-40g'
            })
        
        # Perfect conditions
        if not suggestions:
            suggestions.append({
                'type': 'success',
                'issue': 'Perfect Conditions!',
                'message': f"Keep it up! You're on track for {round(predicted_yield, 0)}g yield.",
                'potential_loss': None
            })
        
        return suggestions
    
    def _get_status(self, predicted_yield, base_yield):
        """Determine growth status"""
        efficiency = predicted_yield / base_yield
        
        if efficiency >= 0.95:
            return 'excellent'
        elif efficiency >= 0.85:
            return 'good'
        elif efficiency >= 0.70:
            return 'fair'
        else:
            return 'poor'


if __name__ == '__main__':
    # Test the prediction service
    print("=== Testing Prediction Service ===\n")
    
    service = YieldPredictionService()
    
    # Example seed config (Sunflower)
    seed_config = {
        'seed_type': 'sunflower',
        'name': 'Sunflower',
        'difficulty': 'Easy',
        'base_yield': 600,
        'growth_days': 10,
        'ideal_temp': 22.5,
        'ideal_humidity': 50
    }
    
    # Example daily logs (first 5 days)
    daily_logs = [
        {'day': 1, 'temperature': 23.0, 'humidity': 52, 'watered': True},
        {'day': 2, 'temperature': 22.5, 'humidity': 50, 'watered': True},
        {'day': 3, 'temperature': 24.0, 'humidity': 48, 'watered': True},
        {'day': 4, 'temperature': 23.5, 'humidity': 51, 'watered': True},
        {'day': 5, 'temperature': 22.0, 'humidity': 53, 'watered': True},
    ]
    
    result = service.predict_yield(seed_config, daily_logs)
    
    print(f"Predicted Yield: {result['predicted_yield']}g")
    print(f"Base Yield: {result['base_yield']}g")
    print(f"Yield Efficiency: {result['yield_efficiency'] * 100:.1f}%")
    print(f"Potential Loss: {result['potential_loss']}g")
    print(f"Status: {result['status']}")
    print(f"\nSuggestions:")
    for suggestion in result['suggestions']:
        print(f"  [{suggestion['type'].upper()}] {suggestion['issue']}")
        print(f"    {suggestion['message']}")
        if suggestion['potential_loss']:
            print(f"    Potential loss: {suggestion['potential_loss']}")


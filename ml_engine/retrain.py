"""
Auto-retraining pipeline for continuous model improvement
Triggers after harvest to incorporate new real-world data
"""

import pandas as pd
import numpy as np
from train_model import MicrogreensYieldPredictor
from datetime import datetime
import json
import os


class ModelRetrainer:
    """Handles model retraining with new harvest data"""
    
    def __init__(self, data_dir='../data'):
        self.data_dir = data_dir
        self.synthetic_data_path = f'{data_dir}/synthetic_crops.csv'
        self.real_data_path = f'{data_dir}/real_crops.csv'
        self.model_dir = f'{data_dir}/models'
        
    def add_harvest_data(self, crop_data):
        """
        Add new harvest data to training set
        
        Args:
            crop_data: Dict with complete crop lifecycle data
                {
                    'seed_type': str,
                    'seed_config': dict,
                    'daily_logs': list of dicts,
                    'final_yield': float
                }
        """
        # Convert to DataFrame row
        daily_logs = crop_data['daily_logs']
        seed_config = crop_data['seed_config']
        
        # Calculate features
        avg_temp = np.mean([log['temperature'] for log in daily_logs])
        avg_humidity = np.mean([log['humidity'] for log in daily_logs])
        watering_consistency = sum([log['watered'] for log in daily_logs]) / len(daily_logs)
        
        temp_deviation = np.mean([
            abs(log['temperature'] - seed_config['ideal_temp']) for log in daily_logs
        ])
        humidity_deviation = np.mean([
            abs(log['humidity'] - seed_config['ideal_humidity']) for log in daily_logs
        ])
        
        temp_stress_days = sum([
            1 for log in daily_logs 
            if abs(log['temperature'] - seed_config['ideal_temp']) > 3
        ])
        humidity_stress_days = sum([
            1 for log in daily_logs 
            if abs(log['humidity'] - seed_config['ideal_humidity']) > 15
        ])
        missed_watering_days = sum([1 for log in daily_logs if not log['watered']])
        
        max_temp = max([log['temperature'] for log in daily_logs])
        min_temp = min([log['temperature'] for log in daily_logs])
        max_humidity = max([log['humidity'] for log in daily_logs])
        min_humidity = min([log['humidity'] for log in daily_logs])
        
        row = {
            'seed_type': crop_data['seed_type'],
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
            'final_yield': crop_data['final_yield'],
            'yield_efficiency': round(crop_data['final_yield'] / seed_config['base_yield'], 3),
            'daily_logs_json': json.dumps(daily_logs),
            'timestamp': datetime.now().isoformat(),
            'data_source': 'real'
        }
        
        # Append to real data file
        df_new = pd.DataFrame([row])
        
        if os.path.exists(self.real_data_path):
            df_existing = pd.read_csv(self.real_data_path)
            df_combined = pd.concat([df_existing, df_new], ignore_index=True)
        else:
            df_combined = df_new
        
        df_combined.to_csv(self.real_data_path, index=False)
        print(f"Added new harvest data. Total real crops: {len(df_combined)}")
        
        return len(df_combined)
    
    def should_retrain(self, min_new_samples=10):
        """
        Determine if model should be retrained
        
        Args:
            min_new_samples: Minimum new samples before retraining
        
        Returns:
            bool: Whether to trigger retraining
        """
        if not os.path.exists(self.real_data_path):
            return False
        
        df_real = pd.read_csv(self.real_data_path)
        
        # Check when last retrained
        metadata_path = f'{self.model_dir}/model_metadata.json'
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            last_retrain_samples = metadata.get('total_samples', 0)
            new_samples = len(df_real) - metadata.get('real_samples', 0)
            
            return new_samples >= min_new_samples
        
        return len(df_real) >= min_new_samples
    
    def retrain_models(self, real_data_weight=2.0):
        """
        Retrain models with combined synthetic and real data
        
        Args:
            real_data_weight: Weight multiplier for real data samples
        
        Returns:
            dict: Retraining results and metrics
        """
        print("=== Model Retraining Started ===\n")
        
        # Load synthetic data
        df_synthetic = pd.read_csv(self.synthetic_data_path)
        df_synthetic['data_source'] = 'synthetic'
        df_synthetic['sample_weight'] = 1.0
        
        # Load real data
        if os.path.exists(self.real_data_path):
            df_real = pd.read_csv(self.real_data_path)
            df_real['sample_weight'] = real_data_weight  # Higher weight for real data
            
            # Combine datasets
            df_combined = pd.concat([df_synthetic, df_real], ignore_index=True)
            
            print(f"Synthetic samples: {len(df_synthetic)}")
            print(f"Real samples: {len(df_real)}")
            print(f"Total samples: {len(df_combined)}")
            print(f"Real data weight: {real_data_weight}x\n")
        else:
            df_combined = df_synthetic
            print("No real data available yet. Using synthetic data only.\n")
        
        # Train new models
        predictor = MicrogreensYieldPredictor()
        metrics = predictor.train(df_combined)
        
        # Backup old models
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_dir = f'{self.model_dir}/backups/{timestamp}'
        os.makedirs(backup_dir, exist_ok=True)
        
        for file in ['rf_model.pkl', 'nn_model.h5', 'model_metadata.json']:
            src = f'{self.model_dir}/{file}'
            if os.path.exists(src):
                import shutil
                shutil.copy(src, f'{backup_dir}/{file}')
        
        print(f"\nOld models backed up to {backup_dir}")
        
        # Save new models
        predictor.save_models(self.model_dir)
        
        # Update metadata with retraining info
        metadata_path = f'{self.model_dir}/model_metadata.json'
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        metadata['last_retrain'] = timestamp
        metadata['total_samples'] = len(df_combined)
        metadata['real_samples'] = len(df_real) if os.path.exists(self.real_data_path) else 0
        metadata['retraining_metrics'] = metrics
        
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print("\n=== Retraining Complete ===")
        print(f"New model Test MAE: {metrics['test_mae']:.2f}g")
        print(f"New model Test R²: {metrics['test_r2']:.4f}")
        
        return {
            'success': True,
            'timestamp': timestamp,
            'metrics': metrics,
            'total_samples': len(df_combined),
            'real_samples': len(df_real) if os.path.exists(self.real_data_path) else 0
        }


if __name__ == '__main__':
    # Test retraining pipeline
    retrainer = ModelRetrainer()
    
    # Example: Add a harvest
    example_harvest = {
        'seed_type': 'sunflower',
        'seed_config': {
            'name': 'Sunflower',
            'difficulty': 'Easy',
            'base_yield': 600,
            'growth_days': 10,
            'ideal_temp': 22.5,
            'ideal_humidity': 50
        },
        'daily_logs': [
            {'day': i, 'temperature': 22 + np.random.normal(0, 1), 
             'humidity': 50 + np.random.normal(0, 3), 
             'watered': True}
            for i in range(1, 11)
        ],
        'final_yield': 585
    }
    
    # Add harvest
    num_samples = retrainer.add_harvest_data(example_harvest)
    
    # Check if should retrain (with low threshold for testing)
    if retrainer.should_retrain(min_new_samples=1):
        print("\nRetraining triggered...")
        result = retrainer.retrain_models()
        print(f"\nRetrain result: {result}")


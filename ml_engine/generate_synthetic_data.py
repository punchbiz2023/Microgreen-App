"""
Synthetic Microgreens Growth Data Generator
Generates realistic crop cycles with environmental conditions and yield outcomes
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

# ... (imports)
import csv
import re
import os

# Helper to load seeds from CSV
def load_seeds_from_csv(csv_path):
    seeds = {}
    print(f"DEBUG: Resolving CSV path: {os.path.abspath(csv_path)}")
    if not os.path.exists(csv_path):
        print(f"Warning: CSV not found at {csv_path}, using hardcoded defaults.")
        return None  # Return None so main logic can use fallback
    
    with open(csv_path, 'r', encoding='latin-1') as f:
        reader = csv.DictReader(f)
        # Strip whitespace from headers
        reader.fieldnames = [name.strip() for name in reader.fieldnames]
        
        # DEBUG: Print headers
        print(f"DEBUG: CSV Headers: {reader.fieldnames}")
        
        for row in reader:
             # Robust lookup
            name = row.get('Crop', 'Unknown')
            # Create slug
            slug = name.lower().replace(' ', '-').replace('(', '').replace(')', '').replace('"', '')
            
            # Parse days
            try:
                growth_text = row.get('Growth Time (Days)', '10')
                growth_days = int(re.search(r'\d+', growth_text).group()) if re.search(r'\d+', growth_text) else 10
            except:
                growth_days = 10
                
            try:
                # Estimate blackout from Sprout Time if possible, else default
                sprout_text = row.get('Sprout Time', '3')
                blackout_days = int(re.search(r'\d+', sprout_text).group()) if re.search(r'\d+', sprout_text) else 3
            except:
                blackout_days = 3

            # Base yield
            try:
                yield_text = row.get('Harvest Weight (gm)', '500')
                base_yield = float(re.search(r'\d+', yield_text).group()) if re.search(r'\d+', yield_text) else 500
            except:
                base_yield = 500
                
            difficulty = 'Medium' # Default as not in CSV explicitly
            
            seeds[slug] = {
                'name': name,
                'difficulty': difficulty,
                'base_yield': base_yield,
                'growth_days': growth_days,
                'ideal_temp': 22.0, # Default
                'ideal_humidity': 50.0, # Default
                'temp_tolerance': 2.5,
                'humidity_tolerance': 10.0,
                'blackout_days': blackout_days
            }
            
    return seeds

# Load seeds
csv_path = os.path.join(os.path.dirname(__file__), '../33_microgreens_full-1.csv')
SEED_TYPES = load_seeds_from_csv(csv_path)

# Fallback if CSV empty or failed
if not SEED_TYPES:
    SEED_TYPES = {
    'sunflower': {
        'name': 'Sunflower',
        'difficulty': 'Easy',
        'base_yield': 600,  # grams per 10x20 tray
        'growth_days': 10,
        'ideal_temp': 22.5,
        'ideal_humidity': 50,
        'temp_tolerance': 2.5,
        'humidity_tolerance': 10,
        'blackout_days': 3
    },
    'radish': {
        'name': 'Radish',
        'difficulty': 'Easy',
        'base_yield': 550,
        'growth_days': 10,
        'ideal_temp': 21,
        'ideal_humidity': 55,
        'temp_tolerance': 3,
        'humidity_tolerance': 12,
        'blackout_days': 3
    },
    'pea': {
        'name': 'Pea Shoots',
        'difficulty': 'Medium',
        'base_yield': 700,
        'growth_days': 12,
        'ideal_temp': 20,
        'ideal_humidity': 50,
        'temp_tolerance': 2,
        'humidity_tolerance': 8,
        'blackout_days': 4
    },
    'broccoli': {
        'name': 'Broccoli',
        'difficulty': 'Medium',
        'base_yield': 500,
        'growth_days': 12,
        'ideal_temp': 21,
        'ideal_humidity': 45,
        'temp_tolerance': 2,
        'humidity_tolerance': 10,
        'blackout_days': 3
    },
    'mustard': {
        'name': 'Mustard',
        'difficulty': 'Easy',
        'base_yield': 480,
        'growth_days': 9,
        'ideal_temp': 22,
        'ideal_humidity': 50,
        'temp_tolerance': 3,
        'humidity_tolerance': 12,
        'blackout_days': 2
    },
    'kale': {
        'name': 'Kale',
        'difficulty': 'Hard',
        'base_yield': 450,
        'growth_days': 14,
        'ideal_temp': 20,
        'ideal_humidity': 45,
        'temp_tolerance': 1.5,
        'humidity_tolerance': 8,
        'blackout_days': 4
    },
    'arugula': {
        'name': 'Arugula',
        'difficulty': 'Easy',
        'base_yield': 520,
        'growth_days': 10,
        'ideal_temp': 21,
        'ideal_humidity': 50,
        'temp_tolerance': 2.5,
        'humidity_tolerance': 10,
        'blackout_days': 3
    }
}


def generate_environmental_conditions(seed_config, day, quality_level='good'):
    """
    Generate realistic temperature and humidity based on quality level
    
    Args:
        seed_config: Dictionary with seed parameters
        day: Current day number
        quality_level: 'perfect', 'good', 'acceptable', 'poor', 'bad'
    
    Returns:
        tuple: (temperature, humidity, watered)
    """
    ideal_temp = seed_config['ideal_temp']
    ideal_humidity = seed_config['ideal_humidity']
    
    if quality_level == 'perfect':
        # Within 0.5°C and 5% humidity of ideal
        temp = np.random.normal(ideal_temp, 0.3)
        humidity = np.random.normal(ideal_humidity, 3)
        watered = True
        
    elif quality_level == 'good':
        # Within tolerance range
        temp = np.random.normal(ideal_temp, seed_config['temp_tolerance'] * 0.5)
        humidity = np.random.normal(ideal_humidity, seed_config['humidity_tolerance'] * 0.5)
        watered = True
        
    elif quality_level == 'acceptable':
        # At edge of tolerance, occasional missed watering
        temp = np.random.normal(ideal_temp, seed_config['temp_tolerance'] * 0.8)
        humidity = np.random.normal(ideal_humidity, seed_config['humidity_tolerance'] * 0.8)
        watered = np.random.random() > 0.1  # 10% chance of missing
        
    elif quality_level == 'poor':
        # Outside tolerance, more missed waterings
        temp = ideal_temp + np.random.normal(0, seed_config['temp_tolerance'] * 1.5)
        humidity = ideal_humidity + np.random.normal(0, seed_config['humidity_tolerance'] * 1.5)
        watered = np.random.random() > 0.25  # 25% chance of missing
        
    else:  # 'bad'
        # Severe stress conditions
        temp = ideal_temp + np.random.normal(0, seed_config['temp_tolerance'] * 2.5)
        humidity = ideal_humidity + np.random.normal(0, seed_config['humidity_tolerance'] * 2)
        watered = np.random.random() > 0.4  # 40% chance of missing
    
    # Clamp to realistic ranges
    temp = np.clip(temp, 15, 35)
    humidity = np.clip(humidity, 25, 85)
    
    return round(temp, 1), round(humidity, 1), watered


def calculate_yield_penalty(seed_config, daily_logs):
    """
    Calculate final yield based on daily conditions
    
    Args:
        seed_config: Dictionary with seed parameters
        daily_logs: List of daily log dictionaries
    
    Returns:
        float: Final yield in grams
    """
    base_yield = seed_config['base_yield']
    cumulative_penalty = 0
    
    for i, log in enumerate(daily_logs):
        day = i + 1
        temp = log['temperature']
        humidity = log['humidity']
        watered = log['watered']
        
        # Temperature penalty
        temp_dev = abs(temp - seed_config['ideal_temp'])
        if temp_dev > seed_config['temp_tolerance']:
            # Exponential penalty for extreme temps
            temp_penalty = (temp_dev - seed_config['temp_tolerance']) ** 1.5 * 2
            cumulative_penalty += temp_penalty
        
        # Humidity penalty
        humidity_dev = abs(humidity - seed_config['ideal_humidity'])
        if humidity_dev > seed_config['humidity_tolerance']:
            humidity_penalty = (humidity_dev - seed_config['humidity_tolerance']) * 0.5
            cumulative_penalty += humidity_penalty
        
        # Watering penalty (more severe in light phase)
        if not watered:
            in_light_phase = day > seed_config['blackout_days']
            water_penalty = 25 if in_light_phase else 15
            cumulative_penalty += water_penalty
        
        # Progressive penalty (problems compound over time)
        if i > 0 and (temp_dev > seed_config['temp_tolerance'] or not watered):
            cumulative_penalty += i * 0.5
    
    # Apply penalty with some randomness
    final_yield = base_yield - cumulative_penalty
    
    # Add natural variation (±5%)
    final_yield *= np.random.uniform(0.95, 1.05)
    
    # Minimum yield threshold
    final_yield = max(final_yield, base_yield * 0.3)
    
    return round(final_yield, 1)


def generate_crop_cycle(seed_type, quality_distribution):
    """
    Generate a complete crop cycle
    
    Args:
        seed_type: Key from SEED_TYPES
        quality_distribution: List of quality levels for each day
    
    Returns:
        dict: Complete crop cycle data
    """
    seed_config = SEED_TYPES[seed_type]
    daily_logs = []
    
    for day in range(1, seed_config['growth_days'] + 1):
        quality = quality_distribution[day - 1]
        temp, humidity, watered = generate_environmental_conditions(
            seed_config, day, quality
        )
        
        daily_logs.append({
            'day': day,
            'temperature': temp,
            'humidity': humidity,
            'watered': watered,
            'phase': 'blackout' if day <= seed_config['blackout_days'] else 'light'
        })
    
    final_yield = calculate_yield_penalty(seed_config, daily_logs)
    
    return {
        'seed_type': seed_type,
        'seed_name': seed_config['name'],
        'difficulty': seed_config['difficulty'],
        'base_yield': seed_config['base_yield'],
        'growth_days': seed_config['growth_days'],
        'ideal_temp': seed_config['ideal_temp'],
        'ideal_humidity': seed_config['ideal_humidity'],
        'daily_logs': daily_logs,
        'final_yield': final_yield
    }


def generate_dataset(num_samples=1000):
    """
    Generate complete synthetic dataset
    
    Args:
        num_samples: Number of crop cycles to generate
    
    Returns:
        pd.DataFrame: Dataset with all features
    """
    all_crops = []
    
    # Distribution of quality levels (realistic user behavior)
    quality_profiles = {
        'excellent_grower': ['perfect'] * 60,
        'good_grower': ['good'] * 60,
        'average_grower': ['good'] * 40 + ['acceptable'] * 20,
        'struggling_grower': ['acceptable'] * 30 + ['poor'] * 30,
        'bad_grower': ['poor'] * 30 + ['bad'] * 30,
    }
    
    profile_weights = [0.10, 0.30, 0.35, 0.15, 0.10]
    
    for i in range(num_samples):
        # Select random seed type
        seed_type = np.random.choice(list(SEED_TYPES.keys()))
        seed_config = SEED_TYPES[seed_type]
        growth_days = seed_config['growth_days']
        
        # Select quality profile
        profile = np.random.choice(list(quality_profiles.keys()), p=profile_weights)
        quality_dist = quality_profiles[profile][:growth_days]
        
        # Add some randomness to profile
        for j in range(len(quality_dist)):
            if np.random.random() < 0.15:  # 15% chance of variation
                quality_dist[j] = np.random.choice(
                    ['perfect', 'good', 'acceptable', 'poor', 'bad']
                )
        
        crop = generate_crop_cycle(seed_type, quality_dist)
        all_crops.append(crop)
        
        if (i + 1) % 100 == 0:
            print(f"Generated {i + 1}/{num_samples} crop cycles...")
    
    # Convert to flat DataFrame format for ML
    rows = []
    for crop in all_crops:
        # Calculate aggregate features
        daily_logs = crop['daily_logs']
        
        avg_temp = np.mean([log['temperature'] for log in daily_logs])
        avg_humidity = np.mean([log['humidity'] for log in daily_logs])
        watering_consistency = sum([log['watered'] for log in daily_logs]) / len(daily_logs)
        
        temp_deviation = np.mean([
            abs(log['temperature'] - crop['ideal_temp']) for log in daily_logs
        ])
        humidity_deviation = np.mean([
            abs(log['humidity'] - crop['ideal_humidity']) for log in daily_logs
        ])
        
        # Days in stress
        temp_stress_days = sum([
            1 for log in daily_logs 
            if abs(log['temperature'] - crop['ideal_temp']) > 3
        ])
        humidity_stress_days = sum([
            1 for log in daily_logs 
            if abs(log['humidity'] - crop['ideal_humidity']) > 15
        ])
        missed_watering_days = sum([1 for log in daily_logs if not log['watered']])
        
        # Max deviations
        max_temp = max([log['temperature'] for log in daily_logs])
        min_temp = min([log['temperature'] for log in daily_logs])
        max_humidity = max([log['humidity'] for log in daily_logs])
        min_humidity = min([log['humidity'] for log in daily_logs])
        
        row = {
            'seed_type': crop['seed_type'],
            'seed_name': crop['seed_name'],
            'difficulty': crop['difficulty'],
            'base_yield': crop['base_yield'],
            'growth_days': crop['growth_days'],
            'ideal_temp': crop['ideal_temp'],
            'ideal_humidity': crop['ideal_humidity'],
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
            'final_yield': crop['final_yield'],
            'yield_efficiency': round(crop['final_yield'] / crop['base_yield'], 3),
            'daily_logs_json': json.dumps(daily_logs)
        }
        
        rows.append(row)
    
    df = pd.DataFrame(rows)
    return df


if __name__ == '__main__':
    print("Generating synthetic microgreens training data...")
    print(f"Seed types: {len(SEED_TYPES)}")
    
    # Generate dataset
    df = generate_dataset(num_samples=1000)
    
    # Save to CSV
    output_path = os.path.join(os.path.dirname(__file__), '../data/synthetic_crops.csv')
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"\nDataset saved to {output_path}")
    
    # Display statistics
    print("\n=== Dataset Statistics ===")
    print(f"Total samples: {len(df)}")
    print(f"\nSeed type distribution:")
    print(df['seed_type'].value_counts())
    print(f"\nYield statistics:")
    print(df['final_yield'].describe())
    print(f"\nYield efficiency statistics:")
    print(df['yield_efficiency'].describe())
    print(f"\nDifficulty distribution:")
    print(df['difficulty'].value_counts())


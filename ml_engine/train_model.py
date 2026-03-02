"""
Train ML models for microgreens yield prediction
Implements Random Forest and Neural Network ensemble
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import json
import os

# TensorFlow imports
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'


class MicrogreensYieldPredictor:
    """Ensemble model for yield prediction"""
    
    def __init__(self):
        self.rf_model = None
        self.nn_model = None
        self.scaler = StandardScaler()
        self.seed_encoder = LabelEncoder()
        self.feature_columns = None
        self.rf_weight = 0.4
        self.nn_weight = 0.6
        
    def prepare_features(self, df, fit_encoders=False):
        """
        Prepare features for training/prediction
        
        Args:
            df: DataFrame with crop data
            fit_encoders: Whether to fit encoders (True for training)
        
        Returns:
            np.array: Prepared feature matrix
        """
        # Encode categorical features
        if fit_encoders:
            df['seed_encoded'] = self.seed_encoder.fit_transform(df['seed_type'])
        else:
            known_classes = set(self.seed_encoder.classes_)
            def safe_encode(val):
                if val in known_classes:
                    return val
                if str(val).replace('---', '-/-') in known_classes:
                    return str(val).replace('---', '-/-')
                if str(val).replace('-/-', '---') in known_classes:
                    return str(val).replace('-/-', '---')
                print(f"Warning: Unknown seed type '{val}', falling back to '{self.seed_encoder.classes_[0]}'")
                return self.seed_encoder.classes_[0]
            
            df['seed_type'] = df['seed_type'].apply(safe_encode)
            df['seed_encoded'] = self.seed_encoder.transform(df['seed_type'])
        
        # Select features for model
        feature_cols = [
            'seed_encoded',
            'base_yield',
            'growth_days',
            'ideal_temp',
            'ideal_humidity',
            'avg_temp',
            'avg_humidity',
            'temp_deviation',
            'humidity_deviation',
            'watering_consistency',
            'temp_stress_days',
            'humidity_stress_days',
            'missed_watering_days',
            'max_temp',
            'min_temp',
            'max_humidity',
            'min_humidity',
            'latest_height_mm',
            'seeding_density_g_cm2'
        ]
        
        X = df[feature_cols].values
        
        # Scale features
        if fit_encoders:
            X = self.scaler.fit_transform(X)
            self.feature_columns = feature_cols
        else:
            X = self.scaler.transform(X)
        
        return X
    
    def build_neural_network(self, input_dim):
        """
        Build neural network architecture
        
        Args:
            input_dim: Number of input features
        
        Returns:
            keras.Model: Compiled neural network
        """
        model = keras.Sequential([
            layers.Input(shape=(input_dim,)),
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.2),
            layers.BatchNormalization(),
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.2),
            layers.BatchNormalization(),
            layers.Dense(32, activation='relu'),
            layers.Dense(16, activation='relu'),
            layers.Dense(1)  # Output: predicted yield
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='huber',  # Robust to outliers
            metrics=['mae', 'mse']
        )
        
        return model
    
    def train(self, df, test_size=0.2, random_state=42):
        """
        Train both Random Forest and Neural Network
        
        Args:
            df: Training DataFrame
            test_size: Fraction for test set
            random_state: Random seed
        
        Returns:
            dict: Training metrics
        """
        print("Preparing features...")
        X = self.prepare_features(df, fit_encoders=True)
        y = df['final_yield'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
        
        # Train Random Forest
        print("\n=== Training Random Forest ===")
        self.rf_model = RandomForestRegressor(
            n_estimators=200,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            max_features='sqrt',
            random_state=random_state,
            n_jobs=-1,
            verbose=1
        )
        
        self.rf_model.fit(X_train, y_train)
        
        # Random Forest predictions
        rf_train_pred = self.rf_model.predict(X_train)
        rf_test_pred = self.rf_model.predict(X_test)
        
        print(f"RF Train MAE: {mean_absolute_error(y_train, rf_train_pred):.2f}g")
        print(f"RF Test MAE: {mean_absolute_error(y_test, rf_test_pred):.2f}g")
        print(f"RF Test R²: {r2_score(y_test, rf_test_pred):.4f}")
        
        # Train Neural Network
        print("\n=== Training Neural Network ===")
        self.nn_model = self.build_neural_network(X.shape[1])
        
        early_stop = callbacks.EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True
        )
        
        reduce_lr = callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=0.00001
        )
        
        history = self.nn_model.fit(
            X_train, y_train,
            validation_data=(X_test, y_test),
            epochs=100,
            batch_size=32,
            callbacks=[early_stop, reduce_lr],
            verbose=1
        )
        
        # Neural Network predictions
        nn_train_pred = self.nn_model.predict(X_train, verbose=0).flatten()
        nn_test_pred = self.nn_model.predict(X_test, verbose=0).flatten()
        
        print(f"\nNN Train MAE: {mean_absolute_error(y_train, nn_train_pred):.2f}g")
        print(f"NN Test MAE: {mean_absolute_error(y_test, nn_test_pred):.2f}g")
        print(f"NN Test R²: {r2_score(y_test, nn_test_pred):.4f}")
        
        # Ensemble predictions
        print("\n=== Ensemble Performance ===")
        ensemble_train_pred = (
            self.rf_weight * rf_train_pred + self.nn_weight * nn_train_pred
        )
        ensemble_test_pred = (
            self.rf_weight * rf_test_pred + self.nn_weight * nn_test_pred
        )
        
        train_mae = mean_absolute_error(y_train, ensemble_train_pred)
        test_mae = mean_absolute_error(y_test, ensemble_test_pred)
        test_rmse = np.sqrt(mean_squared_error(y_test, ensemble_test_pred))
        test_r2 = r2_score(y_test, ensemble_test_pred)
        
        # Calculate accuracy within thresholds
        test_errors = np.abs(y_test - ensemble_test_pred)
        accuracy_20g = (test_errors <= 20).mean() * 100
        accuracy_30g = (test_errors <= 30).mean() * 100
        accuracy_50g = (test_errors <= 50).mean() * 100
        
        print(f"Ensemble Train MAE: {train_mae:.2f}g")
        print(f"Ensemble Test MAE: {test_mae:.2f}g")
        print(f"Ensemble Test RMSE: {test_rmse:.2f}g")
        print(f"Ensemble Test R²: {test_r2:.4f}")
        print(f"\nAccuracy within ±20g: {accuracy_20g:.1f}%")
        print(f"Accuracy within ±30g: {accuracy_30g:.1f}%")
        print(f"Accuracy within ±50g: {accuracy_50g:.1f}%")
        
        # Feature importance
        print("\n=== Top 10 Feature Importances (Random Forest) ===")
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.rf_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(feature_importance.head(10).to_string(index=False))
        
        metrics = {
            'train_mae': float(train_mae),
            'test_mae': float(test_mae),
            'test_rmse': float(test_rmse),
            'test_r2': float(test_r2),
            'accuracy_20g': float(accuracy_20g),
            'accuracy_30g': float(accuracy_30g),
            'accuracy_50g': float(accuracy_50g),
            'rf_weight': self.rf_weight,
            'nn_weight': self.nn_weight,
            'n_samples': len(df),
            'n_features': len(self.feature_columns)
        }
        
        return metrics
    
    def predict(self, features_df):
        """
        Make ensemble prediction
        
        Args:
            features_df: DataFrame with same features as training
        
        Returns:
            np.array: Predicted yields
        """
        X = self.prepare_features(features_df, fit_encoders=False)
        
        rf_pred = self.rf_model.predict(X)
        nn_pred = self.nn_model.predict(X, verbose=0).flatten()
        
        ensemble_pred = self.rf_weight * rf_pred + self.nn_weight * nn_pred
        
        return ensemble_pred
    
    def save_models(self, output_dir='../data/models'):
        """Save trained models and preprocessing objects"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Save Random Forest
        joblib.dump(self.rf_model, f'{output_dir}/rf_model.pkl')
        print(f"Saved Random Forest to {output_dir}/rf_model.pkl")
        
        # Save Neural Network
        self.nn_model.save(f'{output_dir}/nn_model.h5')
        print(f"Saved Neural Network to {output_dir}/nn_model.h5")
        
        # Save preprocessing objects
        joblib.dump(self.scaler, f'{output_dir}/scaler.pkl')
        joblib.dump(self.seed_encoder, f'{output_dir}/seed_encoder.pkl')
        
        # Save metadata
        metadata = {
            'feature_columns': self.feature_columns,
            'rf_weight': self.rf_weight,
            'nn_weight': self.nn_weight,
            'seed_types': self.seed_encoder.classes_.tolist()
        }
        
        with open(f'{output_dir}/model_metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Saved metadata to {output_dir}/model_metadata.json")
    
    def load_models(self, model_dir='../data/models'):
        """Load trained models and preprocessing objects"""
        self.rf_model = joblib.load(f'{model_dir}/rf_model.pkl')
        self.nn_model = keras.models.load_model(f'{model_dir}/nn_model.h5')
        self.scaler = joblib.load(f'{model_dir}/scaler.pkl')
        self.seed_encoder = joblib.load(f'{model_dir}/seed_encoder.pkl')
        
        with open(f'{model_dir}/model_metadata.json', 'r') as f:
            metadata = json.load(f)
        
        self.feature_columns = metadata['feature_columns']
        self.rf_weight = metadata['rf_weight']
        self.nn_weight = metadata['nn_weight']
        
        print(f"Models loaded from {model_dir}")


if __name__ == '__main__':
    print("=== Microgreens Yield Prediction Model Training ===\n")
    
    # Load data
    print("Loading synthetic data...")
    data_path = os.path.join(os.path.dirname(__file__), '../data/synthetic_crops.csv')
    df = pd.read_csv(data_path)
    
    # Sanitize seed_type to match backend slugs (remove commas)
    if 'seed_type' in df.columns:
        df['seed_type'] = df['seed_type'].astype(str).str.replace(',', '', regex=False)
        df['seed_type'] = df['seed_type'].str.replace('-/-', '---', regex=False)
        
    print(f"Loaded {len(df)} samples\n")
    
    # Initialize predictor
    predictor = MicrogreensYieldPredictor()
    
    # Train models
    metrics = predictor.train(df)
    
    # Save models
    print("\n=== Saving Models ===")
    models_dir = os.path.join(os.path.dirname(__file__), '../data/models')
    predictor.save_models(output_dir=models_dir)
    
    # Save metrics
    metrics_path = os.path.join(models_dir, 'training_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print("\n=== Training Complete ===")
    print(f"Final Test MAE: {metrics['test_mae']:.2f}g")
    print(f"Final Test R²: {metrics['test_r2']:.4f}")
    print(f"Models ready for deployment!")


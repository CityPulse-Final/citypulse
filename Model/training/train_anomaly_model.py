import pandas as pd
import numpy as np
import os
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from datetime import datetime

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import MOHALI_CONFIG

class AnomalyModelTrainer:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_cols = ['noise', 'temperature', 'air_quality', 'crowd_density']
        self.models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        os.makedirs(self.models_dir, exist_ok=True)
    
    def load_data(self, data_path=None):
        if data_path is None:
            data_path = os.path.join(
                os.path.dirname(__file__), '..', 'data', 'processed', 'mohali_sensor_data.csv'
            )
        
        if not os.path.exists(data_path):
            print(f"Data file not found: {data_path}")
            print("Generating synthetic training data...")
            from data_generator import generate_mohali_dataset, inject_anomalies
            df = generate_mohali_dataset(days=30, interval_minutes=5)
            df = inject_anomalies(df, anomaly_rate=0.02)
            os.makedirs(os.path.dirname(data_path), exist_ok=True)
            df.to_csv(data_path, index=False)
        
        return pd.read_csv(data_path)
    
    def preprocess(self, df):
        df = df.copy()
        
        # Parse timestamp
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['month'] = df['timestamp'].dt.month
        
        # Add time-based features
        df['is_peak_hour'] = df['hour'].isin([8, 9, 17, 18, 19]).astype(int)
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        
        return df
    
    def calculate_stress_index(self, row):
        n_score = min(((row['noise'] - 40) / 60) * 100, 100)
        t_score = min(((row['temperature'] - 15) / 25) * 100, 100)
        a_score = min((row['air_quality'] / 150) * 100, 100)
        d_score = min((row['crowd_density'] / 30) * 100, 100)
        
        return max(0, round(
            (n_score * 0.4) + (t_score * 0.25) + (a_score * 0.2) + (d_score * 0.15)
        ))
    
    def train(self, contamination=0.02):
        print("Loading data...")
        df = self.load_data()
        
        print(f"Loaded {len(df)} records")
        print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        
        df = self.preprocess(df)
        
        # Calculate stress index
        df['stress_index'] = df.apply(self.calculate_stress_index, axis=1)
        
        # Prepare features
        X = df[self.feature_cols].values
        
        # Scale features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        print(f"Training Isolation Forest (contamination={contamination})...")
        
        self.model = IsolationForest(
            n_estimators=200,
            contamination=contamination,
            max_samples='auto',
            random_state=42,
            n_jobs=-1,
            bootstrap=True
        )
        
        self.model.fit(X_scaled)
        
        # Evaluate
        predictions = self.model.predict(X_scaled)
        anomaly_count = np.sum(predictions == -1)
        anomaly_rate = anomaly_count / len(predictions)
        
        print(f"Training complete")
        print(f"Detected anomalies: {anomaly_count} ({anomaly_rate*100:.2f}%)")
        
        # Analyze anomalies
        df['is_anomaly'] = predictions == -1
        anomalies = df[df['is_anomaly']]
        
        print("\nAnomaly Statistics:")
        print(f"  Average stress index (anomalies): {anomalies['stress_index'].mean():.1f}")
        print(f"  Average stress index (normal): {df[~df['is_anomaly']]['stress_index'].mean():.1f}")
        print(f"  High stress (>80) in anomalies: {(anomalies['stress_index'] > 80).sum()}")
        
        # Save model
        self.save()
        
        return {
            'total_records': len(df),
            'anomaly_count': int(anomaly_count),
            'anomaly_rate': float(anomaly_rate),
            'avg_stress_anomaly': float(anomalies['stress_index'].mean()),
            'avg_stress_normal': float(df[~df['is_anomaly']]['stress_index'].mean())
        }
    
    def save(self):
        model_path = os.path.join(self.models_dir, 'anomaly_model.pkl')
        scaler_path = os.path.join(self.models_dir, 'anomaly_scaler.pkl')
        
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        
        print(f"Model saved to {model_path}")
        print(f"Scaler saved to {scaler_path}")
    
    def evaluate_samples(self, n_samples=10):
        df = self.load_data()
        df = self.preprocess(df)
        
        X = df[self.feature_cols].values
        X_scaled = self.scaler.transform(X)
        
        predictions = self.model.predict(X_scaled)
        scores = self.model.decision_function(X_scaled)
        
        df['anomaly_pred'] = predictions == -1
        df['anomaly_score'] = -scores  # Higher score = more anomalous
        df['stress_index'] = df.apply(self.calculate_stress_index, axis=1)
        
        print("\nSample Anomalies:")
        anomalies = df[df['anomaly_pred']].nlargest(n_samples, 'anomaly_score')
        
        for _, row in anomalies.iterrows():
            print(f"  {row['node_id']} @ {row['timestamp']}")
            print(f"    Stress: {row['stress_index']}, Score: {row['anomaly_score']:.3f}")
            print(f"    Noise: {row['noise']}, Temp: {row['temperature']}, AQI: {row['air_quality']}, Crowd: {row['crowd_density']}")
            print()

if __name__ == '__main__':
    trainer = AnomalyModelTrainer()
    
    # Train with 2% contamination rate (expected anomaly rate)
    results = trainer.train(contamination=0.02)
    
    print("\n" + "="*50)
    print("Training Results:")
    print(f"  Total records: {results['total_records']}")
    print(f"  Anomalies detected: {results['anomaly_count']} ({results['anomaly_rate']*100:.2f}%)")
    print(f"  Avg stress (anomaly): {results['avg_stress_anomaly']:.1f}")
    print(f"  Avg stress (normal): {results['avg_stress_normal']:.1f}")
    
    print("\n" + "="*50)
    trainer.evaluate_samples(5)

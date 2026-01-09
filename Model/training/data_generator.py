import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta
import json

# Data sources for Mohali/Chandigarh region
DATA_SOURCES = {
    'cpcb_aq': {
        'url': 'https://app.cpcbccr.com/ccr/#/caaqm-dashboard-all/caaqm-landing',
        'description': 'Central Pollution Control Board - Air Quality data for Chandigarh region',
        'parameters': ['PM2.5', 'PM10', 'NO2', 'SO2', 'CO', 'O3', 'AQI']
    },
    'openaq': {
        'url': 'https://openaq.org/locations?country=IN&city=Chandigarh',
        'description': 'OpenAQ - Community air quality data',
        'parameters': ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3']
    },
    'meteostat': {
        'url': 'https://meteostat.net/en/station/42101',
        'description': 'Meteostat - Weather data for Chandigarh (Station 42101)',
        'parameters': ['temp', 'humidity', 'wind_speed', 'precipitation']
    }
}

# Mohali-specific baseline patterns derived from regional studies
MOHALI_PATTERNS = {
    'diurnal': {
        'noise': {
            0: 0.6, 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.55, 5: 0.65,
            6: 0.75, 7: 0.85, 8: 0.95, 9: 1.0, 10: 0.95, 11: 0.9,
            12: 0.85, 13: 0.85, 14: 0.9, 15: 0.95, 16: 1.0, 17: 1.05,
            18: 1.1, 19: 1.05, 20: 0.95, 21: 0.85, 22: 0.75, 23: 0.65
        },
        'temp': {
            0: 0.85, 1: 0.82, 2: 0.80, 3: 0.78, 4: 0.77, 5: 0.78,
            6: 0.82, 7: 0.88, 8: 0.93, 9: 0.97, 10: 1.0, 11: 1.02,
            12: 1.05, 13: 1.08, 14: 1.1, 15: 1.08, 16: 1.05, 17: 1.0,
            18: 0.95, 19: 0.92, 20: 0.90, 21: 0.88, 22: 0.87, 23: 0.86
        },
        'aqi': {
            0: 0.85, 1: 0.82, 2: 0.80, 3: 0.80, 4: 0.82, 5: 0.88,
            6: 0.95, 7: 1.05, 8: 1.1, 9: 1.05, 10: 0.95, 11: 0.90,
            12: 0.88, 13: 0.90, 14: 0.92, 15: 0.95, 16: 1.0, 17: 1.08,
            18: 1.12, 19: 1.1, 20: 1.05, 21: 0.98, 22: 0.92, 23: 0.88
        },
        'crowd': {
            0: 0.1, 1: 0.08, 2: 0.05, 3: 0.05, 4: 0.1, 5: 0.2,
            6: 0.4, 7: 0.6, 8: 0.85, 9: 1.0, 10: 0.95, 11: 0.85,
            12: 0.75, 13: 0.8, 14: 0.85, 15: 0.9, 16: 0.95, 17: 1.1,
            18: 1.15, 19: 1.1, 20: 0.9, 21: 0.7, 22: 0.5, 23: 0.3
        }
    },
    'seasonal': {
        'summer': {'temp': 1.3, 'aqi': 0.9, 'noise': 1.0, 'crowd': 0.9},
        'monsoon': {'temp': 0.85, 'aqi': 0.7, 'noise': 0.95, 'crowd': 0.85},
        'post_monsoon': {'temp': 0.9, 'aqi': 1.3, 'noise': 1.0, 'crowd': 1.0},
        'winter': {'temp': 0.65, 'aqi': 1.5, 'noise': 1.0, 'crowd': 1.1}
    },
    'zone_multipliers': {
        'commercial': {'noise': 1.2, 'temp': 1.05, 'aqi': 1.1, 'crowd': 1.3},
        'residential': {'noise': 0.85, 'temp': 0.98, 'aqi': 0.95, 'crowd': 0.7},
        'mixed': {'noise': 1.0, 'temp': 1.0, 'aqi': 1.0, 'crowd': 1.0}
    }
}

def get_season(month):
    if month in [3, 4, 5, 6]:
        return 'summer'
    elif month in [7, 8, 9]:
        return 'monsoon'
    elif month in [10, 11]:
        return 'post_monsoon'
    else:
        return 'winter'

def generate_mohali_dataset(days=30, interval_minutes=5):
    """Generate realistic Mohali sensor data based on regional patterns"""
    
    nodes = [
        {'id': 'CP-MOH-01', 'name': 'IT Park Sector 70', 'zone': 'commercial', 
         'base_noise': 58, 'base_temp': 28, 'base_aqi': 85, 'base_crowd': 12},
        {'id': 'CP-MOH-02', 'name': 'Phase 11', 'zone': 'residential',
         'base_noise': 48, 'base_temp': 27, 'base_aqi': 75, 'base_crowd': 6},
        {'id': 'CP-MOH-03', 'name': 'Phase 7', 'zone': 'mixed',
         'base_noise': 52, 'base_temp': 27.5, 'base_aqi': 80, 'base_crowd': 10},
        {'id': 'CP-MOH-04', 'name': 'Sector 77', 'zone': 'residential',
         'base_noise': 45, 'base_temp': 26.5, 'base_aqi': 72, 'base_crowd': 5},
        {'id': 'CP-MOH-05', 'name': 'Phase 3B2', 'zone': 'commercial',
         'base_noise': 60, 'base_temp': 28.5, 'base_aqi': 88, 'base_crowd': 15}
    ]
    
    records = []
    end_time = datetime.now()
    start_time = end_time - timedelta(days=days)
    current_time = start_time
    
    while current_time <= end_time:
        hour = current_time.hour
        month = current_time.month
        season = get_season(month)
        
        for node in nodes:
            zone = node['zone']
            
            # Apply diurnal patterns
            noise_mult = MOHALI_PATTERNS['diurnal']['noise'][hour]
            temp_mult = MOHALI_PATTERNS['diurnal']['temp'][hour]
            aqi_mult = MOHALI_PATTERNS['diurnal']['aqi'][hour]
            crowd_mult = MOHALI_PATTERNS['diurnal']['crowd'][hour]
            
            # Apply seasonal adjustments
            seasonal = MOHALI_PATTERNS['seasonal'][season]
            noise_mult *= seasonal['noise']
            temp_mult *= seasonal['temp']
            aqi_mult *= seasonal['aqi']
            crowd_mult *= seasonal['crowd']
            
            # Apply zone multipliers
            zone_mult = MOHALI_PATTERNS['zone_multipliers'][zone]
            noise_mult *= zone_mult['noise']
            temp_mult *= zone_mult['temp']
            aqi_mult *= zone_mult['aqi']
            crowd_mult *= zone_mult['crowd']
            
            # Calculate values with realistic variance
            noise = node['base_noise'] * noise_mult * (1 + np.random.normal(0, 0.08))
            temp = node['base_temp'] * temp_mult * (1 + np.random.normal(0, 0.03))
            aqi = node['base_aqi'] * aqi_mult * (1 + np.random.normal(0, 0.12))
            crowd = max(0, node['base_crowd'] * crowd_mult * (1 + np.random.normal(0, 0.15)))
            
            # Clamp to realistic ranges
            noise = np.clip(noise, 35, 100)
            temp = np.clip(temp, 10, 45)
            aqi = np.clip(aqi, 20, 300)
            crowd = np.clip(crowd, 0, 40)
            
            records.append({
                'timestamp': current_time.isoformat(),
                'node_id': node['id'],
                'node_name': node['name'],
                'zone_type': zone,
                'noise': round(noise, 1),
                'temperature': round(temp, 1),
                'air_quality': int(aqi),
                'crowd_density': int(crowd)
            })
        
        current_time += timedelta(minutes=interval_minutes)
    
    return pd.DataFrame(records)

def inject_anomalies(df, anomaly_rate=0.02):
    """Inject realistic anomalies into the dataset"""
    
    n_anomalies = int(len(df) * anomaly_rate)
    anomaly_indices = np.random.choice(df.index, n_anomalies, replace=False)
    
    anomaly_types = ['noise_spike', 'heat_wave', 'pollution_event', 'crowd_surge']
    
    for idx in anomaly_indices:
        anomaly_type = np.random.choice(anomaly_types)
        
        if anomaly_type == 'noise_spike':
            df.loc[idx, 'noise'] = min(100, df.loc[idx, 'noise'] * 1.5 + np.random.uniform(10, 20))
        elif anomaly_type == 'heat_wave':
            df.loc[idx, 'temperature'] = min(45, df.loc[idx, 'temperature'] * 1.2 + np.random.uniform(3, 6))
        elif anomaly_type == 'pollution_event':
            df.loc[idx, 'air_quality'] = min(400, df.loc[idx, 'air_quality'] * 1.8 + np.random.uniform(30, 60))
        elif anomaly_type == 'crowd_surge':
            df.loc[idx, 'crowd_density'] = min(50, df.loc[idx, 'crowd_density'] * 2 + np.random.uniform(5, 15))
    
    return df

if __name__ == '__main__':
    print("Generating Mohali sensor dataset...")
    
    # Generate 30 days of data at 5-minute intervals
    df = generate_mohali_dataset(days=30, interval_minutes=5)
    
    # Inject anomalies
    df = inject_anomalies(df, anomaly_rate=0.02)
    
    # Save to processed folder
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, 'mohali_sensor_data.csv')
    df.to_csv(output_path, index=False)
    
    print(f"Generated {len(df)} records")
    print(f"Saved to {output_path}")
    
    # Print summary statistics
    print("\nDataset Statistics:")
    print(df.describe())

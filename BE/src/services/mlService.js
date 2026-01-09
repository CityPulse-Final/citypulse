const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

async function detectAnomaly(reading) {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reading)
    });
    
    if (!response.ok) {
      console.warn('ML service anomaly detection failed');
      return null;
    }
    
    return await response.json();
  } catch (err) {
    console.warn('ML service unavailable:', err.message);
    // Fallback: simple threshold-based detection
    return fallbackAnomalyDetection(reading);
  }
}

function fallbackAnomalyDetection(reading) {
  const signals = [];
  let explanation = '';
  
  if (reading.noise > 85) signals.push('noise');
  if (reading.temperature > 35) signals.push('heat');
  if (reading.air_quality > 120) signals.push('air_quality');
  if (reading.crowd_density > 25) signals.push('crowd');
  
  if (signals.length === 0 && reading.stress_index <= 80) {
    return { is_anomaly: false };
  }
  
  if (signals.includes('noise')) {
    explanation = `Noise level ${reading.noise} dB exceeds Mohali evening baseline`;
  } else if (signals.includes('heat')) {
    explanation = `Temperature ${reading.temperature}C indicates heat stress`;
  } else if (signals.includes('air_quality')) {
    explanation = `AQI ${reading.air_quality} above safe threshold`;
  } else if (reading.stress_index > 80) {
    explanation = 'Multi-sensor correlation indicates urban stress anomaly';
    signals.push('composite');
  }
  
  return {
    is_anomaly: reading.stress_index > 80 || signals.length > 0,
    anomaly_score: Math.min(reading.stress_index / 100, 0.99),
    signals,
    explanation
  };
}

async function getForecast(nodeId, horizon = 60) {
  try {
    const url = nodeId 
      ? `${ML_SERVICE_URL}/forecast/${nodeId}?horizon=${horizon}`
      : `${ML_SERVICE_URL}/forecast?horizon=${horizon}`;
      
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn('ML service forecast failed');
      return { error: 'Forecast unavailable' };
    }
    
    return await response.json();
  } catch (err) {
    console.warn('ML service unavailable for forecast:', err.message);
    return fallbackForecast(nodeId, horizon);
  }
}

function fallbackForecast(nodeId, horizon) {
  const nodes = nodeId 
    ? [nodeId] 
    : ['node_1', 'node_2', 'node_3', 'node_4', 'node_5'];
  
  const forecasts = nodes.map(nid => {
    const forecast = [];
    const now = new Date();
    let prevStress = 45 + Math.random() * 20;
    
    for (let i = 0; i <= horizon; i += 15) {
      const futureTime = new Date(now.getTime() + i * 60 * 1000);
      const hour = futureTime.getHours();
      
      // Simple diurnal pattern
      let baseFactor = hour >= 8 && hour <= 20 ? 1.2 : 0.8;
      if (hour >= 17 && hour <= 19) baseFactor = 1.4; // Rush hour
      
      const stress = Math.round(
        prevStress * 0.7 + (45 * baseFactor) * 0.3 + (Math.random() - 0.5) * 5
      );
      prevStress = stress;
      
      forecast.push({
        timestamp: futureTime.toISOString(),
        minutes_ahead: i,
        predicted_stress: Math.max(20, Math.min(85, stress)),
        predicted_noise: Math.round(55 + stress * 0.3),
        predicted_temp: Math.round(25 + Math.random() * 5),
        predicted_aqi: Math.round(60 + stress * 0.4),
        predicted_crowd: Math.round(5 + stress * 0.15),
        confidence: Math.max(0.65, 0.9 - (i * 0.003))
      });
    }
    
    const trend = forecast[forecast.length - 1].predicted_stress - forecast[0].predicted_stress > 8
      ? 'increasing'
      : forecast[0].predicted_stress - forecast[forecast.length - 1].predicted_stress > 8
        ? 'decreasing'
        : 'stable';
    
    return {
      node_id: nid,
      node_name: getNodeName(nid),
      forecast,
      trend
    };
  });
  
  return nodeId ? forecasts[0] : forecasts;
}

function getNodeName(nodeId) {
  const names = {
    'node_1': 'Sector 17 Plaza',
    'node_2': 'Phase 8 Industrial',
    'node_3': 'IT City',
    'node_4': 'Sector 70 Residential',
    'node_5': 'Aerocity'
  };
  return names[nodeId] || nodeId;
}

module.exports = { detectAnomaly, getForecast };

import { NodeData, ActivityLogEntry, HistoricalDataPoint } from './types';

export const sensorNodes = [
  { id: 'CP-MOH-01', coordinates: [76.6934, 30.7046] as [number, number], name: 'IT Park Sector 70' },
  { id: 'CP-MOH-02', coordinates: [76.7179, 30.7010] as [number, number], name: 'Phase 11' },
  { id: 'CP-MOH-03', coordinates: [76.7292, 30.7120] as [number, number], name: 'Phase 7' },
  { id: 'CP-MOH-04', coordinates: [76.6512, 30.6815] as [number, number], name: 'Sector 77' },
  { id: 'CP-MOH-05', coordinates: [76.7245, 30.6885] as [number, number], name: 'Phase 3B2' },
];

// Weighted Stress Formula logic
export const calculateStressIndex = (sensors: any) => {
  const weights = { noise: 0.4, temp: 0.25, air: 0.2, crowd: 0.15 };

  // Normalizing to 0-100 scales for consistent math
  const nScore = Math.min(((sensors.noise - 40) / 60) * 100, 100); 
  const tScore = Math.min(((sensors.temp - 15) / 25) * 100, 100); 
  const aScore = Math.min((sensors.airQuality / 150) * 100, 100);
  const dScore = Math.min((sensors.crowd / 30) * 100, 100); 

  return Math.max(0, Math.round(
    (nScore * weights.noise) + (tScore * weights.temp) + 
    (aScore * weights.air) + (dScore * weights.crowd)
  ));
};

export function generateMockNodeData(nodeId: string, coordinates: [number, number]): NodeData {
  const sensors = {
    noise: Math.round((40 + Math.random() * 55) * 10) / 10,
    temp: Math.round((18 + Math.random() * 17) * 10) / 10,
    airQuality: Math.round(30 + Math.random() * 100),
    crowd: Math.round(Math.random() * 25), // Unit: Count/People
  };

  const stressIndex = calculateStressIndex(sensors);
  const isAnomaly = stressIndex > 80;

  // Dynamic AI Explanation Logic
  let aiExplanation = "Sensing parameters nominal. No immediate infrastructure intervention required.";
  if (stressIndex > 80) {
    if (sensors.noise > 85) aiExplanation = "Critical noise levels detected. Likely heavy construction or congestion.";
    else if (sensors.temp > 32) aiExplanation = "High thermal stress. Heat island effect detected in this sector.";
    else aiExplanation = "Multi-sensor correlation indicates a localized urban stress anomaly.";
  } else if (stressIndex > 55) {
    aiExplanation = "Elevated activity levels. Monitoring for potential ordinance threshold breach.";
  }

  return {
    nodeId,
    coordinates,
    sensors,
    stressIndex,
    isAnomaly,
    aiExplanation,
    timestamp: Date.now(),
  };
}

export function generateActivityLog(nodeData: NodeData): ActivityLogEntry {
  let eventType: 'Normal' | 'Elevated' | 'Critical' = 'Normal';
  if (nodeData.stressIndex > 80) eventType = 'Critical';
  else if (nodeData.stressIndex > 55) eventType = 'Elevated';
  
  return {
    id: `${nodeData.nodeId}-${nodeData.timestamp}`,
    timestamp: nodeData.timestamp,
    nodeId: nodeData.nodeId,
    eventType,
    value: nodeData.stressIndex,
  };
}

export function generateHistoricalData(currentData: NodeData, existingHistory: HistoricalDataPoint[]): HistoricalDataPoint[] {
  const newPoint = {
    timestamp: currentData.timestamp,
    stressIndex: currentData.stressIndex,
    ...currentData.sensors
  };
  return [...existingHistory, newPoint].slice(-20);
}
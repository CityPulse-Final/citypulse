export interface SensorData {
  noise: number;
  temp: number;
  airQuality: number;
  crowd: number;
}

export interface NodeData {
  nodeId: string;
  coordinates: [number, number];
  sensors: SensorData;
  stressIndex: number;
  isAnomaly: boolean;
  aiExplanation: string;
  timestamp: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  nodeId: string;
  eventType: 'Normal' | 'Elevated' | 'Critical';
  value: number;
}

export interface HistoricalDataPoint {
  timestamp: number;
  stressIndex: number;
  noise: number;
  temp: number;
  airQuality: number;
  crowd: number;
}

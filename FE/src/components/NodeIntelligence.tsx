import { Brain, Volume2, Thermometer, Wind, Users, Activity } from 'lucide-react';
import { NodeData } from '../lib/types';
import { Progress } from './ui/progress';

interface NodeIntelligenceProps {
  selectedNode: NodeData | null;
}

export function NodeIntelligence({ selectedNode }: NodeIntelligenceProps) {
  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-[#161B22]">
        <div className="text-center">
          <Brain className="w-12 h-12 text-gray-600 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-400 font-mono text-sm">INITIALIZING LINK... SELECT NODE</p>
        </div>
      </div>
    );
  }

  // Consistent Logic for Stress Levels (0-100 Scale)
  const getStressColor = (stress: number) => {
    if (stress >= 75) return '#FF3B3B'; // Critical
    if (stress >= 50) return '#FFB800'; // Elevated
    return '#00F5FF'; // Normal
  };

  const getStressLabel = (stress: number) => {
    if (stress >= 75) return 'CRITICAL ANOMALY';
    if (stress >= 50) return 'ELEVATED STRESS';
    return 'NOMINAL PULSE';
  };

  const getSensorColor = (sensorType: string, value: number) => {
    switch (sensorType) {
      case 'noise':
        return value > 80 ? '#FF3B3B' : value > 65 ? '#FFB800' : '#00F5FF';
      case 'temp':
        return value > 34 ? '#FF3B3B' : value > 28 ? '#FFB800' : '#00F5FF';
      case 'airQuality':
        return value > 100 ? '#FF3B3B' : value > 60 ? '#FFB800' : '#00F5FF';
      case 'crowd':
        return value > 20 ? '#FF3B3B' : value > 12 ? '#FFB800' : '#00F5FF';
      default:
        return '#00F5FF';
    }
  };

  const stressColor = getStressColor(selectedNode.stressIndex);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#161B22]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#00F5FF]" />
          <h2 className="font-semibold text-white tracking-tight">NODE INTELLIGENCE</h2>
        </div>
        <p className="text-[10px] text-gray-500 mt-1 font-mono uppercase tracking-widest">
          ID: {selectedNode.nodeId} // LIVE_FEED
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Urban Stress Index Gauge */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="text-center">
            <div className="text-[10px] font-mono text-gray-500 mb-2 tracking-tighter">URBAN STRESS INDEX</div>
            <div 
              className="text-6xl font-bold mb-1 transition-colors duration-500 tabular-nums"
              style={{ color: stressColor, textShadow: selectedNode.isAnomaly ? `0 0 20px ${stressColor}44` : 'none' }}
            >
              {selectedNode.stressIndex}
            </div>
            <div 
              className="text-[10px] font-mono font-bold mb-6 tracking-widest"
              style={{ color: stressColor }}
            >
              {getStressLabel(selectedNode.stressIndex)}
            </div>
            
            {/* Visual Gauge */}
            <div className="relative w-36 h-36 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72" cy="72" r="64"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="6" fill="none"
                />
                <circle
                  cx="72" cy="72" r="64"
                  stroke={stressColor}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${(selectedNode.stressIndex / 100) * 402} 402`}
                  className="transition-all duration-700 ease-out"
                  style={{ filter: selectedNode.isAnomaly ? `drop-shadow(0 0 6px ${stressColor})` : 'none' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                 <Activity className="w-6 h-6 opacity-20" style={{ color: stressColor }} />
              </div>
            </div>
          </div>
        </div>

        {/* Sensor Breakdowns */}
        <div className="p-5 border-b border-white/10 space-y-5">
          <div className="text-[10px] font-mono text-gray-500 mb-2 tracking-widest">REAL-TIME SENSORS</div>
          
          {/* Acoustics */}
          <SensorRow 
            icon={<Volume2 className="w-4 h-4" />} 
            label="Acoustics" 
            value={`${selectedNode.sensors.noise} dB`} 
            percent={(selectedNode.sensors.noise / 100) * 100}
            color={getSensorColor('noise', selectedNode.sensors.noise)}
          />

          {/* Thermal */}
          <SensorRow 
            icon={<Thermometer className="w-4 h-4" />} 
            label="Thermal" 
            value={`${selectedNode.sensors.temp}°C`} 
            percent={(selectedNode.sensors.temp / 40) * 100}
            color={getSensorColor('temp', selectedNode.sensors.temp)}
          />

          {/* Atmosphere */}
          <SensorRow 
            icon={<Wind className="w-4 h-4" />} 
            label="Atmosphere" 
            value={`AQI ${selectedNode.sensors.airQuality}`} 
            percent={(selectedNode.sensors.airQuality / 200) * 100}
            color={getSensorColor('airQuality', selectedNode.sensors.airQuality)}
          />

          {/* Density (UNIT FIXED: PPM -> COUNT) */}
          <SensorRow 
            icon={<Users className="w-4 h-4" />} 
            label="Density" 
            value={`${selectedNode.sensors.crowd} PEOPLE`} 
            percent={(selectedNode.sensors.crowd / 30) * 100}
            color={getSensorColor('crowd', selectedNode.sensors.crowd)}
          />
        </div>

        {/* XAI Analysis */}
        <div className="p-5 bg-black/20">
          <div className="text-[10px] font-mono text-gray-500 mb-3 tracking-widest text-center">EXPLAINABLE AI ANALYSIS</div>
          <div 
            className="p-4 rounded border text-xs leading-relaxed font-medium transition-all duration-500"
            style={{
              backgroundColor: selectedNode.isAnomaly ? 'rgba(255, 59, 59, 0.08)' : 'rgba(0, 245, 255, 0.03)',
              borderColor: selectedNode.isAnomaly ? 'rgba(255, 59, 59, 0.3)' : 'rgba(0, 245, 255, 0.15)',
            }}
          >
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: stressColor }} />
              <p className="text-gray-200 antialiased italic">
                "{selectedNode.aiExplanation}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for cleaner rows
function SensorRow({ icon, label, value, percent, color }: any) {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 group-hover:text-gray-300 transition-colors">{icon}</span>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-tight">{label}</span>
        </div>
        <span className="text-xs font-mono font-bold" style={{ color }}>{value}</span>
      </div>
      <Progress 
        value={percent} 
        className="h-1.5 bg-white/5" 
        indicatorStyle={{ backgroundColor: color, boxShadow: `0 0 10px ${color}33` }}
      />
    </div>
  );
}
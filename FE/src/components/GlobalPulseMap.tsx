import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { NodeData } from '../lib/types';

// Get Mapbox token from environment variable or use empty string as fallback
const MAPBOX_TOKEN = typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPBOX_TOKEN 
  ? import.meta.env.VITE_MAPBOX_TOKEN 
  : '';

interface GlobalPulseMapProps {
  nodes: NodeData[];
  selectedNodeId?: string;
  onNodeClick: (nodeId: string) => void;
}

export function GlobalPulseMap({ nodes, selectedNodeId, onNodeClick }: GlobalPulseMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapError, setMapError] = useState(false);

  // 1. Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Check if we have a valid token
    if (!MAPBOX_TOKEN) {
      console.warn('Mapbox token not found. Using fallback visualization.');
      setMapError(true);
      return;
    }

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [76.7179, 30.7046], // Centered on Mohali
        zoom: 12,
        pitch: 45, // 3D Perspective
        antialias: true
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    } catch (error) {
      console.error('Failed to initialize Mapbox:', error);
      setMapError(true);
    }

    return () => map.current?.remove();
  }, []);

  // 2. Sync Markers with Node Data
  useEffect(() => {
    if (!map.current) return;

    nodes.forEach((node) => {
      const isSelected = selectedNodeId === node.nodeId;
      const stressColor = node.stressIndex > 80 ? '#FF3B3B' : node.stressIndex > 55 ? '#FFB800' : '#00F5FF';
      const pulseClass = node.stressIndex > 80 ? 'animate-ping-fast' : 'animate-ping-slow';

      // Create or Update Marker Element
      if (!markers.current[node.nodeId]) {
        const el = document.createElement('div');
        el.className = 'cursor-pointer group relative';
        
        // Inner Core
        const core = document.createElement('div');
        core.className = 'w-3 h-3 rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 relative transition-all duration-500';
        
        // Pulse Ring
        const ring = document.createElement('div');
        ring.className = `absolute inset-0 rounded-full opacity-75 ${pulseClass}`;
        
        // Label
        const label = document.createElement('div');
        label.className = 'absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/80 border border-white/20 rounded text-[9px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20';
        label.innerText = `${node.nodeId} | USI: ${node.stressIndex}`;

        el.appendChild(core);
        el.appendChild(ring);
        el.appendChild(label);

        el.addEventListener('click', () => onNodeClick(node.nodeId));

        markers.current[node.nodeId] = new mapboxgl.Marker(el)
          .setLngLat(node.coordinates as [number, number])
          .addTo(map.current!);
      }

      // Update Visuals based on Stress Level
      const markerEl = markers.current[node.nodeId].getElement();
      const core = markerEl.querySelector('div') as HTMLDivElement;
      const ring = markerEl.querySelector('.rounded-full:not(.z-10)') as HTMLDivElement;
      const label = markerEl.querySelector('.text-white') as HTMLDivElement;

      core.style.backgroundColor = stressColor;
      core.style.transform = isSelected ? 'scale(1.5)' : 'scale(1)';
      core.style.boxShadow = isSelected ? `0 0 20px ${stressColor}` : `0 0 10px ${stressColor}66`;
      
      ring.style.backgroundColor = stressColor;
      label.innerText = `${node.nodeId} | USI: ${node.stressIndex}`;
      
      if (isSelected) {
        markerEl.style.zIndex = '100';
      } else {
        markerEl.style.zIndex = '1';
      }
    });
  }, [nodes, selectedNodeId]);

  // Fallback visualization when Mapbox is not available
  if (mapError) {
    const getNodeColor = (node: NodeData) => {
      if (node.stressIndex > 80) return '#FF3B3B';
      if (node.stressIndex > 55) return '#FFB800';
      return '#00F5FF';
    };

    return (
      <div className="w-full h-full relative bg-[#0B0E14]">
        {/* Fallback: Simple SVG map visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full max-w-4xl">
            <svg className="w-full h-full" viewBox="0 0 800 600">
              {/* Grid background */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="800" height="600" fill="url(#grid)" />
              
              {/* City outline representation */}
              <text x="400" y="50" textAnchor="middle" fill="#374151" fontSize="24" fontFamily="JetBrains Mono">
                MOHALI
              </text>
              <text x="400" y="75" textAnchor="middle" fill="#6B7280" fontSize="12" fontFamily="JetBrains Mono">
                Urban Sensing Network
              </text>

              {/* Render nodes on simplified map */}
              {nodes.map((node, index) => {
                const x = 200 + (index * 120);
                const y = 250 + (Math.sin(index) * 80);
                const color = getNodeColor(node);
                const pulseSize = 20 + (node.sensors.noise / 100) * 20;
                const isSelected = selectedNodeId === node.nodeId;
                
                return (
                  <g key={node.nodeId} onClick={() => onNodeClick(node.nodeId)} style={{ cursor: 'pointer' }}>
                    {/* Pulse ring */}
                    <circle cx={x} cy={y} r={pulseSize} fill={color} opacity="0.2">
                      <animate attributeName="r" from={pulseSize * 0.8} to={pulseSize * 1.5} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                    </circle>
                    {/* Node dot */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={isSelected ? "12" : "8"}
                      fill={color} 
                      stroke="rgba(255,255,255,0.8)" 
                      strokeWidth="2"
                      filter={`drop-shadow(0 0 ${isSelected ? '12' : '6'}px ${color})`}
                    >
                      {node.isAnomaly && (
                        <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" />
                      )}
                    </circle>
                    {/* Label */}
                    <text 
                      x={x} 
                      y={y - 25} 
                      textAnchor="middle" 
                      fill="#00F5FF" 
                      fontSize="10" 
                      fontFamily="JetBrains Mono"
                    >
                      {node.nodeId}
                    </text>
                    <text 
                      x={x} 
                      y={y + 25} 
                      textAnchor="middle" 
                      fill={color} 
                      fontSize="11" 
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      {node.stressIndex}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Info overlay */}
        <div className="absolute top-4 left-4 bg-[#161B22] border border-white/10 rounded p-3 max-w-xs">
          <p className="text-xs text-gray-400">
            <span className="text-[#FFB800]">⚠</span> Mapbox visualization unavailable. Showing simplified node layout.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            To enable full map: Set VITE_MAPBOX_TOKEN in your .env file
          </p>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-[#161B22] border border-white/10 rounded p-3">
          <h4 className="text-[10px] font-mono text-gray-400 mb-2 uppercase tracking-widest">Map Legend</h4>
          <div className="space-y-1.5">
            <LegendItem color="#00F5FF" label="Nominal" range="0-54" />
            <LegendItem color="#FFB800" label="Elevated" range="55-79" />
            <LegendItem color="#FF3B3B" label="Critical" range="80-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Map Overlay HUD */}
      <div className="absolute top-4 left-4 pointer-events-none space-y-2">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-lg">
          <h4 className="text-[10px] font-mono text-gray-400 mb-2 uppercase tracking-widest">Map Legend</h4>
          <div className="space-y-1.5">
            <LegendItem color="#00F5FF" label="Nominal" range="0-54" />
            <LegendItem color="#FFB800" label="Elevated" range="55-79" />
            <LegendItem color="#FF3B3B" label="Critical" range="80-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, range }: { color: string; label: string; range: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[9px] font-mono text-white/80 uppercase">{label}</span>
      <span className="text-[9px] font-mono text-gray-500 ml-auto">{range}</span>
    </div>
  );
}
import React, { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDroneData } from '../context/DroneDataContext';
import { MapPin, Navigation, Mountain, Map as MapIcon } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom blue dot icon for the drone
const droneIcon = L.divIcon({
  className: 'drone-marker-icon',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: radial-gradient(circle, #0ea5e9, #0369a1);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(14, 165, 233, 0.6), 0 2px 8px rgba(0,0,0,0.3);
      position: relative;
    ">
      <div style="
        position: absolute;
        inset: -6px;
        border: 2px solid rgba(14, 165, 233, 0.3);
        border-radius: 50%;
        animation: pulse-ring 2s ease-out infinite;
      "></div>
    </div>
    <style>
      @keyframes pulse-ring {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(2.2); opacity: 0; }
      }
    </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -14],
});

// Component to auto-pan the map to follow the drone
function MapAutoFollow({ lat, lng }) {
  const map = useMap();

  useEffect(() => {
    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], map.getZoom(), {
        animate: true,
        duration: 0.8,
      });
    }
  }, [lat, lng, map]);

  return null;
}

function DroneMapInner() {
  const { data, pathHistory, esp32Connected } = useDroneData();

  const position = useMemo(() => {
    const lat = data?.latitude;
    const lng = data?.longitude;
    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
    return [9.5937, 76.5222]; // Safe fallback (Kerala, India)
  }, [data?.latitude, data?.longitude]);

  const polylinePositions = useMemo(() => {
    if (!Array.isArray(pathHistory) || pathHistory.length === 0) return [];
    return pathHistory
      .filter(p => p && typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng))
      .map(p => [p.lat, p.lng]);
  }, [pathHistory]);

  const hasValidPosition = Array.isArray(position) && position.length === 2 && typeof position[0] === 'number' && typeof position[1] === 'number';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass card-sensor"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="section-title mb-0">
          <MapPin size={14} className="text-sky-500" />
          Drone Tracking Map
        </div>
        <div className="bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
          <span className="text-[9px] uppercase tracking-wider text-amber-600 font-bold">SIMULATED DATA</span>
        </div>
      </div>

      {/* Map Container */}
      <div
        className="relative overflow-hidden"
        style={{ borderRadius: '12px', height: '350px' }}
      >
        {hasValidPosition ? (
          <MapContainer
            center={position}
            zoom={16}
            scrollWheelZoom={true}
            style={{
              height: '100%',
              width: '100%',
              borderRadius: '12px',
              zIndex: 1,
            }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Auto-follow drone */}
            <MapAutoFollow lat={data?.latitude} lng={data?.longitude} />

            {/* Path history polyline */}
            {Array.isArray(polylinePositions) && polylinePositions.length > 1 && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color: '#0ea5e9',
                  weight: 3,
                  opacity: 0.7,
                  dashArray: '8, 6',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )}

            {/* Drone marker */}
            <Marker position={position} icon={droneIcon}>
              <Popup>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                padding: '4px 0',
                minWidth: '160px',
              }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: '#0ea5e9',
                  marginBottom: '8px',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '6px',
                }}>
                  🛸 E-NOSE Drone
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Latitude</span>
                    <span style={{ fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}>
                      {data.latitude?.toFixed(6)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Longitude</span>
                    <span style={{ fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}>
                      {data.longitude?.toFixed(6)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Altitude</span>
                    <span style={{ fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}>
                      {data.altitude?.toFixed(1)} m
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <MapIcon className="text-slate-400 mb-2" size={32} />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Waiting for coordinates</p>
          </div>
        )}

        {/* Overlay info cards */}
        <div className="absolute bottom-3 left-3 z-[2] flex gap-2">
          <div className="glass-strong px-3 py-1.5 flex items-center gap-1.5" style={{ borderRadius: '8px', fontSize: '11px' }}>
            <Navigation size={11} className="text-sky-500" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {data.heading?.toFixed(0)}°
            </span>
          </div>
          <div className="glass-strong px-3 py-1.5 flex items-center gap-1.5" style={{ borderRadius: '8px', fontSize: '11px' }}>
            <Mountain size={11} className="text-sky-500" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {data.altitude?.toFixed(1)}m
            </span>
          </div>
        </div>
      </div>

      {/* Bottom coordinate bar */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-slate-400 uppercase">Lat</span>
            <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
              {data.latitude?.toFixed(6)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-slate-400 uppercase">Lng</span>
            <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
              {data.longitude?.toFixed(6)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-[10px] font-medium text-slate-400">
            {pathHistory?.length || 0} points
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function DroneMap() {
  return (
    <ErrorBoundary>
      <DroneMapInner />
    </ErrorBoundary>
  );
}

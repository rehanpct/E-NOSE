import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import { Server, Database, Cpu, Wifi, Activity } from 'lucide-react';

function StatusItem({ icon: Icon, label, status, subtext }) {
  const isOnline = status === 'Online' || status === 'Connected' || status === 'Loaded';
  const isWarning = status === 'Warning' || status === 'Reconnecting...';
  
  const colorClass = isOnline 
    ? 'text-emerald-500 bg-emerald-500/10' 
    : isWarning
      ? 'text-amber-500 bg-amber-500/10'
      : 'text-red-500 bg-red-500/10';

  return (
    <div className="flex items-center justify-between p-3 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md ${colorClass}`}>
          <Icon size={16} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{label}</h4>
          {subtext && <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{subtext}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : isWarning ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{status}</span>
      </div>
    </div>
  );
}

export default function SystemHealth() {
  const { backendConnected, esp32ConnectionState, lastReceivedTimestamp } = useDroneData();
  const [healthData, setHealthData] = useState({
    backend: 'offline',
    database: 'offline',
    socketio: 'offline',
    model: 'offline',
    esp32: 'offline',
    last_sensor_update: null
  });

  useEffect(() => {
    const fetchHealth = () => {
      fetch('http://localhost:5000/api/system-health')
        .then(res => res.json())
        .then(data => setHealthData(data))
        .catch(err => setHealthData(prev => ({...prev, backend: 'offline', database: 'offline', model: 'offline'})));
    };
    
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const dbStatus = healthData.database === 'online' ? 'Online' : 'Offline';
  const mlStatus = healthData.model === 'loaded' ? 'Loaded' : 'Failed';
  
  // Combine local websocket state with backend state
  const backendStatus = (healthData.backend === 'online' && backendConnected) ? 'Online' : 'Reconnecting...';

  return (
    <motion.div
      className="glass card-sensor flex flex-col gap-4"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title mb-0">System Health</h3>
        <Activity className={backendConnected ? 'text-emerald-500' : 'text-red-500'} size={18} />
      </div>

      <div className="flex flex-col gap-3">
        <StatusItem 
          icon={Server} 
          label="Backend Service" 
          status={backendStatus} 
        />
        <StatusItem 
          icon={Database} 
          label="PostgreSQL Database" 
          status={dbStatus} 
        />
        <StatusItem 
          icon={Cpu} 
          label="ESP32 Sensor Node" 
          status={esp32ConnectionState} 
          subtext={lastReceivedTimestamp ? `Last seen: ${new Date(lastReceivedTimestamp).toLocaleTimeString()}` : 'No data received yet'}
        />
        <StatusItem 
          icon={Wifi} 
          label="WebSocket Stream" 
          status={backendConnected ? 'Connected' : 'Disconnected'} 
        />
        <StatusItem 
          icon={Activity} 
          label="ML Prediction Engine" 
          status={mlStatus} 
        />
      </div>
    </motion.div>
  );
}

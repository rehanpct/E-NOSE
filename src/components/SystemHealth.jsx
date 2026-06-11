import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import { Server, Database, Cpu, Wifi, Activity } from 'lucide-react';
import { API_BASE } from '../utils/api';

const backendUrl = API_BASE;

function CompactStatusRow({ icon: Icon, label, status }) {
  const isOnline = status === 'Online' || status === 'Connected' || status === 'Loaded';
  const isWarning = status === 'Warning' || status === 'Reconnecting...';
  
  const statusColor = isOnline 
    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
    : isWarning
      ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      : 'text-red-500 bg-red-500/10 border-red-500/20';

  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <Icon size={12} className="text-slate-400 flex-shrink-0" />
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
          {label}
        </span>
      </div>
      <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border flex items-center gap-1 ${statusColor}`}>
        <span className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-500' : isWarning ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
        {status}
      </div>
    </div>
  );
}

export default function SystemHealth() {
  const { backendConnected, socketConnected, socketReconnecting, esp32ConnectionState } = useDroneData();
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
      fetch(`${backendUrl}/api/system-health`)
        .then(res => res.json())
        .then(data => setHealthData(data))
        .catch(() => setHealthData(prev => ({...prev, backend: 'offline', database: 'offline', model: 'offline'})));
    };
    
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const dbStatus = healthData.database === 'online' ? 'Online' : 'Offline';
  const mlStatus = healthData.model === 'loaded' ? 'Loaded' : 'Failed';
  const backendStatus = backendConnected ? 'Online' : 'Offline';
  const wsStatus = socketConnected ? 'Connected' : socketReconnecting ? 'Reconnecting...' : 'Disconnected';

  return (
    <motion.div
      className="glass p-3 flex flex-col justify-between h-full"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ borderRadius: '8px', minHeight: '120px' }}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <Activity size={10} className="text-primary-500" />
          Infrastructure Nodes
        </h3>
        <span className="text-[8px] font-black text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          Status
        </span>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 justify-center">
        <CompactStatusRow icon={Server} label="Backend API" status={backendStatus} />
        <CompactStatusRow icon={Database} label="Postgres DB" status={dbStatus} />
        <CompactStatusRow icon={Cpu} label="ESP32 Node" status={esp32ConnectionState} />
        <CompactStatusRow icon={Wifi} label="WebSocket" status={wsStatus} />
        <CompactStatusRow icon={Activity} label="ML Engine" status={mlStatus} />
      </div>
    </motion.div>
  );
}

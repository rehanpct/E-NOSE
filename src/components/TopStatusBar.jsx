import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, Server, Cpu, Navigation, Clock } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';

export default function TopStatusBar() {
  const { esp32Connected, backendConnected, lastReceivedTimestamp, data } = useDroneData();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine Model Status based on data presence
  const modelStatus = data.predicted_gas && data.predicted_gas !== "Unknown" ? "Online" : "Offline";

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass mb-6 p-3 flex flex-wrap items-center justify-between text-xs font-semibold"
      style={{ borderRadius: '12px' }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Navigation size={14} className="text-blue-500" />
          <span className="text-slate-600 dark:text-slate-300">Drone:</span>
          <span className="text-blue-500 animate-pulse">Online (Demo)</span>
        </div>

        <div className="flex items-center gap-2">
          <Wifi size={14} className={esp32Connected ? "text-green-500" : "text-red-500"} />
          <span className="text-slate-600 dark:text-slate-300">ESP32:</span>
          <span className={esp32Connected ? "text-green-500" : "text-red-500"}>
            {esp32Connected ? "Connected" : "Offline"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Server size={14} className={backendConnected ? "text-green-500" : "text-red-500"} />
          <span className="text-slate-600 dark:text-slate-300">Backend:</span>
          <span className={backendConnected ? "text-green-500" : "text-red-500"}>
            {backendConnected ? "Online" : "Offline"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Cpu size={14} className={modelStatus === "Online" ? "text-purple-500" : "text-red-500"} />
          <span className="text-slate-600 dark:text-slate-300">AI Model:</span>
          <span className={modelStatus === "Online" ? "text-purple-500" : "text-red-500"}>
            {modelStatus}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-blue-500/10 px-2 py-1 rounded-md">
          <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">LIVE DATA</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock size={14} className="text-slate-400" />
          <span className="text-slate-500 font-mono">
            Last Update: {lastReceivedTimestamp ? new Date(lastReceivedTimestamp).toLocaleTimeString() : 'Never'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

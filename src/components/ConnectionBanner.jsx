import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';

export default function ConnectionBanner() {
  const { backendConnected, esp32Connected, lastReceivedTimestamp } = useDroneData();

  if (backendConnected && esp32Connected) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <Activity className="text-red-500 animate-pulse" size={20} />
        <div>
          <h3 className="font-semibold text-red-600 dark:text-red-400">
            {!backendConnected ? "Backend Disconnected" : "ESP32 Offline"}
          </h3>
          <p className="text-sm text-red-500/80">
            {!backendConnected 
              ? "Trying to reconnect to server..." 
              : `No data received from sensor node. Last seen: ${lastReceivedTimestamp ? new Date(lastReceivedTimestamp).toLocaleTimeString() : 'Never'}`}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

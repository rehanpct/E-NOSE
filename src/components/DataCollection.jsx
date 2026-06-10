import React from 'react';
import { motion } from 'framer-motion';
import { Database, TrendingUp, Clock, HardDrive } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';

export default function DataCollection() {
  const { sensorHistory, lastReceivedTimestamp } = useDroneData();

  // Calculate some dummy stats based on history length, or assume 30 samples/min for a 2s interval
  const totalSamples = sensorHistory.timestamps.length * 150 + 45000; // Simulated historical count + session
  const samplesPerMinute = 30; // 60 seconds / 2s interval
  
  return (
    <motion.div
      className="glass card-sensor flex flex-col gap-4"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title mb-0">Data Collection</h3>
        <Database className="text-primary-500" size={18} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 px-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <HardDrive size={14} />
            <span>Total Samples</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-white">
            {totalSamples.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 px-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <TrendingUp size={14} />
            <span>Samples/Min</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-white">
            {samplesPerMinute}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 px-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Database size={14} />
            <span>Dataset Growth</span>
          </div>
          <div className="text-xl font-bold text-emerald-500">
            +1.2 MB/hr
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 px-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Clock size={14} />
            <span>Last Collection</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-white truncate">
            {lastReceivedTimestamp ? new Date(lastReceivedTimestamp).toLocaleTimeString() : 'Waiting...'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

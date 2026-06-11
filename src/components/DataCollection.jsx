import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, TrendingUp, Clock, HardDrive } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';
import { fetchJson, formatBytes } from '../utils/api';

export default function DataCollection() {
  const { totalSamples, samplesPerMinute, lastReceivedTimestamp } = useDroneData();
  const [datasetStats, setDatasetStats] = useState(null);

  useEffect(() => {
    const load = () => {
      fetchJson('/api/dataset/stats')
        .then(setDatasetStats)
        .catch(() => setDatasetStats(null));
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const growthRate = datasetStats?.quality?.growth_per_minute ?? samplesPerMinute ?? 0;
  const csvSize = formatBytes(datasetStats?.quality?.csv_size_bytes ?? 0);

  return (
    <motion.div
      className="glass card-sensor flex flex-col gap-4 h-full"
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
            {(totalSamples || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 px-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <TrendingUp size={14} />
            <span>Samples/Min</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-white">
            {growthRate > 0 ? growthRate : samplesPerMinute || '—'}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 px-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Database size={14} />
            <span>Dataset Size</span>
          </div>
          <div className="text-xl font-bold text-emerald-500">
            {csvSize}
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

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import { Target, Activity, Clock, Map } from 'lucide-react';

export default function MissionControlPanel() {
  const { samplesCollected, missionStartTime, data } = useDroneData();
  const [duration, setDuration] = useState('00:00:00');

  useEffect(() => {
    const timer = setInterval(() => {
      if (missionStartTime) {
        const now = new Date();
        const diff = Math.floor((now - missionStartTime) / 1000);
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        setDuration(`${h}:${m}:${s}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [missionStartTime]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass card-sensor"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="section-title mb-0">
          <Target size={14} />
          Mission Control
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-100 dark:bg-slate-800/80 p-2 px-3 rounded-md border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-0.5 flex items-center gap-1.5">
            <Activity size={12} className="text-blue-500" />
            Samples Collected
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100">
            {samplesCollected}
          </div>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800/80 p-2 px-3 rounded-md border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-0.5 flex items-center gap-1.5">
            <Clock size={12} className="text-emerald-500" />
            Mission Duration
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100">
            {duration}
          </div>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800/80 p-2 px-3 rounded-md border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-0.5 flex items-center gap-1.5">
            <Map size={12} className="text-amber-500" />
            Coverage (Simulated)
          </div>
          <div className="flex items-end gap-2 mt-1">
            <div className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100 leading-none">
              64%
            </div>
            <div className="w-full bg-slate-300 dark:bg-slate-700 h-1.5 rounded-full mb-2">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '64%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800/80 p-2 px-3 rounded-md border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-0.5 flex items-center gap-1.5">
            <Target size={12} className="text-purple-500" />
            Survey Area
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100">
            1.2 <span className="text-xs text-slate-500">km²</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

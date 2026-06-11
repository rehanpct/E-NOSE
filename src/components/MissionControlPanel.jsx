import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import { Target, Activity, Clock, Map } from 'lucide-react';

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MissionControlPanel() {
  const { totalSamples, missionStartTime, pathHistory, hasGps } = useDroneData();
  const [duration, setDuration] = useState('00:00:00');

  const pathDistanceKm = useMemo(() => {
    if (!Array.isArray(pathHistory) || pathHistory.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < pathHistory.length; i += 1) {
      const prev = pathHistory[i - 1];
      const curr = pathHistory[i];
      const lat1 = prev.lat ?? prev[0];
      const lng1 = prev.lng ?? prev[1];
      const lat2 = curr.lat ?? curr[0];
      const lng2 = curr.lng ?? curr[1];
      if (lat1 != null && lng1 != null && lat2 != null && lng2 != null) {
        total += haversineKm(lat1, lng1, lat2, lng2);
      }
    }
    return total;
  }, [pathHistory]);

  const coveragePct = hasGps && pathHistory.length > 1
    ? Math.min(100, Math.round((pathHistory.length / 100) * 100))
    : null;

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
            {totalSamples ?? 0}
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
            Track Coverage
          </div>
          <div className="flex items-end gap-2 mt-1">
            <div className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100 leading-none">
              {coveragePct != null ? `${coveragePct}%` : '—'}
            </div>
            {coveragePct != null && (
              <div className="w-full bg-slate-300 dark:bg-slate-700 h-1.5 rounded-full mb-2">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${coveragePct}%` }}></div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800/80 p-2 px-3 rounded-md border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-0.5 flex items-center gap-1.5">
            <Target size={12} className="text-purple-500" />
            Distance Traveled
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100">
            {pathDistanceKm > 0 ? pathDistanceKm.toFixed(2) : '—'}{' '}
            <span className="text-xs text-slate-500">km</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

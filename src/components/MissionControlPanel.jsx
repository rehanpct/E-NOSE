import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import { Target, Activity, Clock, Play, Square, RefreshCw, Download } from 'lucide-react';
import { fetchJson, API_BASE } from '../utils/api';
import { exportToCSV } from '../utils/exportUtils';

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
  const { totalSamples, missionStartTime, pathHistory, hasGps, clearAlerts, getExportHistory } = useDroneData();
  const [duration, setDuration] = useState('00:00:00');
  const [isCollecting, setIsCollecting] = useState(false);

  // Poll collection status
  const checkCollectionState = () => {
    fetchJson('/api/dataset/stats')
      .then((res) => {
        if (res?.state) {
          setIsCollecting(res.state.is_collecting);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    checkCollectionState();
    const interval = setInterval(checkCollectionState, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleCollection = async () => {
    const action = isCollecting ? 'stop' : 'start';
    const payload = {
      action,
      label: 'Clean Air',
      target_count: null
    };
    try {
      const res = await fetch(`${API_BASE}/api/dataset/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const newState = await res.json();
      setIsCollecting(newState.is_collecting);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    const history = getExportHistory();
    if (history && history.length > 0) {
      exportToCSV(history, `enose_data_${Date.now()}.csv`);
    } else {
      alert("No data points collected in current session yet.");
    }
  };

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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-3 flex flex-col justify-between h-full animate-pulse-glow-none"
      style={{ borderRadius: '8px', minHeight: '120px' }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <Target size={10} className="text-primary-500" />
          Mission Console
        </h3>
        {isCollecting && (
          <span className="text-[8px] font-black text-red-500 uppercase bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded animate-pulse">
            Recording
          </span>
        )}
      </div>

      {/* Stats Mini Grid */}
      <div className="grid grid-cols-4 gap-2 my-1.5">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-1 px-1.5 rounded border border-slate-100 dark:border-slate-800/80 text-center">
          <div className="text-[8px] uppercase font-bold text-slate-400">Samples</div>
          <div className="text-sm font-mono font-extrabold text-slate-800 dark:text-white leading-none mt-0.5">
            {totalSamples ?? 0}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-1 px-1.5 rounded border border-slate-100 dark:border-slate-800/80 text-center">
          <div className="text-[8px] uppercase font-bold text-slate-400">Duration</div>
          <div className="text-sm font-mono font-extrabold text-slate-800 dark:text-white leading-none mt-0.5">
            {duration}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-1 px-1.5 rounded border border-slate-100 dark:border-slate-800/80 text-center">
          <div className="text-[8px] uppercase font-bold text-slate-400">Coverage</div>
          <div className="text-sm font-mono font-extrabold text-slate-800 dark:text-white leading-none mt-0.5">
            {coveragePct != null ? `${coveragePct}%` : '—'}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-1 px-1.5 rounded border border-slate-100 dark:border-slate-800/80 text-center">
          <div className="text-[8px] uppercase font-bold text-slate-400">Distance</div>
          <div className="text-sm font-mono font-extrabold text-slate-800 dark:text-white leading-none mt-0.5">
            {pathDistanceKm > 0 ? `${pathDistanceKm.toFixed(2)}` : '—'}
          </div>
        </div>
      </div>

      {/* Buttons Controls */}
      <div className="flex gap-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-2">
        <button
          onClick={handleToggleCollection}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-extrabold text-white transition-all outline-none border ${
            isCollecting 
              ? 'bg-red-500 hover:bg-red-600 border-red-500' 
              : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500'
          }`}
        >
          {isCollecting ? <Square size={10} /> : <Play size={10} />}
          {isCollecting ? 'Stop' : 'Start'}
        </button>

        <button
          onClick={clearAlerts}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-extrabold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-300 transition-all outline-none"
        >
          <RefreshCw size={10} />
          Reset
        </button>

        <button
          onClick={handleExportCSV}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-extrabold bg-blue-500 hover:bg-blue-600 border border-blue-500 text-white transition-all outline-none"
        >
          <Download size={10} />
          Export
        </button>
      </div>
    </motion.div>
  );
}

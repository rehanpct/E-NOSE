import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Play, Square, Pause, Database, Activity, Save } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';
import { API_BASE, fetchJson } from '../utils/api';

const LABELS = [
  'Clean Air',
  'LPG',
  'Methane',
  'Smoke',
  'Alcohol',
  'Carbon Monoxide',
  'Mixed Gas'
];

export default function DatasetCollectionPage() {
  const { isConnected, esp32Connected, data } = useDroneData();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [collectionState, setCollectionState] = useState({
    is_collecting: false,
    current_label: 'Clean Air',
    samples_collected: 0,
    target_count: null,
    start_time: null
  });
  
  const [duration, setDuration] = useState('00:00:00');
  const [customCount, setCustomCount] = useState(100);

  // Fetch initial state and poll while collecting
  useEffect(() => {
    const load = () => {
      fetchJson('/api/dataset/stats')
        .then((data) => {
          if (data.state) {
            setCollectionState(data.state);
          }
        })
        .catch((err) => console.error('Could not fetch dataset stats', err));
    };
    load();
    const interval = setInterval(load, collectionState.is_collecting ? 2000 : 10000);
    return () => clearInterval(interval);
  }, [collectionState.is_collecting]);
  
  // Timer for duration
  useEffect(() => {
    let interval;
    if (collectionState.is_collecting && collectionState.start_time) {
      interval = setInterval(() => {
        const start = new Date(collectionState.start_time);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000);
        
        const h = String(Math.floor(diff / 3600)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const s = String(diff % 60).padStart(2, '0');
        setDuration(`${h}:${m}:${s}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [collectionState.is_collecting, collectionState.start_time]);

  const handleAction = async (action) => {
    const payload = { 
      action, 
      label: collectionState.current_label,
      target_count: action === 'start' ? customCount : null 
    };
    try {
      const res = await fetch(`${API_BASE}/api/dataset/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const newState = await res.json();
      setCollectionState(newState);
      if(action === 'stop' || action === 'pause') {
         setDuration('00:00:00');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? sidebarCollapsed ? 72 : 240 : 0 }}>
        <Header onToggleFullscreen={() => {}} isFullscreen={isFullscreen} />
        
        <main className="flex-1 p-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dataset Collection</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Live data labeling and collection for model retraining.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Control Panel */}
            <motion.div className="glass p-6 rounded-2xl" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}}>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Database className="text-primary-500" /> Collection Controls
              </h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Gas Label</label>
                <select 
                  value={collectionState.current_label}
                  onChange={(e) => setCollectionState({...collectionState, current_label: e.target.value})}
                  disabled={collectionState.is_collecting}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Quick Capture Target</label>
                <div className="flex flex-wrap gap-2">
                  {[100, 250, 500].map(count => (
                    <button 
                      key={count}
                      onClick={() => setCustomCount(count)}
                      disabled={collectionState.is_collecting}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${customCount === count ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'} disabled:opacity-50`}
                    >
                      {count}
                    </button>
                  ))}
                  <input
                    type="number"
                    placeholder="Custom"
                    value={customCount || ''}
                    disabled={collectionState.is_collecting}
                    onChange={(e) => setCustomCount(parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {!collectionState.is_collecting ? (
                  <button onClick={() => handleAction('start')} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/30">
                    <Play size={18} /> Start Collection
                  </button>
                ) : (
                  <button onClick={() => handleAction('pause')} className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-amber-500/30">
                    <Pause size={18} /> Pause
                  </button>
                )}
                
                <button onClick={() => handleAction('stop')} disabled={!collectionState.is_collecting && collectionState.samples_collected === 0} className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 disabled:shadow-none text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-500/30">
                  <Square size={18} /> Stop
                </button>
              </div>
            </motion.div>

            {/* Stats Panel */}
            <motion.div className="glass p-6 rounded-2xl flex flex-col justify-center" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay: 0.1}}>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center border border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Status</p>
                    <p className={`text-xl font-bold ${collectionState.is_collecting ? 'text-emerald-500 animate-pulse' : 'text-slate-600 dark:text-slate-300'}`}>
                      {collectionState.is_collecting ? 'RECORDING' : 'IDLE'}
                    </p>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center border border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Current Label</p>
                    <p className="text-xl font-bold text-primary-500">{collectionState.current_label}</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center border border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Session Duration</p>
                    <p className="text-xl font-mono font-bold text-slate-800 dark:text-white">{duration}</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center border border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Samples Collected</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">
                      {collectionState.samples_collected} {collectionState.target_count ? `/ ${collectionState.target_count}` : ''}
                    </p>
                    {collectionState.target_count && (
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 mt-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary-500 h-full transition-all" 
                          style={{width: `${Math.min(100, (collectionState.samples_collected / collectionState.target_count) * 100)}%`}}
                        />
                      </div>
                    )}
                 </div>
               </div>
            </motion.div>
            
            {/* Live Data Preview */}
            <motion.div className="glass p-6 rounded-2xl col-span-1 md:col-span-2" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.2}}>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="text-primary-500" /> Incoming Data Stream
              </h3>
              
              <div className="overflow-x-auto">
                <table className="table-enterprise">
                  <thead>
                    <tr>
                      <th>MQ-2</th>
                      <th>MQ-5</th>
                      <th>MQ-9</th>
                      <th>MQ-135</th>
                      <th>Temp (°C)</th>
                      <th>Humidity (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-mono">{data.mq2?.toFixed(1) || 0}</td>
                      <td className="font-mono">{data.mq5?.toFixed(1) || 0}</td>
                      <td className="font-mono">{data.mq9?.toFixed(1) || 0}</td>
                      <td className="font-mono">{data.mq135?.toFixed(1) || 0}</td>
                      <td className="font-mono">{data.dht_temp?.toFixed(1) || 0}</td>
                      <td className="font-mono">{data.dht_humidity?.toFixed(1) || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

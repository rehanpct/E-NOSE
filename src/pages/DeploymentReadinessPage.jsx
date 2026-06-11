import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { CheckCircle2, XCircle, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';
import { fetchJson } from '../utils/api';

export default function DeploymentReadinessPage() {
  const { backendConnected, esp32Connected, data, alerts } = useDroneData();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [health, setHealth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    setLoading(true);
    Promise.all([
      fetchJson('/api/system-health').catch(() => null),
      fetchJson('/api/analytics/trends?range=hour').catch(() => null),
    ]).then(([healthData, analyticsData]) => {
      setHealth(healthData);
      setAnalytics(analyticsData);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const checks = [
    { label: 'Database Connected', status: health?.database === 'online' },
    { label: 'Model Loaded', status: health?.model === 'loaded' },
    { label: 'Backend Reachable', status: backendConnected },
    { label: 'ESP32 Connected', status: esp32Connected },
    { label: 'Dataset Collection Working', status: health?.total_samples > 0 },
    { label: 'Prediction Engine Working', status: health?.total_predictions > 0 || (data.predicted_gas && data.predicted_gas !== 'Unknown') },
    { label: 'Alert Engine Working', status: alerts.length > 0 || health?.total_sensor_readings > 0 },
    { label: 'Analytics Working', status: analytics?.status === 'success' && (analytics?.reading_count > 0 || analytics?.prediction_count > 0) },
  ];

  const passedChecks = checks.filter(c => c.status).length;
  const totalChecks = checks.length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? sidebarCollapsed ? 72 : 240 : 0 }}>
        <Header onToggleFullscreen={() => {}} isFullscreen={isFullscreen} />
        
        <main className="flex-1 p-6 flex flex-col items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl glass p-8 rounded-3xl relative overflow-hidden">
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
                  <ShieldCheck className="text-primary-500" size={32} /> Final Deployment Validation
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">End-to-End System Readiness Checklist</p>
              </div>
              <button onClick={fetchHealth} disabled={loading} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <RefreshCw size={20} className={`text-primary-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-center mb-10">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-200 dark:text-slate-800" />
                  <circle cx="96" cy="96" r="88" fill="none" stroke={score === 100 ? '#10b981' : score >= 80 ? '#f59e0b' : '#ef4444'} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(score / 100) * 553} 553`} className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-black ${score === 100 ? 'text-emerald-500' : score >= 80 ? 'text-amber-500' : 'text-red-500'}`}>{score}%</span>
                  <span className="text-sm font-medium text-slate-500">Readiness</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {checks.map((check) => (
                <div key={check.label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{check.label}</span>
                  {check.status ? (
                    <CheckCircle2 className="text-emerald-500" />
                  ) : (
                    <XCircle className="text-red-500" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <button disabled={score < 100} className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-2 ${score === 100 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}>
                <Activity size={24} /> {score === 100 ? 'Ready for Live Deployment' : 'Fix Issues to Deploy'}
              </button>
            </div>

          </motion.div>
        </main>
      </div>
    </div>
  );
}

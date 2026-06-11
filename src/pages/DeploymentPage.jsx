import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { fetchJson, formatUptime } from '../utils/api';
import {
  Rocket, CheckCircle, Cpu, Send, Clock, Activity,
  Target, ArrowRight, Server, Gauge, Terminal,
  CircleDot, Zap, Shield
} from 'lucide-react';

const pipelineSteps = [
  {
    label: 'Data Collection',
    icon: CircleDot,
    desc: 'Sensor array streaming',
    healthKey: 'esp32',
  },
  {
    label: 'Model Processing',
    icon: Cpu,
    desc: 'AI inference engine',
    healthKey: 'model',
  },
  {
    label: 'Prediction Output',
    icon: Send,
    desc: 'Results delivery',
    healthKey: 'backend',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function stepStatus(health, key) {
  if (!health) return { label: 'Unknown', color: '#94a3b8' };
  if (key === 'esp32') {
    return health.esp32 === 'online'
      ? { label: 'Active', color: '#10b981' }
      : { label: 'Inactive', color: '#ef4444' };
  }
  if (key === 'model') {
    return health.model === 'loaded'
      ? { label: 'Active', color: '#10b981' }
      : { label: 'Failed', color: '#ef4444' };
  }
  return health.backend === 'online'
    ? { label: 'Active', color: '#10b981' }
    : { label: 'Offline', color: '#ef4444' };
}

export default function DeploymentPage() {
  const { data, systemHealth, modelStatus } = useDroneData();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deploymentInfo, setDeploymentInfo] = useState(null);

  useEffect(() => {
    const load = () => {
      fetchJson('/api/deployment-info')
        .then(setDeploymentInfo)
        .catch(() => setDeploymentInfo(null));
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle no model / unavailable metadata checks
  const isLoaded = modelStatus?.loaded || (deploymentInfo && deploymentInfo.model_status === 'Loaded');
  const metadataAvailable = modelStatus != null || deploymentInfo != null;

  let modelName = "Metadata unavailable";
  let modelType = "Metadata unavailable";
  let accuracy = "Metadata unavailable";
  
  if (metadataAvailable) {
    if (isLoaded) {
      modelName = modelStatus?.filename || deploymentInfo?.active_model || "Metadata unavailable";
      modelType = modelStatus?.model_type || deploymentInfo?.model_type || "Metadata unavailable";
      const activeMetrics = modelStatus?.active_metrics || deploymentInfo?.active_metrics;
      accuracy = activeMetrics?.accuracy != null 
        ? `${(activeMetrics.accuracy * 100).toFixed(1)}%`
        : "Accuracy metadata unavailable";
    } else {
      modelName = "No model deployed";
      modelType = "No model deployed";
      accuracy = "No model deployed";
    }
  }

  const uptimeSeconds = deploymentInfo?.uptime_seconds ?? systemHealth?.uptime ?? 0;
  const predictionsPerMin = deploymentInfo?.predictions_per_minute ?? systemHealth?.predictions_per_minute ?? 0;
  const modelLoaded = isLoaded;

  const perfMetrics = [
    { label: 'Predictions/min', value: predictionsPerMin || '—', icon: Zap, color: '#0ea5e9' },
    { label: 'Model Type', value: modelType, icon: Gauge, color: '#10b981' },
    { label: 'Model Accuracy', value: accuracy, icon: Target, color: '#8b5cf6' },
    { label: 'Uptime', value: formatUptime(uptimeSeconds), icon: Shield, color: '#f59e0b' },
  ];

  const logs = deploymentInfo?.deployment_log?.length
    ? deploymentInfo.deployment_log.map((log, i) => ({ ...log, id: i }))
    : [{ id: 0, timestamp: '—', message: 'No deployment events recorded', level: 'info' }];

  const levelColors = {
    success: 'text-emerald-500',
    info: 'text-sky-500',
    warning: 'text-amber-500',
    error: 'text-red-500',
  };

  const levelDots = {
    success: 'bg-emerald-500',
    info: 'bg-sky-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768
            ? isCollapsed ? 72 : 240
            : 0,
        }}
      >
        <Header onToggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />

        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto"
        >
          <motion.div variants={itemVariants}>
            <h1 className="text-2xl lg:text-3xl font-bold gradient-text">Model Deployment</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Monitor and manage your deployed AI models
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass card-sensor">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-sky-500/20">
                  <Rocket size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    {modelName}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Currently Deployed Model</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`status-dot ${modelLoaded ? 'status-online' : 'status-offline'}`} />
                    <span className={`text-sm font-semibold ${modelLoaded ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {modelLoaded ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Status</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                    {modelStatus?.model_type || '—'}
                  </p>
                  <p className="text-[10px] text-slate-400">Algorithm</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold font-mono text-sky-600 dark:text-sky-400">
                    {formatUptime(uptimeSeconds)}
                  </p>
                  <p className="text-[10px] text-slate-400">Uptime</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass card-sensor">
            <div className="section-title">
              <Activity size={14} />
              Deployment Pipeline
            </div>
            <div className="flex items-center justify-center flex-wrap gap-0 py-6">
              {pipelineSteps.map((step, i) => {
                const status = stepStatus(systemHealth, step.healthKey);
                return (
                  <React.Fragment key={step.label}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.2, duration: 0.5 }}
                      className="glass p-5 flex flex-col items-center gap-3 min-w-[160px] relative"
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse-glow"
                        style={{ background: `${status.color}15` }}
                      >
                        <step.icon size={26} style={{ color: status.color }} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{step.label}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{step.desc}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle size={14} style={{ color: status.color }} />
                        <span className="text-xs font-semibold" style={{ color: status.color }}>
                          {status.label}
                        </span>
                      </div>
                    </motion.div>

                    {i < pipelineSteps.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: i * 0.2 + 0.3, duration: 0.4 }}
                        className="flex items-center px-2"
                      >
                        <div className="w-12 h-0.5 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full" />
                        <ArrowRight size={20} className="text-sky-500 -ml-1" />
                      </motion.div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {perfMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass card-sensor"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${metric.color}15` }}
                  >
                    <metric.icon size={20} style={{ color: metric.color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{metric.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{metric.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="glass card-sensor">
            <div className="section-title">
              <Terminal size={14} />
              Deployment Log
            </div>
            <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
              {logs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-[90px]">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${levelDots[log.level]}`} />
                    <span className="text-xs font-mono text-slate-400 whitespace-nowrap">{log.timestamp}</span>
                  </div>
                  <p className={`text-sm ${levelColors[log.level]} font-medium`}>{log.message}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
}

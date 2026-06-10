import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
  Crosshair, CheckCircle, AlertTriangle, XCircle, Clock, RotateCcw,
} from 'lucide-react';

const SENSOR_CONFIG = [
  { key: 'mq2', name: 'MQ-2', description: 'Combustible Gas & Smoke', color: '#ef4444' },
  { key: 'mq5', name: 'MQ-5', description: 'LPG & Natural Gas', color: '#f59e0b' },
  { key: 'mq9', name: 'MQ-9', description: 'Carbon Monoxide', color: '#10b981' },
  { key: 'mq135', name: 'MQ-135', description: 'Air Quality & VOCs', color: '#8b5cf6' },
  { key: 'dht11', name: 'DHT11', description: 'Temperature & Humidity', color: '#06b6d4' },
  { key: 'bme280', name: 'BME280', description: 'Barometric Pressure', color: '#3b82f6' },
];

// Fake recent calibration dates
const getLastCalibrated = (index) => {
  const now = new Date();
  const offsets = [2, 5, 1, 8, 3, 6]; // days ago
  const d = new Date(now.getTime() - offsets[index] * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function CircularGauge({ percentage, color, size = 100 }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.12)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="gauge-ring"
          style={{
            filter: `drop-shadow(0 0 6px ${color}40)`,
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-slate-700 dark:text-slate-200">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const configs = {
    healthy: {
      icon: CheckCircle,
      label: 'Healthy',
      className: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    },
    calibration_required: {
      icon: AlertTriangle,
      label: 'Calibration Required',
      className: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    },
    warning: {
      icon: XCircle,
      label: 'Warning',
      className: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    },
  };

  const config = configs[status] || configs.healthy;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}

export default function CalibrationPage() {
  const { data } = useDroneData();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((p) => !p), []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-screen"
      style={{ background: 'var(--color-surface)' }}
    >
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768
            ? sidebarCollapsed ? 72 : 240
            : 0,
        }}
      >
        <Header onToggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />

        <main className="flex-1 p-4 lg:p-6">
          {/* Page title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-1">
              <Crosshair size={24} className="text-sky-500" />
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                Sensor Calibration
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 ml-9">
              Manage and monitor sensor health, calibration status, and diagnostics
            </p>
          </motion.div>

          {/* Sensor calibration cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {SENSOR_CONFIG.map((sensor, index) => {
              const health = data.sensor_health?.[sensor.key] || 'healthy';
              const healthPct = data.sensor_health_pct?.[sensor.key] ?? 95;

              return (
                <motion.div
                  key={sensor.key}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="glass card-sensor"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        {sensor.name}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {sensor.description}
                      </p>
                    </div>
                    <StatusBadge status={health} />
                  </div>

                  {/* Gauge and info */}
                  <div className="flex items-center gap-6 mb-5">
                    <CircularGauge
                      percentage={healthPct}
                      color={
                        health === 'healthy'
                          ? '#10b981'
                          : health === 'calibration_required'
                          ? '#f59e0b'
                          : '#ef4444'
                      }
                    />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
                          Sensor Health
                        </p>
                        <div className="progress-bar">
                          <motion.div
                            className="progress-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${healthPct}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            style={{
                              background:
                                health === 'healthy'
                                  ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                                  : health === 'calibration_required'
                                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                  : 'linear-gradient(90deg, #ef4444, #f87171)',
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                        <Clock size={12} />
                        <span>{getLastCalibrated(index)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Calibrate button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={14} />
                    Calibrate Now
                  </motion.button>
                </motion.div>
              );
            })}
          </div>

          {/* Summary info */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass card-sensor mt-6"
          >
            <div className="section-title">Calibration Summary</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              {[
                {
                  label: 'Total Sensors',
                  value: '6',
                  color: '#0ea5e9',
                },
                {
                  label: 'Healthy',
                  value: Object.values(data.sensor_health || {}).filter((s) => s === 'healthy').length,
                  color: '#10b981',
                },
                {
                  label: 'Need Calibration',
                  value: Object.values(data.sensor_health || {}).filter(
                    (s) => s === 'calibration_required'
                  ).length,
                  color: '#f59e0b',
                },
                {
                  label: 'Warnings',
                  value: Object.values(data.sensor_health || {}).filter((s) => s === 'warning').length,
                  color: '#ef4444',
                },
              ].map((stat, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-white/30 dark:bg-slate-800/30">
                  <p
                    className="text-2xl font-bold"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
}

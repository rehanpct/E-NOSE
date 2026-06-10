import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Activity } from 'lucide-react';

// Lazy load components
const DroneStatus = React.lazy(() => import('../components/DroneStatus'));
const GasConcentrationDashboard = React.lazy(() => import('../components/GasConcentrationDashboard'));
const EnvironmentalSensors = React.lazy(() => import('../components/EnvironmentalSensors'));
const GasSensors = React.lazy(() => import('../components/GasSensors'));
const DroneMap = React.lazy(() => import('../components/DroneMap'));
const AlertsPanel = React.lazy(() => import('../components/AlertsPanel'));
const SystemHealth = React.lazy(() => import('../components/SystemHealth'));
const DataCollection = React.lazy(() => import('../components/DataCollection'));
const SensorCalibration = React.lazy(() => import('../components/SensorCalibration'));
const ActivityFeed = React.lazy(() => import('../components/ActivityFeed'));
const AQIPanel = React.lazy(() => import('../components/AQIPanel'));
const TopStatusBar = React.lazy(() => import('../components/TopStatusBar'));
const HeroPredictionCard = React.lazy(() => import('../components/HeroPredictionCard'));
const GasCompositionChart = React.lazy(() => import('../components/GasCompositionChart'));
const MissionControlPanel = React.lazy(() => import('../components/MissionControlPanel'));

// Placeholder components that gracefully render if not yet created
function PlaceholderCard({ title, spanClass = '', children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`glass card-sensor ${spanClass}`}
    >
      <div className="section-title">{title}</div>
      {children || (
        <div className="flex items-center justify-center h-32 text-sm text-slate-400 dark:text-slate-500">
          <Activity size={16} className="mr-2" />
          Loading {title}...
        </div>
      )}
    </motion.div>
  );
}

function LazyComponent({ Component, title, spanClass }) {
  if (!Component) return <PlaceholderCard title={title} spanClass={spanClass} />;
  return (
    <React.Suspense fallback={<PlaceholderCard title={title} spanClass={spanClass} />}>
      <div className={spanClass}>
        <Component />
      </div>
    </React.Suspense>
  );
}

// Custom recharts tooltip with glass style
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="glass p-3 text-xs"
      style={{ borderRadius: 10, minWidth: 140 }}
    >
      <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: entry.color }}
            />
            <span className="text-slate-500 dark:text-slate-400">{entry.name}</span>
          </span>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
            {Math.round(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { sensorHistory, backendConnected, esp32Connected, lastReceivedTimestamp } = useDroneData();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Prepare chart data from sensorHistory
  const chartData = sensorHistory.timestamps.map((ts, i) => ({
    time: ts,
    'MQ-2': sensorHistory.mq2[i] ?? 0,
    'MQ-5': sensorHistory.mq5[i] ?? 0,
    'MQ-9': sensorHistory.mq9[i] ?? 0,
    'MQ-135': sensorHistory.mq135[i] ?? 0,
  }));

  const lineColors = {
    'MQ-2': '#ef4444',
    'MQ-5': '#f59e0b',
    'MQ-9': '#10b981',
    'MQ-135': '#8b5cf6',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-screen"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Sidebar */}
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main content */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768
            ? sidebarCollapsed ? 72 : 240
            : 0,
        }}
      >
        {/* Header */}
        <Header onToggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />

        {/* Dashboard content */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Connection Status Banner (if disconnected) */}
          {(!backendConnected || !esp32Connected) && (
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
          )}

          {/* Top Status Bar */}
          <LazyComponent Component={TopStatusBar} title="System Status" spanClass="mb-6" />

          {/* Hero Section */}
          <LazyComponent Component={HeroPredictionCard} title="Live Detection" spanClass="mb-6" />

          {/* Dashboard grid */}
          <div className="dashboard-grid">
            
            {/* Mission Control - span 2 */}
            <LazyComponent Component={MissionControlPanel} title="Mission Control" spanClass="span-2" />

            {/* Gas Composition Chart */}
            <LazyComponent Component={GasCompositionChart} title="Gas Composition" spanClass="" />
            
            {/* System Health */}
            <LazyComponent Component={SystemHealth} title="System Health" spanClass="" />
            
            {/* Gas Concentration Dashboard - full width */}
            <LazyComponent Component={GasConcentrationDashboard} title="Gas Concentration" spanClass="span-full" />
            
            {/* Gas Sensors - span 2 */}
            <LazyComponent Component={GasSensors} title="Gas Sensors" spanClass="span-2" />
            
            {/* Data Collection */}
            <LazyComponent Component={DataCollection} title="Data Collection" spanClass="" />
            
            {/* Environmental Quality Score */}
            <LazyComponent Component={AQIPanel} title="Environmental Quality Score" spanClass="" />
            
            {/* Environmental Sensors */}
            <LazyComponent Component={EnvironmentalSensors} title="Environmental Sensors" spanClass="" />

            {/* Sensor Calibration */}
            <LazyComponent Component={SensorCalibration} title="Sensor Calibration" spanClass="" />

            {/* Live Activity Feed */}
            <LazyComponent Component={ActivityFeed} title="Live Activity" spanClass="" />
            
            {/* Drone Status */}
            <LazyComponent Component={DroneStatus} title="Drone Status" spanClass="span-full" />

            {/* Drone Map - span 2 */}
            <LazyComponent Component={DroneMap} title="Drone Map" spanClass="span-2" />

            {/* Real-time Gas Chart - span 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass card-sensor span-2"
            >
              <div className="section-title">
                <Activity size={14} />
                Real-Time Gas Concentrations
              </div>
              <div className="mt-3" style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.15)"
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      interval="preserveStartEnd"
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      iconType="circle"
                      iconSize={8}
                    />
                    {Object.entries(lineColors).map(([name, color]) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0, fill: color }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 dark:text-slate-500">
                <span>Last 60 readings</span>
                <span>•</span>
                <span>Updated every 2s</span>
              </div>
            </motion.div>

            {/* Alerts Panel */}
            <LazyComponent Component={AlertsPanel} title="Alerts" spanClass="" />
          </div>
        </main>
      </div>
    </motion.div>
  );
}

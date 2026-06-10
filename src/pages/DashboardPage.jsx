import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ErrorBoundary from '../components/ErrorBoundary';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import { Activity } from 'lucide-react';
import RealTimeGasChart from '../components/RealTimeGasChart';
import ConnectionBanner from '../components/ConnectionBanner';

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
        <div className="flex flex-col gap-3 mt-4 w-full">
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      )}
    </motion.div>
  );
}

function LazyComponent({ Component, title, spanClass }) {
  if (!Component) return <PlaceholderCard title={title} spanClass={spanClass} />;
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<PlaceholderCard title={title} spanClass={spanClass} />}>
        <div className={spanClass}>
          <Component />
        </div>
      </React.Suspense>
    </ErrorBoundary>
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
  console.log("DashboardPage render");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    console.log("DashboardPage mounted");
    return () => console.log("DashboardPage unmounted");
  }, []);

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
          <ConnectionBanner />

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
            <ErrorBoundary>
              <div className="span-2">
                <RealTimeGasChart />
              </div>
            </ErrorBoundary>

            {/* Alerts Panel */}
            <LazyComponent Component={AlertsPanel} title="Alerts" spanClass="" />
          </div>
        </main>
      </div>
    </motion.div>
  );
}

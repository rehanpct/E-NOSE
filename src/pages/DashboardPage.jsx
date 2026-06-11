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
const DroneMap = React.lazy(() => import('../components/DroneMap'));
const AlertsPanel = React.lazy(() => import('../components/AlertsPanel'));
const SystemHealth = React.lazy(() => import('../components/SystemHealth'));
const DataCollection = React.lazy(() => import('../components/DataCollection'));
const SensorCalibration = React.lazy(() => import('../components/SensorCalibration'));
const ActivityFeed = React.lazy(() => import('../components/ActivityFeed'));
const AQIPanel = React.lazy(() => import('../components/AQIPanel'));
const HeroPredictionCard = React.lazy(() => import('../components/HeroPredictionCard'));
const GasCompositionChart = React.lazy(() => import('../components/GasCompositionChart'));
const MissionControlPanel = React.lazy(() => import('../components/MissionControlPanel'));
const SensorCardGrid = React.lazy(() => import('../components/SensorCardGrid'));

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // DashboardPage mounted
    return () => {};
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

          {/* Row 1: Key Metrics & System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3 items-stretch">
            <div className="lg:col-span-7">
              <ErrorBoundary>
                <React.Suspense fallback={<PlaceholderCard title="Live Detection" />}>
                  <HeroPredictionCard />
                </React.Suspense>
              </ErrorBoundary>
            </div>
            <div className="lg:col-span-3">
              <ErrorBoundary>
                <React.Suspense fallback={<PlaceholderCard title="System Health" />}>
                  <SystemHealth />
                </React.Suspense>
              </ErrorBoundary>
            </div>
            <div className="lg:col-span-2">
              <ErrorBoundary>
                <React.Suspense fallback={<PlaceholderCard title="Mission Control" />}>
                  <MissionControlPanel />
                </React.Suspense>
              </ErrorBoundary>
            </div>
          </div>

          {/* Row 2: Unified Sensor Grid */}
          <div className="mb-3">
            <ErrorBoundary>
              <React.Suspense fallback={<PlaceholderCard title="Unified Sensor Grid" />}>
                <SensorCardGrid />
              </React.Suspense>
            </ErrorBoundary>
          </div>

          {/* Row 3: Real-Time Trends & Composition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3 items-stretch">
            <div className="lg:col-span-8">
              <ErrorBoundary>
                <React.Suspense fallback={<PlaceholderCard title="Real-Time Gas concentrations" />}>
                  <RealTimeGasChart />
                </React.Suspense>
              </ErrorBoundary>
            </div>
            <div className="lg:col-span-4">
              <ErrorBoundary>
                <React.Suspense fallback={<PlaceholderCard title="Gas Composition" />}>
                  <GasCompositionChart />
                </React.Suspense>
              </ErrorBoundary>
            </div>
          </div>

          {/* Row 4: Spatial Telemetry & Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3 items-stretch">
            <ErrorBoundary>
              <React.Suspense fallback={<PlaceholderCard title="Drone Map" />}>
                <DroneMap />
              </React.Suspense>
            </ErrorBoundary>
            <ErrorBoundary>
              <React.Suspense fallback={<PlaceholderCard title="Live Activity" />}>
                <ActivityFeed />
              </React.Suspense>
            </ErrorBoundary>
          </div>

          {/* ─── Secondary Monitoring Rows (below primary fold) ─── */}
          <div className="flex items-center gap-3 mb-3 mt-1">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/60" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap">Additional Monitoring</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/60" />
          </div>

          {/* Row 5: Concentration Overview & Environmental Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3 items-stretch">
            <div className="lg:col-span-8">
              <ErrorBoundary>
                <React.Suspense fallback={<PlaceholderCard title="Gas Concentration Overview" />}>
                  <GasConcentrationDashboard />
                </React.Suspense>
              </ErrorBoundary>
            </div>
            <div className="lg:col-span-4">
              <ErrorBoundary>
                <React.Suspense fallback={<PlaceholderCard title="Environmental Quality Score" />}>
                  <AQIPanel />
                </React.Suspense>
              </ErrorBoundary>
            </div>
          </div>

          {/* Row 6: Detailed Drone Status, Calibration & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3 items-stretch">
            <div className="lg:col-span-4">
              <ErrorBoundary>
                <React.Suspense fallback={<PlaceholderCard title="Drone Status" />}>
                  <DroneStatus />
                </React.Suspense>
              </ErrorBoundary>
            </div>
            <div className="lg:col-span-4">
              <ErrorBoundary>
                <React.Suspense fallback={<PlaceholderCard title="System Alerts" />}>
                  <AlertsPanel />
                </React.Suspense>
              </ErrorBoundary>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-3">
              <div className="flex-1 flex flex-col">
                <ErrorBoundary>
                  <React.Suspense fallback={<PlaceholderCard title="Sensor Calibration" />}>
                    <SensorCalibration />
                  </React.Suspense>
                </ErrorBoundary>
              </div>
              <div className="flex-1 flex flex-col">
                <ErrorBoundary>
                  <React.Suspense fallback={<PlaceholderCard title="Data Collection" />}>
                    <DataCollection />
                  </React.Suspense>
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </main>
      </div>
    </motion.div>
  );
}

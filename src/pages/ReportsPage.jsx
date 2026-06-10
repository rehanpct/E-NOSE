import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { exportToCSV, generateMissionReport, formatTime } from '../utils/exportUtils';
import {
  FileText, Download, FileBarChart, FlaskConical, Brain, MapPin,
  Route, Clock, AlertTriangle, Info, XCircle, Siren, Trash2,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, unit, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass card-sensor"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
            {label}
          </p>
          <p className="text-xl font-bold text-slate-800 dark:text-white">
            {value}
            {unit && (
              <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function AlertLevelBadge({ level }) {
  const configs = {
    information: { className: 'alert-badge alert-info', icon: Info, label: 'Info' },
    warning: { className: 'alert-badge alert-warning', icon: AlertTriangle, label: 'Warning' },
    critical: { className: 'alert-badge alert-critical', icon: XCircle, label: 'Critical' },
    emergency: { className: 'alert-badge alert-emergency', icon: Siren, label: 'Emergency' },
  };
  const config = configs[level] || configs.information;
  const Icon = config.icon;

  return (
    <span className={config.className}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}

export default function ReportsPage() {
  const { data, alerts, getExportHistory, clearAlerts } = useDroneData();
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

  const handleExportCSV = useCallback(() => {
    const history = getExportHistory();
    if (history.length > 0) {
      exportToCSV(history, `enose_data_${Date.now()}.csv`);
    }
  }, [getExportHistory]);

  const handleGenerateReport = useCallback(() => {
    generateMissionReport(data, alerts);
  }, [data, alerts]);

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
              <FileText size={24} className="text-sky-500" />
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                Mission Reports
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 ml-9">
              Export data, generate reports, and review mission logs
            </p>
          </motion.div>

          {/* Quick action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-3 mb-6"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExportCSV}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={16} />
              Export CSV
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleGenerateReport}
              className="btn-primary flex items-center gap-2"
            >
              <FileBarChart size={16} />
              Generate Report
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={clearAlerts}
              className="btn-secondary flex items-center gap-2"
            >
              <Trash2 size={16} />
              Clear Alerts
            </motion.button>
          </motion.div>

          {/* Stats summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={FlaskConical}
              label="Total Samples"
              value={data.samples_collected ?? 0}
              color="#0ea5e9"
              delay={0.15}
            />
            <StatCard
              icon={Brain}
              label="Predictions"
              value={data.predictions_generated ?? 0}
              color="#8b5cf6"
              delay={0.2}
            />
            <StatCard
              icon={MapPin}
              label="Area Surveyed"
              value={data.area_surveyed?.toFixed(1) ?? '0.0'}
              unit="m²"
              color="#10b981"
              delay={0.25}
            />
            <StatCard
              icon={Route}
              label="Distance Covered"
              value={data.distance_covered?.toFixed(2) ?? '0.00'}
              unit="km"
              color="#f59e0b"
              delay={0.3}
            />
          </div>

          {/* Mission log table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass card-sensor"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="section-title mb-0">
                <AlertTriangle size={14} />
                Mission Alert Log
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {alerts.length} entries
              </span>
            </div>

            {/* Scrollable table container */}
            <div
              className="overflow-auto rounded-xl border border-slate-100 dark:border-slate-800"
              style={{ maxHeight: 420 }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 sticky top-0 z-10">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Timestamp
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Level
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-12 text-center text-slate-400 dark:text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <FileText size={24} className="opacity-40" />
                          <span>No alerts recorded yet. Data will appear here as alerts are generated.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    alerts.map((alert, i) => (
                      <motion.tr
                        key={alert.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.5) }}
                        className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                            <Clock size={12} className="flex-shrink-0 opacity-50" />
                            {alert.timestamp
                              ? new Date(alert.timestamp).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              : '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <AlertLevelBadge level={alert.level} />
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-sm">
                          {alert.message || '—'}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
}

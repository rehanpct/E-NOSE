import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import {
  Bell, ShieldCheck, Trash2, AlertTriangle, AlertCircle, Info, XCircle
} from 'lucide-react';

const LEVEL_CONFIG = {
  information: {
    cssClass: 'alert-info',
    icon: Info,
    label: 'Info',
  },
  info: {
    cssClass: 'alert-info',
    icon: Info,
    label: 'Info',
  },
  warning: {
    cssClass: 'alert-warning',
    icon: AlertTriangle,
    label: 'Warning',
  },
  critical: {
    cssClass: 'alert-critical',
    icon: AlertCircle,
    label: 'Critical',
  },
  emergency: {
    cssClass: 'alert-emergency',
    icon: XCircle,
    label: 'Emergency',
  },
};

function AlertItem({ alert, index }) {
  const config = LEVEL_CONFIG[alert.level] || LEVEL_CONFIG.info;
  const Icon = config.icon;

  const timeStr = useMemo(() => {
    try {
      return new Date(alert.timestamp).toLocaleTimeString();
    } catch {
      return '—';
    }
  }, [alert.timestamp]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -30, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: 30, height: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: index * 0.03,
      }}
      className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
    >
      {/* Level badge */}
      <span className={`alert-badge ${config.cssClass} flex-shrink-0 mt-0.5`}>
        <Icon size={11} />
        {config.label}
      </span>

      {/* Message & timestamp */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
          {alert.message}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
          {timeStr}
        </p>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-12"
    >
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
        <ShieldCheck size={28} className="text-emerald-500" />
      </div>
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">
        All Clear
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-[200px]">
        No active alerts. The system is operating normally.
      </p>
    </motion.div>
  );
}

export default function AlertsPanel() {
  const { alerts, clearAlerts } = useDroneData();

  const alertCount = alerts?.length || 0;
  const criticalCount = useMemo(() => {
    return (alerts || []).filter(a => a.level === 'critical' || a.level === 'emergency').length;
  }, [alerts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass card-sensor"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="section-title mb-0">
          <Bell size={14} className="text-sky-500" />
          System Alerts
        </div>

        <div className="flex items-center gap-2">
          {/* Alert counter */}
          {alertCount > 0 && (
            <motion.span
              key={alertCount}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold"
              style={{
                background: criticalCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(14, 165, 233, 0.1)',
                color: criticalCount > 0 ? '#ef4444' : '#0ea5e9',
              }}
            >
              {alertCount}
            </motion.span>
          )}

          {/* Clear button */}
          {alertCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearAlerts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={12} />
              Clear
            </motion.button>
          )}
        </div>
      </div>

      {/* Scrollable alerts list */}
      <div
        className="overflow-y-auto pr-1"
        style={{ maxHeight: '300px' }}
      >
        {alertCount === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {alerts.map((alert, idx) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                index={idx}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

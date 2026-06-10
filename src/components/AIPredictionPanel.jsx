import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import {
  Brain, Activity, Cpu, Clock, ShieldCheck, AlertTriangle, Zap
} from 'lucide-react';

const RISK_COLORS = {
  Low: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  Medium: { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  High: { bg: 'rgba(249, 115, 22, 0.12)', text: '#f97316', border: 'rgba(249, 115, 22, 0.3)' },
  Critical: { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
};

const HEALTH_COLORS = {
  healthy: '#10b981',
  calibration_required: '#f59e0b',
  warning: '#ef4444',
};

const HEALTH_LABELS = {
  healthy: 'OK',
  calibration_required: 'Cal',
  warning: 'Warn',
};

const SENSOR_DISPLAY_NAMES = {
  mq2: 'MQ-2',
  mq5: 'MQ-5',
  mq9: 'MQ-9',
  mq135: 'MQ-135',
  dht11: 'DHT11',
  bme280: 'BME280',
};

function ConfidenceGauge({ value }) {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const gaugeColor = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(14, 165, 233, 0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Animated value ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="gauge-ring"
          style={{
            filter: `drop-shadow(0 0 6px ${gaugeColor}40)`,
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-2xl font-bold text-slate-700 dark:text-slate-100"
        >
          {Math.round(value)}%
        </motion.span>
        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Confidence
        </span>
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const colors = RISK_COLORS[level] || RISK_COLORS.Low;

  return (
    <motion.span
      key={level}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {level === 'Critical' || level === 'High' ? (
        <AlertTriangle size={12} />
      ) : (
        <ShieldCheck size={12} />
      )}
      {level} Risk
    </motion.span>
  );
}

function TopPredictionsChart({ predictions }) {
  if (!predictions || predictions.length === 0) return null;

  const maxScore = Math.max(...predictions.map(p => p.score), 1);

  return (
    <div className="space-y-2.5">
      <AnimatePresence mode="popLayout">
        {predictions.map((pred, idx) => (
          <motion.div
            key={`${pred.gas}-${idx}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-24 truncate text-right">
              {pred.gas}
            </span>
            <div className="flex-1 progress-bar" style={{ height: '10px' }}>
              <motion.div
                className="progress-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(pred.score / maxScore) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.1 }}
                style={{
                  opacity: idx === 0 ? 1 : 0.6 + (0.4 * (1 - idx / predictions.length)),
                }}
              />
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-10 text-right tabular-nums">
              {pred.score}%
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function SensorHealthIndicators({ sensorHealth }) {
  if (!sensorHealth) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(sensorHealth).map(([sensor, status]) => {
        const color = HEALTH_COLORS[status] || '#94a3b8';
        const label = HEALTH_LABELS[status] || status;
        const displayName = SENSOR_DISPLAY_NAMES[sensor] || sensor;

        return (
          <motion.div
            key={sensor}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
            style={{ background: `${color}08` }}
          >
            <motion.div
              animate={{
                boxShadow: status === 'warning'
                  ? ['0 0 0px rgba(239,68,68,0.4)', '0 0 8px rgba(239,68,68,0.6)', '0 0 0px rgba(239,68,68,0.4)']
                  : 'none'
              }}
              transition={{ duration: 1.5, repeat: status === 'warning' ? Infinity : 0 }}
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: color }}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[9px] font-medium leading-tight" style={{ color }}>
                {label}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function AIPredictionPanel() {
  const { data } = useDroneData();

  const topPredictions = useMemo(() => {
    return (data.top_predictions || []).slice(0, 3);
  }, [data.top_predictions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass card-sensor p-5"
    >
      {/* Header */}
      <div className="section-title mb-4">
        <Brain size={14} className="text-sky-500" />
        AI Prediction
      </div>

      {/* Main prediction + Gauge row */}
      <div className="flex items-center gap-5 mb-5">
        {/* Confidence Gauge */}
        <ConfidenceGauge value={data.confidence || 0} />

        {/* Prediction Info */}
        <div className="flex-1 min-w-0">
          {/* Current Prediction */}
          <AnimatePresence mode="wait">
            <motion.h2
              key={data.prediction}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="gradient-text text-xl lg:text-2xl font-extrabold leading-tight mb-2 truncate"
            >
              {data.prediction || 'Analyzing...'}
            </motion.h2>
          </AnimatePresence>

          {/* Risk Badge */}
          <div className="mb-3">
            <RiskBadge level={data.risk_level || 'Low'} />
          </div>

          {/* Model & Inference */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Cpu size={12} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {data.model || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-slate-400" />
              <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                {data.inference_time || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-sky-200 dark:via-sky-800 to-transparent mb-4" />

      {/* Top 3 Predictions */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={12} className="text-sky-500" />
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Top Predictions
          </span>
        </div>
        <TopPredictionsChart predictions={topPredictions} />
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-sky-200 dark:via-sky-800 to-transparent mb-4" />

      {/* Sensor Health */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={12} className="text-sky-500" />
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Sensor Health
          </span>
        </div>
        <SensorHealthIndicators sensorHealth={data.sensor_health} />
      </div>
    </motion.div>
  );
}

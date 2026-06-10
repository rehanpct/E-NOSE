import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Wind, Thermometer, CloudRain, ToggleLeft, ToggleRight } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';

/* ── colour helpers ───────────────────────────────────── */

function barColor(pct) {
  if (pct < 33) return '#10b981';   // green
  if (pct < 66) return '#f59e0b';   // yellow
  return '#ef4444';                  // red
}

function textColor(pct) {
  if (pct < 33) return 'text-emerald-500';
  if (pct < 66) return 'text-amber-500';
  return 'text-red-500';
}

/* ── reading bar ──────────────────────────────────────── */

function ReadingBar({ label, pct }) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const color = barColor(clamped);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`text-[11px] font-semibold ${textColor(clamped)}`}>
          {Math.round(clamped)}%
        </span>
      </div>
      <div className="progress-bar">
        <motion.div
          className="progress-bar-fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/* ── sensor card ──────────────────────────────────────── */

function GasCard({ title, icon: Icon, value, unit = 'ppm', readings, delay = 0 }) {
  return (
    <motion.div
      className="glass card-sensor p-5 flex flex-col gap-3"
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
    >
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-500/10">
            <Icon size={18} className="text-primary-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-none">{title}</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Gas Sensor</p>
          </div>
        </div>
        <div className="bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
          <span className="text-[9px] uppercase tracking-wider text-blue-600 font-bold">LIVE DATA</span>
        </div>
      </div>

      {/* value */}
      <div className="flex items-baseline gap-1.5">
        <motion.span
          className="text-3xl font-extrabold gradient-text leading-none"
          key={Math.round(value)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {Math.round(value)}
        </motion.span>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>

      {/* derived bars */}
      <div className="flex flex-col gap-2 mt-1">
        {readings.map(r => (
          <ReadingBar key={r.label} label={r.label} pct={r.pct} />
        ))}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                       */
/* ══════════════════════════════════════════════════════ */

export default function GasSensors() {
  const { data } = useDroneData();
  const [showNormalized, setShowNormalized] = useState(false);

  const mq2_raw = data.raw_mq2 ?? 0;
  const mq5_raw = data.raw_mq5 ?? 0;
  const mq9_raw = data.raw_mq9 ?? 0;
  const mq135_raw = data.raw_mq135 ?? 0;

  const mq2_norm = data.mq2 ?? 0;
  const mq5_norm = data.mq5 ?? 0;
  const mq9_norm = data.mq9 ?? 0;
  const mq135_norm = data.mq135 ?? 0;

  const getReadings = (raw, norm, labels) => {
      // If showing normalized, the bar is just the normalized percentage.
      // If showing raw, we calculate percentage based on expected max (e.g., 1000) like before.
      return labels.map((l, i) => ({
          label: l,
          pct: showNormalized ? norm : (raw / (800 + i * 100)) * 100
      }));
  };

  const sensors = [
    {
      title: 'MQ-2',
      icon: Flame,
      value: showNormalized ? mq2_norm : mq2_raw,
      unit: showNormalized ? '%' : 'ppm',
      readings: getReadings(mq2_raw, mq2_norm, ['Smoke Level', 'LPG Detection', 'Gas Concentration'])
    },
    {
      title: 'MQ-5',
      icon: Wind,
      value: showNormalized ? mq5_norm : mq5_raw,
      unit: showNormalized ? '%' : 'ppm',
      readings: getReadings(mq5_raw, mq5_norm, ['LPG', 'Natural Gas', 'Hydrogen'])
    },
    {
      title: 'MQ-9',
      icon: CloudRain,
      value: showNormalized ? mq9_norm : mq9_raw,
      unit: showNormalized ? '%' : 'ppm',
      readings: getReadings(mq9_raw, mq9_norm, ['Carbon Monoxide', 'Methane'])
    },
    {
      title: 'MQ-135',
      icon: Thermometer,
      value: showNormalized ? mq135_norm : mq135_raw,
      unit: showNormalized ? '%' : 'ppm',
      readings: getReadings(mq135_raw, mq135_norm, ['Air Quality', 'VOC', 'Pollution Index'])
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button 
          onClick={() => setShowNormalized(!showNormalized)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {showNormalized ? <ToggleRight className="text-primary-500" size={18} /> : <ToggleLeft className="text-slate-400" size={18} />}
          <span>{showNormalized ? 'Normalized (0-100%)' : 'Raw Values (ppm)'}</span>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {sensors.map((s, i) => (
          <GasCard key={s.title} {...s} delay={i * 0.08} />
        ))}
      </div>
    </div>
  );
}

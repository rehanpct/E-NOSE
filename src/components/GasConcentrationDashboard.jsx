import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';

/* ── colour helpers ───────────────────────────────────── */

function gaugeColors(pct) {
  if (pct < 33) return { start: '#10b981', end: '#06b6d4' };   // green → cyan
  if (pct < 66) return { start: '#f59e0b', end: '#fb923c' };   // amber → orange
  return { start: '#ef4444', end: '#f87171' };                   // red
}

function statusLabel(pct) {
  if (pct < 33) return 'Good';
  if (pct < 66) return 'Moderate';
  return 'Poor';
}

function statusTextColor(pct) {
  if (pct < 33) return 'text-emerald-500';
  if (pct < 66) return 'text-amber-500';
  return 'text-red-500';
}

/* ── circular gauge component ─────────────────────────── */

function ConcentrationGauge({ value = 0, label, gradId, index = 0 }) {
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (pct / 100) * circumference;
  const colors = gaugeColors(pct);

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
    >
      <svg width={size} height={size} className="drop-shadow-lg">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>

        {/* track ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700/60"
        />

        {/* value arc – CSS transition for smoothness */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={`url(#${gradId})`} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="gauge-ring"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {/* center value */}
        <text x="50%" y="44%" textAnchor="middle" dominantBaseline="central"
          className="fill-slate-800 dark:fill-white font-bold"
          style={{ fontSize: '1.35rem' }}>
          {Math.round(pct)}
        </text>
        {/* tiny status word */}
        <text x="50%" y="64%" textAnchor="middle" dominantBaseline="central"
          className={`font-semibold ${statusTextColor(pct)}`}
          style={{ fontSize: '0.5rem', fill: colors.start }}>
          {statusLabel(pct)}
        </text>
      </svg>

      {/* label */}
      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center leading-tight max-w-[90px]">
        {label}
      </span>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                       */
/* ══════════════════════════════════════════════════════ */

export default function GasConcentrationDashboard() {
  const { data } = useDroneData();

  const gauges = [
    { label: 'Smoke Index',        value: data.smoke_index ?? 0,        gradId: 'smokeGrad' },
    { label: 'VOC Index',          value: data.voc_index ?? 0,          gradId: 'vocGrad' },
    { label: 'Air Quality Index',  value: data.air_quality_index ?? 0,  gradId: 'aqiGrad' },
    { label: 'Hazard Level',       value: data.hazard_level ?? 0,       gradId: 'hazardGrad' },
    { label: 'Pollution Score',    value: data.pollution_score ?? 0,    gradId: 'pollutionGrad' },
  ];

  return (
    <motion.div
      className="glass card-sensor p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h3 className="section-title mb-5">
        <Activity size={14} />
        Gas Concentration Overview
      </h3>

      <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-8">
        {gauges.map((g, i) => (
          <ConcentrationGauge key={g.gradId} {...g} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

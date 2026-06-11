import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Loader2 } from 'lucide-react';
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
  if (pct < 33) return '#10b981';
  if (pct < 66) return '#f59e0b';
  return '#ef4444';
}

/* ── circular gauge component ─────────────────────────── */

function ConcentrationGauge({ value, label, gradId, index = 0 }) {
  const isNA   = value === null || value === undefined;
  const size   = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct    = isNA ? 0 : Math.min(Math.max(value, 0), 100);
  const offset = circumference - (pct / 100) * circumference;
  const colors = isNA ? { start: '#64748b', end: '#94a3b8' } : gaugeColors(pct);

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
          style={{ opacity: isNA ? 0.25 : 1 }}
        />

        {/* center value or N/A */}
        <text x="50%" y="44%" textAnchor="middle" dominantBaseline="central"
          className="fill-slate-800 dark:fill-white font-bold"
          style={{ fontSize: isNA ? '1rem' : '1.35rem', fill: isNA ? '#94a3b8' : undefined }}>
          {isNA ? 'N/A' : Math.round(pct)}
        </text>
        {/* tiny status word */}
        {!isNA && (
          <text x="50%" y="64%" textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: '0.5rem', fill: statusTextColor(pct), fontWeight: 600 }}>
            {statusLabel(pct)}
          </text>
        )}
        {isNA && (
          <text x="50%" y="66%" textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: '0.45rem', fill: '#94a3b8', fontWeight: 500 }}>
            Awaiting data
          </text>
        )}
      </svg>

      {/* label */}
      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center leading-tight max-w-[90px]">
        {label}
      </span>
    </motion.div>
  );
}

/* ── client-side fallback metric computation ─────────────
   Used when backend-derived fields are null (e.g. before
   first sensor_update socket event, or on older API).     */

function computeMetrics({ mq2, mq5, mq9, mq135, eqs, prediction }) {
  const hasRaw = mq2 != null && mq5 != null && mq9 != null && mq135 != null;

  if (!hasRaw) return { smoke_index: null, voc_index: null, hazard_level: null, pollution_score: null };

  // Mirror the backend aqi_service formulas:
  const smoke      = Math.min(100, mq2 * 0.6 + mq9 * 0.4);
  const voc        = Math.min(100, mq135 * 0.75 + mq5 * 0.25);
  const baseHazard = Math.min(100, mq2 * 0.30 + mq5 * 0.20 + mq9 * 0.20 + mq135 * 0.30);

  // Gas-type severity bonus (same logic as app.py)
  let gasBonus = 0;
  if (prediction) {
    const gas  = (prediction.predicted_gas || prediction || '').toString().toLowerCase();
    const conf = typeof prediction === 'object' ? (prediction.confidence || 0) : 0;
    if (['smoke', 'lpg', 'carbon', ' co'].some(k => gas.includes(k)))      gasBonus = 40;
    else if (['alcohol', 'perfume', 'mixed'].some(k => gas.includes(k))) gasBonus = 20;
    const hazard = Math.min(100, baseHazard * 0.6 + (conf / 100) * gasBonus);
    return {
      smoke_index:    Math.round(smoke * 100) / 100,
      voc_index:      Math.round(voc   * 100) / 100,
      hazard_level:   Math.round(hazard * 100) / 100,
      pollution_score: eqs != null ? Math.round(Math.max(0, 100 - eqs) * 100) / 100 : null,
    };
  }

  return {
    smoke_index:    Math.round(smoke * 100) / 100,
    voc_index:      Math.round(voc   * 100) / 100,
    hazard_level:   Math.round(baseHazard * 100) / 100,
    pollution_score: eqs != null ? Math.round(Math.max(0, 100 - eqs) * 100) / 100 : null,
  };
}

/* ══════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                       */
/* ══════════════════════════════════════════════════════ */

export default function GasConcentrationDashboard() {
  const { data, esp32ConnectionState } = useDroneData();

  const {
    mq2, mq5, mq9, mq135, eqs,
    smoke_index: rawSmoke,
    voc_index: rawVoc,
    air_quality_index: rawAqi,
    hazard_level: rawHazard,
    pollution_score: rawPollution,
    predicted_gas, confidence,
  } = data;

  // ── Diagnostic log (visible in DevTools → Console) ──
  console.log('[Gas Dashboard Input]', {
    mq2,       // normalized 0-100 from sensor
    mq5,       // normalized 0-100
    mq9,       // normalized 0-100
    mq135,     // normalized 0-100
    eqs,       // Environmental Quality Score from backend
    prediction: { predicted_gas, confidence },
    // Backend-derived (should be non-null once socket or /api/latest arrives):
    smoke_index:      rawSmoke,
    voc_index:        rawVoc,
    air_quality_index: rawAqi,
    hazard_level:     rawHazard,
    pollution_score:  rawPollution,
  });

  // Client-side fallback: compute from raw normalized values if backend hasn't sent
  // the derived indices yet (null values). Mirrors backend aqi_service formulas.
  const fallback = useMemo(() => computeMetrics({
    mq2, mq5, mq9, mq135, eqs,
    prediction: { predicted_gas, confidence },
  }), [mq2, mq5, mq9, mq135, eqs, predicted_gas, confidence]);

  const smoke     = rawSmoke     ?? fallback.smoke_index;
  const voc       = rawVoc       ?? fallback.voc_index;
  const aqi       = rawAqi       ?? eqs;          // eqs is the direct AQI source
  const hazard    = rawHazard    ?? fallback.hazard_level;
  const pollution = rawPollution ?? fallback.pollution_score;

  const gauges = [
    { label: 'Smoke Index',       value: smoke,    gradId: 'smokeGrad' },
    { label: 'VOC Index',         value: voc,      gradId: 'vocGrad' },
    { label: 'Air Quality Index', value: aqi,      gradId: 'aqiGrad' },
    { label: 'Hazard Level',      value: hazard,   gradId: 'hazardGrad' },
    { label: 'Pollution Score',   value: pollution, gradId: 'pollutionGrad' },
  ];

  const isLoading = esp32ConnectionState === 'Offline' && gauges.every(g => g.value === null);

  return (
    <motion.div
      className="glass card-sensor p-4 lg:p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="section-title mb-0">
          <Activity size={14} />
          Gas Concentration Overview
        </h3>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex items-center gap-1">
          {isLoading ? (
            <><Loader2 size={10} className="animate-spin" /> Awaiting Telemetry</>
          ) : (
            'Live Stream'
          )}
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        {gauges.map((g, i) => (
          <ConcentrationGauge key={g.gradId} {...g} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, Gauge } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';

/* ── animated number ──────────────────────────────────── */

function AnimatedValue({ value, decimals = 1 }) {
  return (
    <motion.span
      key={Math.round(value * 10)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {Number(value).toFixed(decimals)}
    </motion.span>
  );
}

/* ── mini circular gauge with gradient arc ────────────── */

function MiniGauge({ value, max, size = 80, strokeWidth = 6, unit, label, icon: Icon, gradId }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const offset = circumference - (pct / 100) * circumference;

  // colour stops based on percentage
  const startColor = pct < 33 ? '#10b981' : pct < 66 ? '#f59e0b' : '#ef4444';
  const endColor   = pct < 33 ? '#06b6d4' : pct < 66 ? '#fb923c' : '#f87171';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="drop-shadow">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
        {/* background track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700/60"
        />
        {/* value arc */}
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
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="central"
          className="fill-slate-800 dark:fill-white font-bold" style={{ fontSize: '0.85rem' }}>
          <AnimatedValue value={value} />
        </text>
        <text x="50%" y="65%" textAnchor="middle" dominantBaseline="central"
          className="fill-slate-400" style={{ fontSize: '0.5rem' }}>
          {unit}
        </text>
      </svg>
      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
        {Icon && <Icon size={12} className="text-primary-400" />}
        <span>{label}</span>
      </div>
    </div>
  );
}

/* ── sensor card wrapper ──────────────────────────────── */

function SensorCard({ title, children, delay = 0 }) {
  return (
    <motion.div
      className="glass card-sensor p-5 flex-1 min-w-[220px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h4 className="section-title mb-0">{title}</h4>
        <div className="bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
          <span className="text-[9px] uppercase tracking-wider text-blue-600 font-bold">LIVE DATA</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5">
        {children}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                       */
/* ══════════════════════════════════════════════════════ */

export default function EnvironmentalSensors() {
  const { data } = useDroneData();

  return (
    <div className="flex flex-col sm:flex-row gap-5">
      {/* ── DHT11 Card ── */}
      <SensorCard title="DHT11 Sensor" delay={0}>
        <MiniGauge
          value={data.dht_temp ?? 0}
          max={60}
          size={80}
          unit="°C"
          label="Temperature"
          icon={Thermometer}
          gradId="dhtTempGrad"
        />
        <MiniGauge
          value={data.dht_humidity ?? 0}
          max={100}
          size={80}
          unit="%"
          label="Humidity"
          icon={Droplets}
          gradId="dhtHumGrad"
        />
      </SensorCard>

      {/* ── BME280 Card ── */}
      <SensorCard title="BME280 Sensor" delay={0.1}>
        <MiniGauge
          value={data.bme_temp ?? 0}
          max={60}
          size={80}
          unit="°C"
          label="Temperature"
          icon={Thermometer}
          gradId="bmeTempGrad"
        />
        <MiniGauge
          value={data.bme_humidity ?? 0}
          max={100}
          size={80}
          unit="%"
          label="Humidity"
          icon={Droplets}
          gradId="bmeHumGrad"
        />
        <MiniGauge
          value={data.pressure ?? 950}
          max={1100}
          size={80}
          unit="hPa"
          label="Pressure"
          icon={Gauge}
          gradId="bmePressGrad"
        />
      </SensorCard>
    </div>
  );
}

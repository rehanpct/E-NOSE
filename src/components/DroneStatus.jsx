import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Wifi, WifiOff, Shield, ShieldAlert, Battery, BatteryCharging,
  Satellite, Signal, Clock, Navigation, MapPin, Crosshair, Zap,
  Activity, ChevronRight
} from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';
import { formatTime } from '../utils/exportUtils';

/* ── tiny reusable pieces ─────────────────────────────── */

function Badge({ label, active, colorOn = 'bg-emerald-500/15 text-emerald-600',
  colorOff = 'bg-red-500/15 text-red-500' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide
      ${active ? colorOn : colorOff}`}>
      {label}
    </span>
  );
}

function StatRow({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Icon size={14} className="text-primary-400" />
        <span>{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold text-slate-800 dark:text-white">{value}</span>
        {sub && <span className="ml-1 text-[10px] text-slate-400">{sub}</span>}
      </div>
    </div>
  );
}

/* ── circular SVG gauge ───────────────────────────────── */

function CircularGauge({ value = 0, size = 120, strokeWidth = 8, label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (pct / 100) * circumference;

  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="drop-shadow-lg">
        <defs>
          <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {/* track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        {/* value arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#healthGrad)" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="gauge-ring"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* center text */}
        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central"
          className="fill-slate-800 dark:fill-white text-2xl font-bold" style={{ fontSize: '1.6rem' }}>
          {Math.round(pct)}
        </text>
        <text x="50%" y="66%" textAnchor="middle" dominantBaseline="central"
          className="fill-slate-400 text-[10px] uppercase tracking-widest" style={{ fontSize: '0.55rem' }}>
          {label ?? 'Health'}
        </text>
      </svg>
    </div>
  );
}

/* ── battery bar ──────────────────────────────────────── */

function BatteryBar({ pct }) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const color = clamped > 50 ? '#10b981' : clamped > 20 ? '#f59e0b' : '#ef4444';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Battery size={14} className="text-primary-400" />
          <span>Battery</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>{Math.round(clamped)}%</span>
      </div>
      <div className="progress-bar">
        <motion.div
          className="progress-bar-fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/* ── signal bar ───────────────────────────────────────── */

function SignalBar({ strength }) {
  const bars = 5;
  const filled = Math.round((strength / 100) * bars);
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Signal size={14} className="text-primary-400" />
        <span>Signal</span>
      </div>
      <div className="flex items-end gap-0.5 h-4">
        {Array.from({ length: bars }).map((_, i) => (
          <motion.div
            key={i}
            className="rounded-sm"
            style={{
              width: 4,
              height: `${((i + 1) / bars) * 100}%`,
              background: i < filled
                ? (filled >= 4 ? '#10b981' : filled >= 2 ? '#f59e0b' : '#ef4444')
                : 'rgba(148,163,184,0.25)',
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          />
        ))}
        <span className="ml-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
          {Math.round(strength)}%
        </span>
      </div>
    </div>
  );
}

/* ── mission progress ─────────────────────────────────── */

function MissionProgress({ progress, current, total }) {
  const pct = Math.min(Math.max(progress ?? 0, 0), 100);
  return (
    <div className="w-full mt-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Navigation size={14} className="text-primary-400" />
          <span>Mission</span>
        </div>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          WP {current ?? '-'}/{total ?? '-'}
        </span>
      </div>
      <div className="progress-bar">
        <motion.div
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <p className="text-right text-[10px] mt-0.5 text-slate-400">{pct.toFixed(1)}% complete</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                       */
/* ══════════════════════════════════════════════════════ */

export default function DroneStatus() {
  const { data, isConnected } = useDroneData();

  const isOnline = data.drone_status === 'Active' || data.drone_status === 'active';
  const armed = !!data.armed;

  return (
    <motion.div
      className="glass card-sensor flex flex-col gap-4"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* ── header ── */}
      <div className="flex items-center justify-between">
        <h3 className="section-title mb-0">Drone Status</h3>

        <div className="flex items-center gap-2">
          {/* Online / Offline dot */}
          <span className={`status-dot ${isOnline ? 'status-online' : 'status-offline'}`} />
          <span className={`text-xs font-semibold ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* ── badges row ── */}
      <div className="flex flex-wrap gap-2">
        <Badge
          label={data.flight_mode ?? 'Unknown'}
          active
          colorOn="bg-primary-500/15 text-primary-600"
        />
        <Badge label={armed ? 'ARMED' : 'DISARMED'} active={armed}
          colorOn="bg-red-500/15 text-red-500"
          colorOff="bg-slate-300/20 text-slate-500"
        />
      </div>

      {/* ── Health gauge (centered) ── */}
      <div className="flex justify-center py-2">
        <CircularGauge value={data.health ?? 0} size={120} strokeWidth={10} label="Health" />
      </div>

      {/* ── battery ── */}
      <BatteryBar pct={data.battery ?? 0} />

      {/* ── stats grid ── */}
      <div className="flex flex-col divide-y divide-slate-200/50 dark:divide-slate-700/50">
        <StatRow icon={Zap} label="Voltage" value={`${(data.battery_voltage ?? 0).toFixed(1)} V`} />
        <StatRow icon={Crosshair} label="GPS Lock"
          value={data.gps_lock ? '3D Fix' : 'No Fix'}
          sub={data.gps_lock ? '✓' : '✗'}
        />
        <StatRow icon={Satellite} label="Satellites" value={data.satellites ?? 0} />
        <SignalBar strength={data.signal_strength ?? 0} />
        <StatRow icon={Clock} label="Flight Time"
          value={formatTime(data.flight_time ?? 0)}
        />
      </div>

      {/* ── mission progress ── */}
      <MissionProgress
        progress={data.mission_progress}
        current={data.waypoint_current}
        total={data.waypoint_total}
      />
    </motion.div>
  );
}

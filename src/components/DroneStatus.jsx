import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Wifi, WifiOff, Shield, ShieldAlert, Battery, BatteryCharging,
  Satellite, Signal, Clock, Navigation, MapPin, Crosshair, Zap,
  Activity
} from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';
import { formatTime } from '../utils/exportUtils';

function Badge({ label, active, colorOn = 'bg-emerald-500/15 text-emerald-600', colorOff = 'bg-red-500/15 text-red-500' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold tracking-wide ${active ? colorOn : colorOff}`}>
      {label}
    </span>
  );
}

function CircularGauge({ value = 0, size = 76, strokeWidth = 6, label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (pct / 100) * circumference;

  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="drop-shadow-sm">
        <defs>
          <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700/60"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#healthGrad)" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="gauge-ring"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central"
          className="fill-slate-800 dark:fill-white font-black" style={{ fontSize: '1.1rem' }}>
          {Math.round(pct)}
        </text>
        <text x="50%" y="68%" textAnchor="middle" dominantBaseline="central"
          className="fill-slate-400 text-[8px] uppercase tracking-widest font-bold" style={{ fontSize: '0.45rem' }}>
          {label ?? 'Health'}
        </text>
      </svg>
    </div>
  );
}

function BatteryBar({ pct }) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const color = clamped > 50 ? '#10b981' : clamped > 20 ? '#f59e0b' : '#ef4444';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Battery size={12} className="text-primary-500" />
          <span>Battery</span>
        </div>
        <span className="text-[10px] font-bold" style={{ color }}>{Math.round(clamped)}%</span>
      </div>
      <div className="progress-bar" style={{ height: '4px' }}>
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

function MissionProgress({ progress, current, total }) {
  const pct = Math.min(Math.max(progress ?? 0, 0), 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1 text-[9px] text-slate-400">
          <Navigation size={11} className="text-primary-400" />
          <span>Mission Progress</span>
        </div>
        <span className="text-[9px] font-bold text-slate-500">
          WP {current ?? '-'}/{total ?? '-'} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="progress-bar" style={{ height: '3px' }}>
        <motion.div
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function DroneStatus() {
  const { data } = useDroneData();

  const isOnline = data.drone_status === 'Active' || data.drone_status === 'active';
  const hasTelemetry = data.battery != null || data.latitude != null;
  const armed = !!data.armed;

  if (!hasTelemetry) {
    return (
      <motion.div
        className="glass card-sensor flex flex-col justify-between h-full"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ maxHeight: '300px', minHeight: '150px' }}
      >
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="section-title mb-0">Drone Status</h3>
          <div className="flex items-center gap-1.5">
            <span className="status-dot status-offline" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">No Data</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500 italic text-[11px]">
          <WifiOff size={18} className="mb-1.5 animate-pulse text-slate-300 dark:text-slate-600" />
          <span>No telemetry available</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="glass card-sensor flex flex-col gap-2.5 h-full justify-between"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ maxHeight: '300px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
        <h3 className="section-title mb-0">Drone Status</h3>
        <div className="flex items-center gap-2">
          <span className={`status-dot ${isOnline ? 'status-online' : 'status-offline'}`} />
          <span className={`text-[10px] font-bold uppercase ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
            {isOnline ? 'Online' : 'Standby'}
          </span>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-12 gap-2.5 items-center flex-1">
        {/* Left Column: Health gauge & Badges */}
        <div className="col-span-5 flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800/80 pr-2.5">
          <CircularGauge value={data.health ?? 0} size={70} strokeWidth={5} label="Health" />
          <div className="flex flex-col gap-1 mt-2 w-full items-center">
            <Badge
              label={data.flight_mode ?? 'Unknown'}
              active
              colorOn="bg-sky-500/10 text-sky-500 border border-sky-500/20"
            />
            <Badge 
              label={armed ? 'ARMED' : 'DISARMED'} 
              active={armed}
              colorOn="bg-red-500/10 text-red-500 border border-red-500/20"
              colorOff="bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
            />
          </div>
        </div>

        {/* Right Column: Battery & details */}
        <div className="col-span-7 flex flex-col justify-between h-full py-0.5">
          {/* Battery */}
          <BatteryBar pct={data.battery ?? 0} />
          
          {/* Status checklist */}
          <div className="flex flex-col gap-1.5 mt-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1">
                <Satellite size={11} className="text-slate-400" />
                Sats
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-mono">
                {data.satellites ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1">
                <Zap size={11} className="text-slate-400" />
                Voltage
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-mono">
                {(data.battery_voltage ?? 0).toFixed(1)} V
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={11} className="text-slate-400" />
                Flight
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-mono">
                {formatTime(data.flight_time ?? 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1">
                <Crosshair size={11} className="text-slate-400" />
                GPS Lock
              </span>
              <span className={`px-1 rounded-[4px] text-[8px] font-black uppercase ${data.gps_lock ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {data.gps_lock ? '3D Fix' : 'No Lock'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mission progress */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2">
        <MissionProgress
          progress={data.mission_progress}
          current={data.waypoint_current}
          total={data.waypoint_total}
        />
      </div>
    </motion.div>
  );
}

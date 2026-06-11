import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import { AlertTriangle, ShieldCheck, Wind } from 'lucide-react';

export default function HeroPredictionCard() {
  const { data } = useDroneData();

  const gas = data.predicted_gas || 'Unknown';
  const confidence = typeof data.confidence === 'number' ? data.confidence : 0;
  const distribution = data.distribution || {};

  const topPredictions = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  let riskLevel = 'LOW';
  let actionMessage = 'Normal operations. Area safe.';
  let glowColor = 'rgba(16, 185, 129, 0.15)';
  let borderColor = 'rgba(16, 185, 129, 0.35)';
  let riskCls = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  let gaugeCls = '#10b981';
  let Icon = ShieldCheck;

  if (gas === 'Smoke' || gas === 'LPG' || gas === 'Carbon_Monoxide') {
    riskLevel = 'HIGH';
    actionMessage = 'Ventilate area immediately. Evacuate personnel.';
    glowColor = 'rgba(239, 68, 68, 0.2)';
    borderColor = 'rgba(239, 68, 68, 0.5)';
    riskCls = 'bg-red-500/10 text-red-500 border-red-500/25';
    gaugeCls = '#ef4444';
    Icon = AlertTriangle;
  } else if (gas === 'Alcohol' || gas === 'Perfume') {
    riskLevel = 'MODERATE';
    actionMessage = 'Monitor area closely. Locate gas source.';
    glowColor = 'rgba(245, 158, 11, 0.15)';
    borderColor = 'rgba(245, 158, 11, 0.4)';
    riskCls = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    gaugeCls = '#f59e0b';
    Icon = Wind;
  }

  const pulseVariant = {
    initial: { boxShadow: `0 0 4px ${glowColor}` },
    animate: {
      boxShadow: [`0 0 4px ${glowColor}`, `0 0 20px ${glowColor}`, `0 0 4px ${glowColor}`],
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  // SVG gauge
  const GAUGE_SIZE = 80;
  const STROKE = 6;
  const R = (GAUGE_SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC - (confidence / 100) * CIRC;

  return (
    <motion.div
      variants={pulseVariant}
      initial="initial"
      animate="animate"
      className="glass-strong flex flex-col h-full"
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: '10px',
        minHeight: '120px',
        padding: '12px 14px',
      }}
    >
      {/* ── Top status strip ── */}
      <div className="flex justify-between items-center mb-2">
        <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          AI Prediction Engine
        </span>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded border font-black text-[9px] uppercase tracking-widest ${riskCls}`}>
          <Icon size={9} />
          {riskLevel} RISK
        </div>
      </div>

      {/* ── Main content: 3-column grid ── */}
      <div className="flex flex-1 gap-3 items-center min-h-0">

        {/* LEFT — Gas headline + action (flex-1) */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Detected Gas</p>
          <AnimatePresence mode="popLayout">
            <motion.h1
              key={gas}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.35 }}
              className="font-black leading-none tracking-tight text-slate-900 dark:text-slate-50 truncate"
              style={{ fontSize: 'clamp(28px, 3.5vw, 54px)', letterSpacing: '-0.02em' }}
            >
              {gas.replace(/_/g, ' ')}
            </motion.h1>
          </AnimatePresence>
          <p className="mt-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-snug">
            {actionMessage}
          </p>
        </div>

        {/* CENTER — Large confidence gauge */}
        <div className="flex flex-col items-center flex-shrink-0 gap-0.5">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Confidence</p>
          <div className="relative flex items-center justify-center" style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}>
            <svg width={GAUGE_SIZE} height={GAUGE_SIZE} style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={R}
                fill="none" stroke="currentColor" strokeWidth={STROKE}
                className="text-slate-200 dark:text-slate-700/60"
              />
              <motion.circle
                cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={R}
                fill="none" stroke={gaugeCls} strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: CIRC }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-slate-800 dark:text-white leading-none">
                {confidence.toFixed(1)}%
              </span>
              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                Conf
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT — Probability list */}
        <div className="flex flex-col justify-center gap-1 pl-3 border-l border-slate-200 dark:border-slate-700/60 flex-shrink-0 min-w-[100px]">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Top Probabilities</p>
          <div className="flex flex-col gap-1.5">
            {topPredictions.length > 0 ? (
              topPredictions.map(([cls, prob], idx) => (
                <div key={cls} className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-[9px] font-bold">
                    <span className="text-slate-700 dark:text-slate-300 truncate pr-1">{cls.replace(/_/g, ' ')}</span>
                    <span className="text-slate-500 font-mono tabular-nums">{prob.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-1">
                    <motion.div
                      className="h-1 rounded-full"
                      style={{ background: gaugeCls }}
                      initial={{ width: 0 }}
                      animate={{ width: `${prob}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.06 }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <span className="text-[9px] text-slate-400 italic">Waiting for data…</span>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

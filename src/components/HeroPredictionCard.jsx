import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import { AlertTriangle, ShieldCheck, Wind } from 'lucide-react';

export default function HeroPredictionCard() {
  const { data } = useDroneData();

  // Extract variables
  const gas = data.predicted_gas || "Unknown";
  const confidence = data.confidence || 0;
  const distribution = data.distribution || {};

  // Sort distribution by confidence to get top 3
  const topPredictions = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Determine risk level based on gas type
  let riskLevel = "LOW";
  let actionMessage = "Normal operations. Area safe.";
  let glowColor = "rgba(16, 185, 129, 0.2)";
  let borderColor = "rgba(16, 185, 129, 0.5)";
  let Icon = ShieldCheck;

  if (gas === "Smoke" || gas === "LPG" || gas === "Carbon_Monoxide") {
    riskLevel = "HIGH";
    actionMessage = "Ventilate area immediately. Evacuate personnel.";
    glowColor = "rgba(239, 68, 68, 0.3)";
    borderColor = "rgba(239, 68, 68, 0.6)";
    Icon = AlertTriangle;
  } else if (gas === "Alcohol" || gas === "Perfume") {
    riskLevel = "MODERATE";
    actionMessage = "Monitor area. Source identification recommended.";
    glowColor = "rgba(245, 158, 11, 0.2)";
    borderColor = "rgba(245, 158, 11, 0.5)";
    Icon = Wind;
  }

  // Animation variants
  const pulseVariant = {
    initial: { boxShadow: `0 0 0px ${glowColor}` },
    animate: {
      boxShadow: [`0 0 10px ${glowColor}`, `0 0 30px ${glowColor}`, `0 0 10px ${glowColor}`],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
  };

  return (
    <motion.div
      variants={pulseVariant}
      initial="initial"
      animate="animate"
      className="glass-strong card-sensor mb-4"
      style={{
        border: `1px solid ${borderColor}`,
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="bg-blue-500/10 dark:bg-blue-900/30 px-3 py-1 rounded-sm border border-blue-500/20">
          <span className="text-[10px] uppercase tracking-widest text-blue-700 dark:text-blue-400 font-bold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            AI INFERENCE STATUS
          </span>
        </div>
        
        <div className={`px-3 py-1 rounded-sm flex items-center gap-1.5 font-bold text-xs ${
          riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20' :
          riskLevel === 'MODERATE' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20' :
          'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
        }`}>
          <Icon size={14} />
          {riskLevel} RISK
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
        
        {/* Main Prediction */}
        <div className="lg:col-span-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-1">Detected Class</h2>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={gas}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-4xl lg:text-5xl font-black tracking-tight"
                style={{
                  background: gas === 'Clean_Air' ? 'linear-gradient(135deg, #10b981, #059669)' :
                             riskLevel === 'HIGH' ? 'linear-gradient(135deg, #ef4444, #b91c1c)' :
                             'linear-gradient(135deg, #f59e0b, #d97706)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {gas.replace('_', ' ')}
              </motion.div>
            </AnimatePresence>
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Action</span>
              {actionMessage}
            </p>
          </div>

          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                className="text-slate-200 dark:text-slate-700"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <motion.path
                className="text-blue-500"
                strokeWidth="4"
                strokeDasharray={`${confidence}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${confidence}, 100` }}
                transition={{ duration: 1, ease: "easeOut" }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{confidence}%</span>
            </div>
          </div>
        </div>

        {/* Top 3 Predictions */}
        <div className="lg:col-span-1 flex flex-col justify-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 h-full">
          <h3 className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3">Probability Distribution</h3>
          <div className="space-y-3">
            {topPredictions.length > 0 ? topPredictions.map(([className, prob], index) => (
              <div key={className} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300 truncate pr-2">{className.replace('_', ' ')}</span>
                  <span className="text-slate-600 dark:text-slate-400">{prob.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                  <motion.div
                    className="h-1 rounded-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${prob}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  />
                </div>
              </div>
            )) : (
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">Awaiting telemetry...</div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

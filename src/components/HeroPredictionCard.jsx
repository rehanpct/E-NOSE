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
      className="glass-strong card-sensor mb-6"
      style={{
        border: `1.5px solid ${borderColor}`,
        background: `linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)`,
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            LIVE AI INFERENCE
          </span>
        </div>
        
        <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 font-bold text-sm ${
          riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
          riskLevel === 'MODERATE' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
          'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
        }`}>
          <Icon size={16} />
          RISK: {riskLevel}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Prediction */}
        <div className="lg:col-span-2 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Detected Gas</h2>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={gas}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-5xl lg:text-7xl font-black text-slate-800 tracking-tight"
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
            <p className="mt-4 font-medium text-slate-600">
              <span className="text-slate-400">Action:</span> {actionMessage}
            </p>
          </div>

          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                className="text-slate-200 dark:text-slate-700"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <motion.path
                className="text-blue-500"
                strokeWidth="3"
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
              <span className="text-2xl font-bold text-slate-700">{confidence}%</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Confidence</span>
            </div>
          </div>
        </div>

        {/* Top 3 Predictions */}
        <div className="border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-center">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Top 3 Predictions</h3>
          <div className="space-y-4">
            {topPredictions.length > 0 ? topPredictions.map(([className, prob], index) => (
              <div key={className} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-700">{className.replace('_', ' ')}</span>
                  <span className="text-slate-500">{prob.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <motion.div
                    className="h-1.5 rounded-full bg-blue-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${prob}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  />
                </div>
              </div>
            )) : (
              <div className="text-sm text-slate-400 font-medium">Waiting for inference data...</div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';

export default function AQIPanel() {
  const { data } = useDroneData();
  const eqs = data.eqs ?? 100;

  let category = "Excellent";
  let colorClass = "text-emerald-500";
  let bgClass = "bg-emerald-500/10";
  let Icon = CheckCircle;

  if (eqs >= 90) {
    category = "Excellent";
    colorClass = "text-emerald-500";
    bgClass = "bg-emerald-500/10";
    Icon = CheckCircle;
  } else if (eqs >= 75) {
    category = "Good";
    colorClass = "text-blue-500";
    bgClass = "bg-blue-500/10";
    Icon = Leaf;
  } else if (eqs >= 50) {
    category = "Moderate";
    colorClass = "text-amber-500";
    bgClass = "bg-amber-500/10";
    Icon = AlertTriangle;
  } else if (eqs >= 25) {
    category = "Poor";
    colorClass = "text-orange-500";
    bgClass = "bg-orange-500/10";
    Icon = ShieldAlert;
  } else {
    category = "Hazardous";
    colorClass = "text-red-500";
    bgClass = "bg-red-500/10";
    Icon = ShieldAlert;
  }

  return (
    <motion.div
      className="glass card-sensor p-5 flex flex-col justify-center items-center text-center h-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-center w-full mb-4">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Environmental Quality Score</h4>
        <div className="bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
          <span className="text-[9px] uppercase tracking-wider text-blue-600 font-bold">LIVE DATA</span>
        </div>
      </div>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${bgClass} mb-3 shadow-inner`}>
        <span className={`text-4xl font-extrabold ${colorClass}`}>
          {Math.round(eqs)}
        </span>
      </div>
      
      <div className="flex items-center gap-2 mb-1">
        <Icon className={colorClass} size={18} />
        <span className={`font-semibold text-lg ${colorClass}`}>{category}</span>
      </div>
      
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[80%] mt-2">
        Based on real-time gas concentrations, temperature, and humidity.
      </p>
    </motion.div>
  );
}

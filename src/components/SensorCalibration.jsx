import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';

function CalibrationItem({ name, status }) {
  const isReady = status === 'Ready';
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700/50 last:border-0">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{name}</span>
      <div className="flex items-center gap-1.5">
        {isReady ? (
          <CheckCircle2 size={16} className="text-emerald-500" />
        ) : (
          <AlertCircle size={16} className="text-fuchsia-500" />
        )}
        <span className={`text-xs font-semibold ${isReady ? 'text-emerald-600' : 'text-fuchsia-600'}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

export default function SensorCalibration() {
  const { esp32Connected, missionStartTime } = useDroneData();
  const [warmupProgress, setWarmupProgress] = useState(100);
  const [status, setStatus] = useState('Offline');

  useEffect(() => {
    const timer = setInterval(() => {
      if (!esp32Connected) {
        setStatus('Offline');
        setWarmupProgress(0);
        return;
      }
      if (missionStartTime) {
        const now = new Date();
        const diff = Math.floor((now - missionStartTime) / 1000);
        const warmupTime = 180; // 3 minutes for demo
        
        if (diff < warmupTime) {
          setStatus('Warming Up');
          setWarmupProgress(Math.min(100, Math.floor((diff / warmupTime) * 100)));
        } else {
          setStatus('Calibrated');
          setWarmupProgress(100);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [esp32Connected, missionStartTime]);

  const isCalibrated = status === 'Calibrated';

  return (
    <motion.div
      className="glass card-sensor p-5 flex flex-col gap-4"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title mb-0">Sensor Calibration</h3>
        <Settings2 className="text-primary-500" size={18} />
      </div>

      <div className="flex flex-col">
        <CalibrationItem name="MQ-2 (Combustible)" status={status} />
        <CalibrationItem name="MQ-5 (LPG/Natural Gas)" status={status} />
        <CalibrationItem name="MQ-9 (Carbon Monoxide)" status={status} />
        <CalibrationItem name="MQ-135 (Air Quality)" status={status} />
      </div>

      <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">Warm-up Status</span>
          <span className={`text-xs font-semibold ${isCalibrated ? 'text-emerald-500' : 'text-amber-500'}`}>
            {isCalibrated ? 'Complete' : `${warmupProgress}%`}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
          <div className={`${isCalibrated ? 'bg-emerald-500' : 'bg-amber-500'} h-1.5 rounded-full transition-all duration-1000`} style={{ width: `${warmupProgress}%` }}></div>
        </div>
      </div>
    </motion.div>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Wind, Droplets, Thermometer, ToggleLeft, ToggleRight, Radio } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';

function Sparkline({ data, color = "#0ea5e9" }) {
  if (!data || data.length < 2) {
    return (
      <div className="text-[10px] text-slate-400 dark:text-slate-500 italic">
        Awaiting trend...
      </div>
    );
  }
  const width = 80;
  const height = 18;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible opacity-80">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function getStatusBadge(value, thresholds) {
  if (value === null || value === undefined || value === 0) {
    return { label: 'NO DATA', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500' };
  }
  if (value >= thresholds.critical) {
    return { label: 'CRITICAL', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' };
  }
  if (value >= thresholds.high) {
    return { label: 'HIGH', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' };
  }
  return { label: 'NORMAL', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' };
}

const THRESHOLDS = {
  mq2:     { high: 200,  critical: 500  },
  mq5:     { high: 200,  critical: 500  },
  mq9:     { high: 100,  critical: 300  },
  mq135:   { high: 100,  critical: 300  },
  temp:    { high: 35,   critical: 45   },
  humidity:{ high: 75,   critical: 90   },
};

function MiniSensorCard({ title, icon: Icon, value, unit, sparklineData, color, delay, thresholdKey }) {
  const badge = getStatusBadge(value, THRESHOLDS[thresholdKey]);
  return (
    <motion.div
      className="glass p-2.5 rounded-lg flex flex-col justify-between"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      style={{ minHeight: '90px' }}
    >
      {/* Top row: label + status badge */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Icon size={10} style={{ color }} />
          {title}
        </span>
        <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-0.5 mt-1">
        <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-none">
          {typeof value === 'number' ? value.toFixed(1) : '—'}
        </span>
        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
          {unit}
        </span>
      </div>

      {/* Sparkline */}
      <div className="flex justify-between items-center mt-1 border-t border-slate-100 dark:border-slate-800/80 pt-1">
        <span className="text-[8px] text-slate-400">Trend</span>
        <Sparkline data={sparklineData} color={color} />
      </div>
    </motion.div>
  );
}

export default function SensorCardGrid() {
  const { data, sensorHistory } = useDroneData();
  const [showNormalized, setShowNormalized] = useState(false);

  // Gas values
  const mq2_val = showNormalized ? (data.mq2 ?? 0) : (data.raw_mq2 ?? 0);
  const mq5_val = showNormalized ? (data.mq5 ?? 0) : (data.raw_mq5 ?? 0);
  const mq9_val = showNormalized ? (data.mq9 ?? 0) : (data.raw_mq9 ?? 0);
  const mq135_val = showNormalized ? (data.mq135 ?? 0) : (data.raw_mq135 ?? 0);

  // DHT11 values as default for Temperature and Humidity
  const temp_val = data.dht_temp ?? data.bme_temp ?? 0;
  const hum_val = data.dht_humidity ?? data.bme_humidity ?? 0;

  return (
    <div className="flex flex-col gap-2 mb-3">
      {/* Header / Toggle Row */}
      <div className="flex justify-between items-center mb-1">
        <h4 className="section-title mb-0 flex items-center gap-1.5">
          <Radio size={14} className="text-primary-500" />
          Unified Sensor Grid
        </h4>
        <button 
          onClick={() => setShowNormalized(!showNormalized)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {showNormalized ? <ToggleRight className="text-primary-500" size={16} /> : <ToggleLeft className="text-slate-400" size={16} />}
          <span>{showNormalized ? 'Normalized' : 'Raw Values'}</span>
        </button>
      </div>

      {/* Grid of 6 equal-sized cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <MiniSensorCard 
          title="MQ-2" icon={Flame} value={mq2_val} 
          unit={showNormalized ? '%' : 'ppm'} 
          sparklineData={sensorHistory?.mq2} color="#ef4444" delay={0} thresholdKey="mq2"
        />
        <MiniSensorCard 
          title="MQ-5" icon={Wind} value={mq5_val} 
          unit={showNormalized ? '%' : 'ppm'} 
          sparklineData={sensorHistory?.mq5} color="#f59e0b" delay={0.05} thresholdKey="mq5"
        />
        <MiniSensorCard 
          title="MQ-9" icon={Droplets} value={mq9_val} 
          unit={showNormalized ? '%' : 'ppm'} 
          sparklineData={sensorHistory?.mq9} color="#10b981" delay={0.1} thresholdKey="mq9"
        />
        <MiniSensorCard 
          title="MQ-135" icon={Radio} value={mq135_val} 
          unit={showNormalized ? '%' : 'ppm'} 
          sparklineData={sensorHistory?.mq135} color="#8b5cf6" delay={0.15} thresholdKey="mq135"
        />
        <MiniSensorCard 
          title="Temp" icon={Thermometer} value={temp_val} 
          unit="°C" 
          sparklineData={sensorHistory?.dht_temp} color="#ec4899" delay={0.2} thresholdKey="temp"
        />
        <MiniSensorCard 
          title="Humidity" icon={Wind} value={hum_val} 
          unit="%" 
          sparklineData={sensorHistory?.dht_humidity} color="#3b82f6" delay={0.25} thresholdKey="humidity"
        />
      </div>
    </div>
  );
}

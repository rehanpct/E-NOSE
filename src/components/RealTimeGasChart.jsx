import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Activity } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="glass p-3 text-xs"
      style={{ borderRadius: 10, minWidth: 140 }}
    >
      <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: entry.color }}
            />
            <span className="text-slate-500 dark:text-slate-400">{entry.name}</span>
          </span>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
            {Math.round(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RealTimeGasChart() {
  const { sensorHistory } = useDroneData();

  console.log("RealTimeGasChart render");

  const chartData = sensorHistory.timestamps.map((ts, i) => ({
    time: ts,
    'MQ-2': sensorHistory.mq2[i] ?? 0,
    'MQ-5': sensorHistory.mq5[i] ?? 0,
    'MQ-9': sensorHistory.mq9[i] ?? 0,
    'MQ-135': sensorHistory.mq135[i] ?? 0,
  }));

  const lineColors = {
    'MQ-2': '#ef4444',
    'MQ-5': '#f59e0b',
    'MQ-9': '#10b981',
    'MQ-135': '#8b5cf6',
  };

  const isEmpty = chartData.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass card-sensor h-full flex flex-col justify-between"
      style={{ borderRadius: '8px' }}
    >
      <div className="section-title">
        <Activity size={14} />
        Real-Time Gas Concentrations
      </div>
      <div className="mt-2" style={{ height: 190 }}>
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 italic text-xs">
            <Activity className="opacity-20 mb-1 animate-pulse" size={20} />
            <span>Waiting for sensor data</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.15)"
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border)' }}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
                iconType="circle"
                iconSize={6}
              />
              {Object.entries(lineColors).map(([name, color]) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0, fill: color }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-450 dark:text-slate-550">
        <span>Last 60 readings</span>
        <span>•</span>
        <span>Updated every 2s</span>
      </div>
    </motion.div>
  );
}

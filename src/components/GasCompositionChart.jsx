import React from 'react';
import { motion } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Activity } from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#64748b'];

export default function GasCompositionChart() {
  const { data } = useDroneData();
  const distribution = data.distribution || {};

  // Transform distribution object into array for Recharts
  const chartData = Object.entries(distribution)
    .map(([name, value]) => ({
      name: name.replace('_', ' '),
      value: value
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-2 px-3 text-xs shadow-lg" style={{ borderRadius: 8 }}>
          <p className="font-bold text-slate-700">{payload[0].name}</p>
          <p className="text-blue-600 font-mono">{payload[0].value.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass card-sensor h-full flex flex-col"
    >
      <div className="flex justify-between items-center mb-2">
        <div className="section-title mb-0">
          <Activity size={14} />
          Gas Composition Analysis
        </div>
        <div className="bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
          <span className="text-[9px] uppercase tracking-wider text-blue-600 font-bold">LIVE MODEL OUTPUT</span>
        </div>
      </div>
      
      <div className="flex-1 min-h-[220px] relative">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-medium">
            Waiting for distribution data...
          </div>
        )}
      </div>
    </motion.div>
  );
}

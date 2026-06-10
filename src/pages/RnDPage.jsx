import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Beaker, BarChart2, TrendingUp, GitMerge, FileText, Network } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import PredictionTester from '../components/PredictionTester';

const FEATURE_IMPORTANCE = [
  { name: 'MQ135', value: 38 },
  { name: 'MQ2', value: 25 },
  { name: 'MQ5', value: 18 },
  { name: 'MQ9', value: 12 },
  { name: 'Humidity', value: 4 },
  { name: 'Temp', value: 3 }
];

const CORRELATION_DATA = [
  { subject: 'MQ2', A: 120, fullMark: 150 },
  { subject: 'MQ5', A: 98, fullMark: 150 },
  { subject: 'MQ9', A: 86, fullMark: 150 },
  { subject: 'MQ135', A: 99, fullMark: 150 },
  { subject: 'Temp', A: 85, fullMark: 150 },
  { subject: 'Humidity', A: 65, fullMark: 150 },
];

export default function RnDPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? sidebarCollapsed ? 72 : 240 : 0 }}>
        <Header onToggleFullscreen={() => {}} isFullscreen={isFullscreen} />
        
        <main className="flex-1 p-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">R&D Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Research analytics, feature importance, and model comparisons.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Feature Importance */}
            <motion.div className="glass p-6 rounded-2xl" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}}>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <BarChart2 className="text-primary-500" /> Feature Importance (Random Forest)
              </h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={FEATURE_IMPORTANCE} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#94a3b8' }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8' }} width={80} />
                    <Tooltip cursor={{fill: 'rgba(148,163,184,0.1)'}} contentStyle={{borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Sensor Correlation */}
            <motion.div className="glass p-6 rounded-2xl" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.1}}>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Network className="text-primary-500" /> Sensor Activation Correlation
              </h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={CORRELATION_DATA}>
                    <PolarGrid stroke="rgba(148,163,184,0.2)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                    <Radar name="Cluster A (Smoke)" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Training History */}
            <motion.div className="glass p-6 rounded-2xl col-span-1 md:col-span-2" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}}>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <GitMerge className="text-primary-500" /> Model Version History
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Version</th>
                      <th className="py-3 px-4">Date Deploy</th>
                      <th className="py-3 px-4">Accuracy</th>
                      <th className="py-3 px-4">F1 Score</th>
                      <th className="py-3 px-4">Dataset Size</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">v2.1 (Active)</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">2026-06-09</td>
                      <td className="py-3 px-4 text-emerald-500 font-semibold">96.4%</td>
                      <td className="py-3 px-4 text-emerald-500 font-semibold">0.95</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">12,450</td>
                      <td className="py-3 px-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-md text-xs font-semibold">Production</span></td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">v2.0</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">2026-05-15</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">92.1%</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">0.91</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">8,200</td>
                      <td className="py-3 px-4"><span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-xs font-semibold">Archived</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

          </div>
          
          <div className="mt-6">
            <PredictionTester />
          </div>
        </main>
      </div>
    </div>
  );
}

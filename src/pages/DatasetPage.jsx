import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Database, Download, Trash2, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export default function DatasetPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/dataset/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  const totalSamples = stats?.quality?.total_db_samples || 0;
  
  const classData = stats?.quality?.class_distribution ? 
    Object.entries(stats.quality.class_distribution).map(([name, value]) => ({name, value})) : 
    [];
    
  const missingValues = stats?.quality?.missing_values || 0;
  const duplicateSamples = stats?.quality?.duplicate_samples || 0;
  const imbalanceRatio = stats?.quality?.imbalance_ratio || 0;

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? sidebarCollapsed ? 72 : 240 : 0 }}>
        <Header onToggleFullscreen={() => {}} isFullscreen={isFullscreen} />
        
        <main className="flex-1 p-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dataset Management</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage collected datasets, export to CSV/Excel, and view statistics.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
             <motion.div className="glass p-6 rounded-2xl" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mb-1 font-medium">Total Database Samples</p>
                 <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalSamples.toLocaleString()}</p>
             </motion.div>
             <motion.div className="glass p-6 rounded-2xl" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.1}}>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mb-1 font-medium">Dataset Growth Rate</p>
                 <p className="text-3xl font-bold text-emerald-500">+~30 / min</p>
             </motion.div>
             <motion.div className="glass p-6 rounded-2xl" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.2}}>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mb-1 font-medium">Estimated CSV Size</p>
                 <p className="text-3xl font-bold text-slate-800 dark:text-white">{(totalSamples * 125 / 1024).toFixed(1)} KB</p>
             </motion.div>
          </div>

          {(imbalanceRatio > 3 || missingValues > 0) && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex flex-col gap-1">
              <h4 className="font-semibold">Dataset Quality Warnings</h4>
              {imbalanceRatio > 3 && <p className="text-sm">• High class imbalance detected (Ratio: {imbalanceRatio}). Consider collecting more minority class samples.</p>}
              {missingValues > 0 && <p className="text-sm">• {missingValues} samples contain missing values.</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Charts */}
            <motion.div className="glass p-6 rounded-2xl" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.3}}>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <PieChartIcon className="text-primary-500" /> Class Distribution
              </h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={classData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {classData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.9)'}} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div className="glass p-6 rounded-2xl" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.4}}>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Database className="text-primary-500" /> Management Actions
              </h3>
              
              <div className="flex flex-col gap-4">
                <button className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Export as CSV</span>
                  <Download size={20} className="text-primary-500" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Export as Excel</span>
                  <Download size={20} className="text-emerald-500" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 transition-colors rounded-xl border border-red-500/20">
                  <span className="font-semibold text-red-600">Delete All Dataset Records</span>
                  <Trash2 size={20} className="text-red-500" />
                </button>
              </div>
            </motion.div>

          </div>
        </main>
      </div>
    </div>
  );
}

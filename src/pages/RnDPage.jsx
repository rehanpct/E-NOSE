import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Beaker, BarChart2, GitMerge } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import PredictionTester from '../components/PredictionTester';
import { fetchJson } from '../utils/api';

export default function RnDPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modelStatus, setModelStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [deploymentInfo, setDeploymentInfo] = useState(null);

  useEffect(() => {
    fetchJson('/api/model-status').then(setModelStatus).catch(() => {});
    fetchJson('/api/analytics/trends?range=hour').then(setAnalytics).catch(() => {});
    fetchJson('/api/deployment-info').then(setDeploymentInfo).catch(() => {});
  }, []);

  const featureImportance = modelStatus?.feature_importance?.length
    ? modelStatus.feature_importance
    : [];

  const correlationData = analytics?.sensor_correlation
    ? Object.entries(analytics.sensor_correlation).map(([subject, A]) => ({
        subject,
        A,
        fullMark: Math.max(...Object.values(analytics.sensor_correlation), 100),
      }))
    : [];

  const activeMetrics = modelStatus?.active_metrics || {};
  const historyRows = [];

  if (modelStatus?.filename) {
    historyRows.push({
      version: `${modelStatus.filename} (Active)`,
      date: activeMetrics.deployed_at
        ? new Date(activeMetrics.deployed_at).toLocaleDateString()
        : modelStatus.model_modified
          ? new Date(modelStatus.model_modified).toLocaleDateString()
          : '—',
      accuracy: activeMetrics.accuracy != null ? `${(activeMetrics.accuracy * 100).toFixed(1)}%` : '—',
      f1: activeMetrics.f1_score ?? '—',
      datasetSize: activeMetrics.training_samples ?? analytics?.reading_count ?? '—',
      status: 'Production',
    });
  }

  (deploymentInfo?.deployment_history || []).slice(0, 5).forEach((entry) => {
    historyRows.push({
      version: entry.filename,
      date: new Date(entry.deployed_at).toLocaleDateString(),
      accuracy: '—',
      f1: '—',
      datasetSize: '—',
      status: 'Archived',
    });
  });

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
            
            <motion.div className="glass p-6 rounded-2xl" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}}>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <BarChart2 className="text-primary-500" /> Feature Importance ({modelStatus?.model_type || 'Model'})
              </h3>
              <div style={{ height: 300 }}>
                {featureImportance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={featureImportance} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--color-text-muted)' }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: 'var(--color-text-muted)' }} width={80} />
                      <Tooltip cursor={{fill: 'rgba(148,163,184,0.1)'}} contentStyle={{borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                      <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">No feature importance data available</div>
                )}
              </div>
            </motion.div>

            <motion.div className="glass p-6 rounded-2xl" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.1}}>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <BarChart2 className="text-primary-500" /> Sensor Activation Correlation
              </h3>
              <div style={{ height: 300 }}>
                {correlationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={correlationData}>
                      <PolarGrid stroke="rgba(148,163,184,0.2)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                      <Radar name="Mean Normalized" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">No correlation data — awaiting sensor readings</div>
                )}
              </div>
            </motion.div>

            <motion.div className="glass p-6 rounded-2xl col-span-1 md:col-span-2" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}}>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <GitMerge className="text-primary-500" /> Model Version History
              </h3>
              
              <div className="overflow-x-auto">
                {historyRows.length > 0 ? (
                  <table className="table-enterprise">
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>Date Deploy</th>
                        <th>Accuracy</th>
                        <th>F1 Score</th>
                        <th>Dataset Size</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRows.map((row) => (
                        <tr key={row.version}>
                          <td>{row.version}</td>
                          <td>{row.date}</td>
                          <td className={row.status === 'Production' ? 'text-emerald-500 font-semibold' : ''}>{row.accuracy}</td>
                          <td className={row.status === 'Production' ? 'text-emerald-500 font-semibold' : ''}>{row.f1}</td>
                          <td>{row.datasetSize}</td>
                          <td>
                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                              row.status === 'Production'
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-slate-400">No model deployment history available</p>
                )}
              </div>
            </motion.div>

            <motion.div className="col-span-1 md:col-span-2" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.3}}>
              <PredictionTester />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

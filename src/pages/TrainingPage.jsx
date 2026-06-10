import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Brain, Play, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';

export default function TrainingPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modelStatus, setModelStatus] = useState(null);
  const [trainingState, setTrainingState] = useState('idle'); // idle, training, pending
  const [metrics, setMetrics] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchModelStatus();
  }, []);

  const fetchModelStatus = () => {
    fetch('http://localhost:5000/api/model-status')
      .then(res => res.json())
      .then(data => setModelStatus(data))
      .catch(err => console.error(err));
  };

  const handleTrain = async () => {
    setTrainingState('training');
    setErrorMsg(null);
    try {
      const res = await fetch('http://localhost:5000/api/train-model', { method: 'POST' });
      const data = await res.json();
      if(data.error) {
        setErrorMsg(data.error);
        setTrainingState('idle');
      } else {
        setMetrics(data.metrics);
        setTrainingState('pending');
      }
    } catch(err) {
      setErrorMsg(err.message);
      setTrainingState('idle');
    }
  };

  const handleDeploy = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/deploy-model', { method: 'POST' });
      const data = await res.json();
      if(data.error) {
        setErrorMsg(data.error);
      } else {
        setTrainingState('idle');
        setMetrics(null);
        fetchModelStatus(); // Refresh active model data
      }
    } catch(err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? sidebarCollapsed ? 72 : 240 : 0 }}>
        <Header onToggleFullscreen={() => {}} isFullscreen={isFullscreen} />
        
        <main className="flex-1 p-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Model Training Center</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage active models, evaluate metrics, and retrain ML pipelines.</p>
          </motion.div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3">
              <AlertTriangle size={20} /> {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Active Model Info */}
            <motion.div className="glass p-6 rounded-2xl" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}}>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="text-emerald-500" /> Active Production Model
              </h3>
              
              {modelStatus ? (
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Status</span>
                    <span className="font-semibold text-emerald-500">{modelStatus.status}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Filename</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{modelStatus.filename || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Algorithm</span>
                    <span className="text-slate-700 dark:text-slate-300">{modelStatus.model_type}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Input Features</span>
                    <span className="text-slate-700 dark:text-slate-300">{modelStatus.features?.join(', ')}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Output Classes</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={modelStatus.classes?.join(', ')}>{modelStatus.classes?.join(', ')}</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-sm">Loading model info...</div>
              )}
            </motion.div>

            {/* Training Controls */}
            <motion.div className="glass p-6 rounded-2xl" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay: 0.1}}>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Brain className="text-primary-500" /> Pipeline Controls
              </h3>

              <div className="flex flex-col h-full justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    Retraining the model will pull all historical Dataset Samples from the database, perform a Train/Test split, and evaluate a new Random Forest classifier.
                  </p>
                  
                  {trainingState === 'idle' && (
                    <button onClick={handleTrain} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/30">
                      <Play size={18} /> Train New Model
                    </button>
                  )}

                  {trainingState === 'training' && (
                    <div className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl font-semibold">
                      <span className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></span>
                      Training in progress...
                    </div>
                  )}

                  {trainingState === 'pending' && metrics && (
                     <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-4 mt-4">
                       <h4 className="text-slate-800 dark:text-white font-semibold mb-3 flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={16}/> Model Comparison</h4>
                       <table className="w-full text-sm text-left">
                         <thead>
                           <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                             <th className="pb-2">Metric</th>
                             <th className="pb-2">Active Model</th>
                             <th className="pb-2 text-emerald-500">Candidate</th>
                           </tr>
                         </thead>
                         <tbody className="text-slate-700 dark:text-slate-300">
                           <tr className="border-b border-slate-100 dark:border-slate-800/50">
                             <td className="py-2">Accuracy</td>
                             <td className="py-2 font-mono">92.1%</td>
                             <td className="py-2 font-mono text-emerald-500 font-bold">{metrics.accuracy * 100}%</td>
                           </tr>
                           <tr className="border-b border-slate-100 dark:border-slate-800/50">
                             <td className="py-2">Precision</td>
                             <td className="py-2 font-mono">0.91</td>
                             <td className="py-2 font-mono text-emerald-500 font-bold">{metrics.precision}</td>
                           </tr>
                           <tr className="border-b border-slate-100 dark:border-slate-800/50">
                             <td className="py-2">Recall</td>
                             <td className="py-2 font-mono">0.90</td>
                             <td className="py-2 font-mono text-emerald-500 font-bold">{metrics.recall}</td>
                           </tr>
                           <tr className="border-b border-slate-100 dark:border-slate-800/50">
                             <td className="py-2">F1 Score</td>
                             <td className="py-2 font-mono">0.91</td>
                             <td className="py-2 font-mono text-emerald-500 font-bold">{metrics.f1_score}</td>
                           </tr>
                           <tr className="border-b border-slate-100 dark:border-slate-800/50">
                             <td className="py-2">Dataset Size</td>
                             <td className="py-2 font-mono">8,200</td>
                             <td className="py-2 font-mono text-emerald-500 font-bold">{metrics.dataset_size || 'N/A'}</td>
                           </tr>
                           <tr>
                             <td className="py-2">Training Date</td>
                             <td className="py-2 font-mono">2026-05-15</td>
                             <td className="py-2 font-mono text-emerald-500 font-bold">Just now</td>
                           </tr>
                         </tbody>
                       </table>
                     </div>
                  )}
                </div>

                {trainingState === 'pending' && (
                  <button onClick={handleDeploy} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/30 mt-4">
                    <CheckCircle2 size={18} /> Confirm & Deploy Model
                  </button>
                )}
              </div>
            </motion.div>

          </div>
        </main>
      </div>
    </div>
  );
}

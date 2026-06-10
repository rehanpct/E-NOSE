import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Beaker, Search, AlertCircle, ShieldAlert, CheckCircle } from 'lucide-react';

export default function PredictionTester() {
  const [inputs, setInputs] = useState({
    mq2: 300,
    mq5: 400,
    mq9: 200,
    mq135: 150,
    temperature: 25,
    humidity: 50
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/predict-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setInputs(prev => ({...prev, [e.target.name]: parseFloat(e.target.value) || 0}));
  };

  return (
    <motion.div className="glass p-6 rounded-2xl" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}}>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <Beaker className="text-primary-500" /> Manual Prediction Testing
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {Object.entries(inputs).map(([key, val]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase">
              {key}
            </label>
            <input
              type="number"
              name={key}
              value={val}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        ))}
      </div>

      <button 
        onClick={handlePredict}
        disabled={loading}
        className="w-full sm:w-auto px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
      >
        <Search size={18} /> {loading ? 'Analyzing...' : 'Run Prediction'}
      </button>

      {result && result.status === 'success' && (
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Primary Detection</h4>
              <div className="text-3xl font-extrabold text-primary-500 mb-1">
                {result.prediction.gas}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Confidence: <span className="font-bold">{result.prediction.confidence}%</span>
              </div>
              
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 mt-4">Environmental Status</h4>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                {result.category === 'Hazardous' ? <ShieldAlert className="text-red-500"/> : result.category === 'Excellent' ? <CheckCircle className="text-emerald-500"/> : <AlertCircle className="text-amber-500"/>}
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{result.category}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">EQS Score: {Math.round(result.eqs)}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Probability Distribution</h4>
              <div className="space-y-3">
                {result.prediction.distribution && Object.entries(result.prediction.distribution).sort((a,b)=>b[1]-a[1]).map(([cls, prob]) => (
                  <div key={cls}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{cls}</span>
                      <span className="text-slate-500">{prob}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary-500 h-full" 
                        style={{width: `${prob}%`}}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

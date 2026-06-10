import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, CheckCircle2, AlertCircle, Info, Activity } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';

export default function ActivityFeed() {
  const { activityFeed } = useDroneData();

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'warning': return <AlertCircle size={16} className="text-fuchsia-500" />;
      case 'error': return <AlertCircle size={16} className="text-red-500" />;
      case 'critical': return <AlertCircle size={16} className="text-red-600" />;
      default: return <Info size={16} className="text-primary-500" />;
    }
  };

  return (
    <motion.div
      className="glass card-sensor p-5 flex flex-col gap-4 h-full"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title mb-0">Live Activity Feed</h3>
        <List className="text-slate-400" size={18} />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '300px' }}>
        <AnimatePresence>
          {activityFeed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 opacity-50 py-8">
               <Activity size={24} className="mb-2" />
               <p className="text-sm">Waiting for activity...</p>
            </div>
          ) : (
            activityFeed.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 mb-4 last:mb-0"
              >
                <div className="mt-0.5">{getIcon(item.type)}</div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.message}</p>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.timestamp}</span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

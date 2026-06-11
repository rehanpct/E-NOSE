import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, CheckCircle2, AlertCircle, Info, Activity } from 'lucide-react';
import { useDroneData } from '../context/DroneDataContext';

export default function ActivityFeed() {
  const { activityFeed } = useDroneData();
  const visibleFeed = (activityFeed || []).slice(0, 20);

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
      className="glass card-sensor flex flex-col gap-4 h-full"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title mb-0">Live Activity Feed</h3>
        <List className="text-slate-400" size={18} />
      </div>

      <div className="overflow-y-auto pr-2 custom-scrollbar" style={{ height: '220px', maxHeight: '220px' }}>
        <AnimatePresence>
          {visibleFeed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 opacity-50 py-8">
               <Activity size={24} className="mb-2" />
               <p className="text-sm">Waiting for activity...</p>
            </div>
          ) : (
            visibleFeed.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 mb-3 last:mb-0"
              >
                <div className="mt-0.5 flex-shrink-0">{getIcon(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{item.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{item.timestamp}</span>
                    {item.count > 1 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        ×{item.count}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

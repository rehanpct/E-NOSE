import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Sliders, FileText, Database, Brain,
  Rocket, Network, Settings, Menu, ChevronLeft, Save, Beaker
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dataset-collection', label: 'Dataset Collection', icon: Save },
  { path: '/dataset', label: 'Dataset Management', icon: Database },
  { path: '/training', label: 'Training Center', icon: Brain },
  { path: '/rnd', label: 'R&D Dashboard', icon: Beaker },
  { path: '/calibration', label: 'Calibration', icon: Sliders },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/deployment', label: 'Deployment', icon: Rocket },
  { path: '/architecture', label: 'Architecture', icon: Network },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const sidebarVariants = {
  expanded: { width: 220 },
  collapsed: { width: 68 },
};

const labelVariants = {
  visible: {
    opacity: 1,
    x: 0,
    display: 'block',
    transition: { delay: 0.1, duration: 0.2 },
  },
  hidden: {
    opacity: 0,
    x: -10,
    transitionEnd: { display: 'none' },
    transition: { duration: 0.15 },
  },
};

export default function Sidebar({ isCollapsed, onToggle }) {
  return (
    <motion.aside
      variants={sidebarVariants}
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="sidebar-glass fixed left-0 top-0 h-full z-50 flex flex-col"
      style={{
        background: 'rgba(255, 255, 255, 0.78)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.35)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Dark mode override styles */}
      <style>{`
        .dark .sidebar-glass {
          background: rgba(15, 23, 42, 0.82) !important;
          border-right-color: rgba(56, 189, 248, 0.1) !important;
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2) !important;
        }
      `}</style>

      {/* Brand / Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-slate-100 dark:border-slate-800/50">
        <motion.div
          whileHover={{ rotate: 12 }}
          className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/20"
        >
          <span className="text-white font-bold text-sm">EN</span>
        </motion.div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              variants={labelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="min-w-0"
            >
              <h2 className="text-sm font-extrabold gradient-text leading-tight">E-NOSE</h2>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate leading-tight">
                AI Environmental Monitor
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle Button */}
      <div className="px-3 py-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? (
            <Menu size={18} className="text-slate-500 dark:text-slate-400" />
          ) : (
            <ChevronLeft size={18} className="text-slate-500 dark:text-slate-400" />
          )}
        </motion.button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="block"
            >
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative
                    ${isActive
                      ? 'gradient-primary text-white shadow-md shadow-sky-500/20'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-700 dark:hover:text-slate-200'
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    size={18}
                    className={`flex-shrink-0 ${isActive ? 'text-white' : ''}`}
                  />

                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        variants={labelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className={`text-sm font-semibold truncate ${
                          isActive ? 'text-white' : ''
                        }`}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active indicator dot when collapsed */}
                  {isActive && isCollapsed && (
                    <motion.div
                      layoutId="active-dot"
                      className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white"
                      style={{ boxShadow: '0 0 6px rgba(255,255,255,0.5)' }}
                    />
                  )}
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section - Version */}
      <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-800/50">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-3'}`}>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                variants={labelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="text-[10px] font-medium text-slate-400 dark:text-slate-500"
              >
                E-NOSE Dashboard
              </motion.span>
            )}
          </AnimatePresence>
          <motion.span
            layout
            className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/50"
          >
            v1.0.0
          </motion.span>
        </div>
      </div>
    </motion.aside>
  );
}

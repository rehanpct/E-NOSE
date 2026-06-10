import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDroneData } from '../context/DroneDataContext';
import { useTheme } from '../context/ThemeContext';
import {
  Wifi, WifiOff, Battery, MapPin, Sun, Moon, User, LogOut,
  Maximize, Minimize, Bell, Signal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header({ onToggleFullscreen, isFullscreen }) {
  const { data, alerts, isConnected } = useDroneData();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const batteryColor = data.battery > 50 ? '#10b981' : data.battery > 20 ? '#f59e0b' : '#ef4444';
  const unreadAlerts = alerts.filter(a => a.level === 'critical' || a.level === 'emergency').length;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass sticky top-0 z-40 px-4 lg:px-6 py-3 flex items-center justify-between gap-4"
      style={{ borderRadius: '0 0 16px 16px' }}
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-sky-500/20">
            <span className="text-white font-bold text-sm">EN</span>
          </div>
          <div className="hidden sm:block min-w-0">
            <h1 className="text-base font-bold gradient-text leading-tight">E-NOSE</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight">
              AI Drone-Based Environmental Monitoring
            </p>
          </div>
        </div>
      </div>

      {/* Center: Status indicators */}
      <div className="hidden md:flex items-center gap-4 lg:gap-6">
        {/* Drone Status */}
        <div className="flex items-center gap-2">
          <span className={`status-dot ${data.drone_status === 'Online' ? 'status-online' : 'status-offline'}`} />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {data.drone_status}
          </span>
        </div>

        {/* GPS */}
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className={data.gps_lock ? 'text-emerald-500' : 'text-red-400'} />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {data.gps_lock ? `${data.satellites} SAT` : 'No GPS'}
          </span>
        </div>

        {/* Signal */}
        <div className="flex items-center gap-1.5">
          <Signal size={14} className="text-sky-500" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {Math.round(data.signal_strength)}%
          </span>
        </div>

        {/* Battery */}
        <div className="flex items-center gap-1.5">
          <Battery size={14} style={{ color: batteryColor }} />
          <span className="text-xs font-bold" style={{ color: batteryColor }}>
            {Math.round(data.battery)}%
          </span>
        </div>

        {/* Prediction */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-900/30">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
            {data.prediction}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Clock */}
        <div className="hidden lg:block text-right">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 font-mono">
            {currentTime.toLocaleTimeString()}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {currentTime.toLocaleDateString()}
          </p>
        </div>

        {/* Alert Bell */}
        <button className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell size={18} className="text-slate-500 dark:text-slate-400" />
          {unreadAlerts > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </motion.span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark
            ? <Sun size={18} className="text-amber-400" />
            : <Moon size={18} className="text-slate-500" />
          }
        </button>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="hidden lg:block p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isFullscreen
            ? <Minimize size={18} className="text-slate-500 dark:text-slate-400" />
            : <Maximize size={18} className="text-slate-500 dark:text-slate-400" />
          }
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-md shadow-sky-500/20"
          >
            <User size={15} className="text-white" />
          </button>
          {showProfileMenu && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute right-0 top-10 glass-strong p-2 min-w-[150px] z-50"
              style={{ borderRadius: '12px' }}
            >
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Admin</p>
                <p className="text-xs text-slate-400">admin@enose.io</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}

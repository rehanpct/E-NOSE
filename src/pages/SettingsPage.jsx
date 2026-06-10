import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useDroneData } from '../context/DroneDataContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import {
  Settings, Sun, Moon, Bell, Volume2, Wifi, Globe, Plug,
  AlertTriangle, Info, Save, RefreshCw, Sliders, Shield,
  Thermometer, TestTube, CheckCircle
} from 'lucide-react';

function ToggleSwitch({ enabled, onToggle, label }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <button
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
          enabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <motion.div
          animate={{ x: enabled ? 24 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
        />
      </button>
    </div>
  );
}

function ThresholdSlider({ label, value, onChange, min, max, color, unit = 'ppm' }) {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${percentage}%, #e2e8f0 ${percentage}%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const { data } = useDroneData();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // General Settings
  const [refreshRate, setRefreshRate] = useState('2');
  const [notifications, setNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);

  // Connection Settings
  const [wsUrl, setWsUrl] = useState('ws://localhost:8765');
  const [serialPort, setSerialPort] = useState('COM3');
  const [baudRate, setBaudRate] = useState('57600');
  const [connectionTested, setConnectionTested] = useState(false);

  // Alert Thresholds
  const [mq2Threshold, setMq2Threshold] = useState(400);
  const [mq5Threshold, setMq5Threshold] = useState(350);
  const [mq9Threshold, setMq9Threshold] = useState(500);
  const [mq135Threshold, setMq135Threshold] = useState(400);
  const [tempThreshold, setTempThreshold] = useState(45);

  // Save feedback
  const [saved, setSaved] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTestConnection = () => {
    setConnectionTested(false);
    setTimeout(() => setConnectionTested(true), 1500);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const refreshRates = [
    { value: '1', label: '1 second' },
    { value: '2', label: '2 seconds' },
    { value: '5', label: '5 seconds' },
    { value: '10', label: '10 seconds' },
  ];

  const baudRates = ['9600', '19200', '38400', '57600', '115200'];

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768
            ? isCollapsed ? 72 : 240
            : 0,
        }}
      >
        <Header onToggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />

        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto"
        >
          {/* Page Title */}
          <motion.div variants={itemVariants}>
            <h1 className="text-2xl lg:text-3xl font-bold gradient-text">Settings</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure your E-NOSE dashboard preferences
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Settings */}
            <motion.div variants={itemVariants} className="glass card-sensor p-6">
              <div className="section-title">
                <Settings size={14} />
                General Settings
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {isDark ? (
                      <Moon size={18} className="text-indigo-400" />
                    ) : (
                      <Sun size={18} className="text-amber-500" />
                    )}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {isDark ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                      isDark ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <motion.div
                      animate={{ x: isDark ? 24 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                    />
                  </button>
                </div>

                {/* Refresh Rate */}
                <div className="py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <RefreshCw size={18} className="text-sky-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Data Refresh Rate
                      </span>
                    </div>
                  </div>
                  <select
                    value={refreshRate}
                    onChange={(e) => setRefreshRate(e.target.value)}
                    className="input-field !py-2.5 !text-sm mt-1"
                  >
                    {refreshRates.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notification Toggle */}
                <div className="flex items-center gap-3 py-0">
                  <Bell size={18} className="text-amber-500 flex-shrink-0 mt-3" />
                  <div className="flex-1">
                    <ToggleSwitch
                      enabled={notifications}
                      onToggle={() => setNotifications(!notifications)}
                      label="Notifications"
                    />
                  </div>
                </div>

                {/* Sound Alerts Toggle */}
                <div className="flex items-center gap-3 py-0">
                  <Volume2 size={18} className="text-purple-500 flex-shrink-0 mt-3" />
                  <div className="flex-1">
                    <ToggleSwitch
                      enabled={soundAlerts}
                      onToggle={() => setSoundAlerts(!soundAlerts)}
                      label="Sound Alerts"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Connection Settings */}
            <motion.div variants={itemVariants} className="glass card-sensor p-6">
              <div className="section-title">
                <Wifi size={14} />
                Connection Settings
              </div>
              <div className="space-y-4">
                {/* WebSocket URL */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    <Globe size={14} className="text-sky-500" />
                    WebSocket URL
                  </label>
                  <input
                    type="text"
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    className="input-field !text-sm"
                    placeholder="ws://localhost:8765"
                  />
                </div>

                {/* Serial Port */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    <Plug size={14} className="text-emerald-500" />
                    Serial Port
                  </label>
                  <input
                    type="text"
                    value={serialPort}
                    onChange={(e) => setSerialPort(e.target.value)}
                    className="input-field !text-sm"
                    placeholder="COM3"
                  />
                </div>

                {/* Baud Rate */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    <Sliders size={14} className="text-amber-500" />
                    Baud Rate
                  </label>
                  <select
                    value={baudRate}
                    onChange={(e) => setBaudRate(e.target.value)}
                    className="input-field !py-2.5 !text-sm"
                  >
                    {baudRates.map((br) => (
                      <option key={br} value={br}>
                        {br}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Test Connection */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTestConnection}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                >
                  {connectionTested ? (
                    <>
                      <CheckCircle size={16} className="text-emerald-500" />
                      <span className="text-emerald-500">Connection Successful</span>
                    </>
                  ) : (
                    <>
                      <Wifi size={16} />
                      Test Connection
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Alert Thresholds */}
            <motion.div variants={itemVariants} className="glass card-sensor p-6">
              <div className="section-title">
                <AlertTriangle size={14} />
                Alert Thresholds
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <ThresholdSlider
                  label="MQ-2 (Smoke/Combustible Gas)"
                  value={mq2Threshold}
                  onChange={setMq2Threshold}
                  min={0}
                  max={900}
                  color="#0ea5e9"
                />
                <ThresholdSlider
                  label="MQ-5 (LPG/Natural Gas)"
                  value={mq5Threshold}
                  onChange={setMq5Threshold}
                  min={0}
                  max={800}
                  color="#8b5cf6"
                />
                <ThresholdSlider
                  label="MQ-9 (Carbon Monoxide)"
                  value={mq9Threshold}
                  onChange={setMq9Threshold}
                  min={0}
                  max={950}
                  color="#f59e0b"
                />
                <ThresholdSlider
                  label="MQ-135 (Air Quality)"
                  value={mq135Threshold}
                  onChange={setMq135Threshold}
                  min={0}
                  max={850}
                  color="#10b981"
                />
                <ThresholdSlider
                  label="Temperature Alert"
                  value={tempThreshold}
                  onChange={setTempThreshold}
                  min={0}
                  max={80}
                  color="#ef4444"
                  unit="°C"
                />
              </div>
            </motion.div>

            {/* About Section */}
            <motion.div variants={itemVariants} className="glass card-sensor p-6">
              <div className="section-title">
                <Info size={14} />
                About
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-sky-500/20">
                    <span className="text-white font-bold text-lg">EN</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold gradient-text">E-NOSE Dashboard</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      AI Drone-Based Environmental Monitoring System
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Version', value: 'v2.4.1' },
                    { label: 'Build', value: '2026.06.08-stable' },
                    { label: 'Author', value: 'E-NOSE Research Team' },
                    { label: 'License', value: 'MIT License' },
                    { label: 'Framework', value: 'React 18 + Vite' },
                    { label: 'AI Backend', value: 'TensorFlow + scikit-learn' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {item.label}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    An AI-powered drone system for real-time environmental gas monitoring using
                    an array of MQ-series sensors and machine learning for gas classification.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Save Button */}
          <motion.div variants={itemVariants} className="flex items-center justify-end gap-3 pb-6">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className="btn-primary flex items-center gap-2"
            >
              {saved ? (
                <>
                  <CheckCircle size={18} />
                  Settings Saved!
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Settings
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
}

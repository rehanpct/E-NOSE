import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { fetchJson, formatUptime } from '../utils/api';
import {
  Cpu, Wifi, Brain, Monitor, ChevronDown, ChevronUp,
  Radio, Thermometer, Wind, Gauge, Server, Database,
  ArrowDown, Layers, Boxes, Code2
} from 'lucide-react';

const architectureLayers = [
  {
    id: 'sensors',
    label: 'Sensor Array',
    icon: Radio,
    color: '#10b981',
    items: ['MQ-2', 'MQ-5', 'MQ-9', 'MQ-135', 'DHT11', 'BME280'],
    description: 'Gas sensors and environmental modules mounted on the drone',
  },
  {
    id: 'processing',
    label: 'Flight Controller & Data Processing',
    icon: Cpu,
    color: '#0ea5e9',
    items: ['Flight Controller', 'Data Processing'],
    description: 'ArduPilot-based flight control and real-time sensor data aggregation',
  },
  {
    id: 'output',
    label: 'AI Engine & Dashboard',
    icon: Brain,
    color: '#8b5cf6',
    items: ['AI Engine', 'Dashboard'],
    description: 'Machine learning inference and real-time monitoring interface',
  },
];

const componentDetails = [
  {
    id: 'sensor-array',
    title: 'Sensor Array Module',
    icon: Radio,
    color: '#10b981',
    description: 'Array of MQ-series gas sensors and environmental sensors for comprehensive air quality monitoring.',
    specs: [
      'MQ-2: Combustible gas & smoke (300-10000 ppm)',
      'MQ-5: LPG, natural gas, coal gas (200-10000 ppm)',
      'MQ-9: Carbon monoxide & flammable gases (10-1000 ppm)',
      'MQ-135: Air quality — NH3, NOx, benzene (10-1000 ppm)',
      'DHT11: Temperature (0-50°C) & Humidity (20-90%)',
      'BME280: Temp, Humidity, Barometric pressure',
    ],
  },
  {
    id: 'flight-controller',
    title: 'Flight Controller',
    icon: Cpu,
    color: '#0ea5e9',
    description: 'ArduPilot-based autopilot system for autonomous waypoint navigation and drone stabilization.',
    specs: [
      'Protocol: MAVLink 2.0',
      'GPS: u-blox NEO-M8N (72-channel)',
      'IMU: MPU6050 6-axis',
      'Baud Rate: 57600',
      'Telemetry: 915MHz / 433MHz',
      'Flight Modes: AUTO, GUIDED, LOITER, RTL',
    ],
  },
  {
    id: 'data-processing',
    title: 'Data Processing Unit',
    icon: Server,
    color: '#f59e0b',
    description: 'Edge computing unit for real-time sensor data pre-processing and feature extraction.',
    specs: [
      'Platform: Raspberry Pi 4 (4GB)',
      'Sampling Rate: 10 Hz',
      'Buffer Size: 512 samples',
      'Communication: UART + I2C + SPI',
      'Pre-processing: Kalman filtering, normalization',
      'Data Format: JSON over WebSocket',
    ],
  },
  {
    id: 'ai-engine',
    title: 'AI Inference Engine',
    icon: Brain,
    color: '#8b5cf6',
    description: 'Machine learning pipeline for real-time gas classification and environmental risk assessment.',
    specs: [],
  },
  {
    id: 'dashboard',
    title: 'Monitoring Dashboard',
    icon: Monitor,
    color: '#ec4899',
    description: 'Real-time web dashboard for drone telemetry, sensor visualization, and AI prediction display.',
    specs: [
      'Framework: React 18 + Vite',
      'Styling: Tailwind CSS v4 + Glassmorphism',
      'Charts: Recharts + Custom SVG gauges',
      'Maps: Leaflet + OpenStreetMap',
      'Connection: WebSocket (ws://)',
      'Animations: Framer Motion',
    ],
  },
];

const techStack = [
  { name: 'React', color: '#61dafb', category: 'Frontend' },
  { name: 'Tailwind CSS', color: '#38bdf8', category: 'Frontend' },
  { name: 'Framer Motion', color: '#ff4083', category: 'Frontend' },
  { name: 'Recharts', color: '#8884d8', category: 'Frontend' },
  { name: 'Leaflet', color: '#199900', category: 'Frontend' },
  { name: 'Python', color: '#3776ab', category: 'Backend' },
  { name: 'Arduino', color: '#00979d', category: 'Hardware' },
  { name: 'MAVLink', color: '#e44d26', category: 'Protocol' },
  { name: 'WebSocket', color: '#4caf50', category: 'Protocol' },
  { name: 'Raspberry Pi', color: '#c51a4a', category: 'Hardware' },
  { name: 'ArduPilot', color: '#f5a623', category: 'Firmware' },
  { name: 'Vite', color: '#646cff', category: 'Tooling' },
  { name: 'Node.js', color: '#339933', category: 'Backend' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function ArchitecturePage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [liveHealth, setLiveHealth] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);

  useEffect(() => {
    const load = () => {
      fetchJson('/api/system-health').then(setLiveHealth).catch(() => setLiveHealth(null));
      fetchJson('/api/model-status').then(setModelStatus).catch(() => setModelStatus(null));
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

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
            <h1 className="text-2xl lg:text-3xl font-bold gradient-text">System Architecture</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Visual overview of the E-NOSE drone monitoring system
            </p>
          </motion.div>

          {/* System Diagram */}
          <motion.div variants={itemVariants} className="glass card-sensor">
            <div className="section-title">
              <Boxes size={14} />
              System Diagram
            </div>

            <div className="flex flex-col items-center gap-0 py-6">
              {architectureLayers.map((layer, layerIdx) => (
                <React.Fragment key={layer.id}>
                  {/* Layer Box */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: layerIdx * 0.2, duration: 0.5 }}
                    className="w-full max-w-3xl"
                  >
                    <div
                      className="glass p-5 relative overflow-hidden"
                      style={{
                        borderLeft: `4px solid ${layer.color}`,
                      }}
                    >
                      {/* Decorative glow */}
                      <div
                        className="absolute top-0 left-0 w-32 h-full opacity-10 pointer-events-none"
                        style={{
                          background: `linear-gradient(90deg, ${layer.color}, transparent)`,
                        }}
                      />
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: `${layer.color}15` }}
                          >
                            <layer.icon size={20} style={{ color: layer.color }} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">{layer.label}</h3>
                            <p className="text-xs text-slate-400">{layer.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {layer.items.map((item) => (
                            <motion.span
                              key={item}
                              whileHover={{ scale: 1.05 }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                              style={{
                                background: `${layer.color}12`,
                                color: layer.color,
                                border: `1px solid ${layer.color}30`,
                              }}
                            >
                              {item}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Connecting Arrow */}
                  {layerIdx < architectureLayers.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ delay: layerIdx * 0.2 + 0.3, duration: 0.3 }}
                      className="flex flex-col items-center py-2"
                    >
                      <div className="w-0.5 h-6 bg-gradient-to-b from-sky-500 to-cyan-500 rounded-full" />
                      <ArrowDown size={18} className="text-sky-500 -mt-1" />
                    </motion.div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          {/* Component Details */}
          <motion.div variants={itemVariants}>
            <div className="section-title">
              <Layers size={14} />
              Component Details
            </div>
            <div className="space-y-3">
              {componentDetails.map((comp, i) => (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass card-sensor"
                >
                  <button
                    onClick={() => toggleExpand(comp.id)}
                    className="w-full flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${comp.color}15` }}
                      >
                        <comp.icon size={20} style={{ color: comp.color }} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">{comp.title}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{comp.description}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      {expandedCard === comp.id ? (
                        <ChevronUp size={18} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={18} className="text-slate-400" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedCard === comp.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                            {(comp.id === 'ai-engine' ? (
                              (() => {
                                if (!modelStatus) {
                                  return [
                                    "Framework: Metadata unavailable",
                                    "Active Model: Metadata unavailable",
                                    "Classes: Metadata unavailable",
                                    "Inference Time: < 50ms",
                                    "Accuracy: Accuracy metadata unavailable",
                                    "Features: Metadata unavailable"
                                  ];
                                }
                                if (!modelStatus.loaded) {
                                  return [
                                    "Framework: No model deployed",
                                    "Active Model: No model deployed",
                                    "Classes: No model deployed",
                                    "Inference Time: —",
                                    "Accuracy: No model deployed",
                                    "Features: No model deployed"
                                  ];
                                }
                                const framework = modelStatus.framework || "Metadata unavailable";
                                const modelType = modelStatus.model_type || "Metadata unavailable";
                                const filename = modelStatus.filename || "Metadata unavailable";
                                const classesCount = modelStatus.classes?.length ?? 0;
                                const classesList = modelStatus.classes ? modelStatus.classes.join(', ') : "Metadata unavailable";
                                const accuracy = modelStatus.active_metrics?.accuracy != null 
                                  ? `${(modelStatus.active_metrics.accuracy * 100).toFixed(1)}%`
                                  : "Accuracy metadata unavailable";
                                const featureCount = modelStatus.feature_count ?? 0;
                                const featureNames = modelStatus.features ? modelStatus.features.join(', ') : "Metadata unavailable";

                                return [
                                  `Framework: ${framework}`,
                                  `Active Model: ${modelType} (${filename})`,
                                  `Classes: ${classesCount} types (${classesList})`,
                                  `Inference Time: < 50ms`,
                                  `Accuracy: ${accuracy}`,
                                  `Features: ${featureCount} channels (${featureNames})`
                                ];
                              })()
                            ) : comp.specs).map((displaySpec, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                              >
                                <div
                                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                  style={{ background: comp.color }}
                                />
                                {displaySpec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Live System Status */}
          <motion.div variants={itemVariants} className="glass card-sensor">
            <div className="section-title">
              <Server size={14} />
              Live System Status
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              {[
                { label: 'Backend', value: liveHealth?.backend === 'online' ? 'Online' : 'Offline' },
                { label: 'Database', value: liveHealth?.database === 'online' ? 'Online' : 'Offline' },
                { label: 'ESP32', value: liveHealth?.esp32 === 'online' ? 'Online' : 'Offline' },
                { label: 'ML Model', value: liveHealth?.model === 'loaded' ? 'Loaded' : 'Failed' },
                { label: 'Uptime', value: formatUptime(liveHealth?.uptime) },
                { label: 'Total Samples', value: liveHealth?.total_samples?.toLocaleString() ?? '—' },
                { label: 'Predictions', value: liveHealth?.total_predictions?.toLocaleString() ?? '—' },
                { label: 'Active Model', value: modelStatus?.filename || liveHealth?.active_model || 'None' },
              ].map((item) => (
                <div key={item.label} className="text-center p-3 rounded-xl bg-white/30 dark:bg-slate-800/30">
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{item.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Technology Stack */}
          <motion.div variants={itemVariants} className="glass card-sensor">
            <div className="section-title">
              <Code2 size={14} />
              Technology Stack
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {techStack.map((tech, i) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.4 }}
                  whileHover={{ scale: 1.08, y: -2 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-default"
                  style={{
                    background: `${tech.color}10`,
                    border: `1px solid ${tech.color}25`,
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: tech.color }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: tech.color }}
                  >
                    {tech.name}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {tech.category}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
}

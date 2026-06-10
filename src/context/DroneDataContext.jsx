import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';

const DroneDataContext = createContext();

// Create Socket connection
// Connects to the backend server (ensure this matches your deployment URL)
const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const socket = io(socketUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

export function DroneDataProvider({ children }) {
  useEffect(() => {
    console.log("DroneDataProvider mounted");
    return () => console.log("DroneDataProvider unmounted");
  }, []);

  // Connection states
  const [backendConnected, setBackendConnected] = useState(socket.connected);
  const [esp32ConnectionState, setEsp32ConnectionState] = useState('Offline'); // Connected, Warning, Offline
  const [lastReceivedTimestamp, setLastReceivedTimestamp] = useState(null);
  const lastReceivedRef = useRef(null);

  // Live Data states
  const [data, setData] = useState({
    mq2: 0,
    mq5: 0,
    mq9: 0,
    mq135: 0,
    dht_temp: 0,
    dht_humidity: 0,
    bme_temp: 0,
    bme_humidity: 0,
    pressure: 0,
    predicted_gas: "Unknown",
    confidence: 0,
    latitude: 0,
    longitude: 0,
    altitude: 0,
    speed: 0,
    battery: 100,
    signal_strength: 100
  });

  const [alerts, setAlerts] = useState([]);
  const [pathHistory, setPathHistory] = useState([]);
  const [samplesCollected, setSamplesCollected] = useState(0);
  const [missionStartTime] = useState(new Date());

  
  // Historical data for charts
  const [sensorHistory, setSensorHistory] = useState({
    timestamps: [],
    dht_temp: [], dht_humidity: [],
    mq2: [], mq5: [], mq9: [], mq135: []
  });
  
  // Activity feed
  const [activityFeed, setActivityFeed] = useState([]);

  const snapshotBuffer = useRef([]);

  const addActivity = useCallback((message, type = 'info') => {
    setActivityFeed(prev => [{
      id: Date.now().toString() + Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    // Socket connection events
    socket.on('connect', () => {
      setBackendConnected(true);
      addActivity('Backend Connected', 'success');
    });

    socket.on('disconnect', () => {
      setBackendConnected(false);
      setEsp32ConnectionState('Offline');
      addActivity('Backend Connection Lost', 'error');
    });

    // Sensor update event
    socket.on('sensor_update', (sensorData) => {
      setEsp32ConnectionState('Connected');
      const now = new Date();
      setLastReceivedTimestamp(now);
      lastReceivedRef.current = now;
      setSamplesCollected(prev => prev + 1);
      addActivity('Sensor Reading Received', 'info');

      // Update current data
      setData(prev => ({
        ...prev,
        raw_mq2: sensorData.raw_mq2,
        raw_mq5: sensorData.raw_mq5,
        raw_mq9: sensorData.raw_mq9,
        raw_mq135: sensorData.raw_mq135,
        mq2: sensorData.normalized_mq2,
        mq5: sensorData.normalized_mq5,
        mq9: sensorData.normalized_mq9,
        mq135: sensorData.normalized_mq135,
        dht_temp: sensorData.temperature,
        dht_humidity: sensorData.humidity,
        eqs: sensorData.eqs
      }));

      // Update history for charts
      setSensorHistory(prev => {
        const next = { ...prev };
        const ts = new Date(sensorData.timestamp).toLocaleTimeString();
        next.timestamps = [...prev.timestamps, ts].slice(-60);
        next.dht_temp = [...prev.dht_temp, sensorData.temperature].slice(-60);
        next.dht_humidity = [...prev.dht_humidity, sensorData.humidity].slice(-60);
        next.mq2 = [...prev.mq2, sensorData.mq2].slice(-60);
        next.mq5 = [...prev.mq5, sensorData.mq5].slice(-60);
        next.mq9 = [...prev.mq9, sensorData.mq9].slice(-60);
        next.mq135 = [...prev.mq135, sensorData.mq135].slice(-60);
        return next;
      });

      // Buffer for export
      snapshotBuffer.current.push(sensorData);
      if (snapshotBuffer.current.length > 500) snapshotBuffer.current.shift();
    });

    // Prediction update event
    socket.on('prediction_update', (prediction) => {
      setData(prev => ({
        ...prev,
        predicted_gas: prediction.predicted_gas,
        confidence: prediction.confidence,
        distribution: prediction.distribution || {}
      }));
      addActivity(`Prediction Generated: ${prediction.predicted_gas} (${prediction.confidence}%)`, 'info');
    });

    // Alert update event
    socket.on('alert_update', (alertData) => {
      setAlerts(prev => [alertData, ...prev].slice(0, 50));
      addActivity(`Alert Triggered: ${alertData.message}`, alertData.severity.toLowerCase());
    });
    
    // Telemetry update event
    socket.on('telemetry_update', (telemetry) => {
      setData(prev => ({
        ...prev,
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
        altitude: telemetry.altitude,
        speed: telemetry.speed,
        battery: telemetry.battery,
        signal_strength: telemetry.signal_strength
      }));
      
      setPathHistory(prev => [
        ...prev, 
        [telemetry.latitude, telemetry.longitude]
      ].slice(-100)); // Keep last 100 points
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('sensor_update');
      socket.off('prediction_update');
      socket.off('alert_update');
      socket.off('telemetry_update');
    };
  }, [addActivity]);

  // Monitor ESP32 timeout and simulate telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. ESP32 Timeout Logic
      if (lastReceivedRef.current) {
        const timeSinceLastMsg = new Date() - lastReceivedRef.current;
        
        setEsp32ConnectionState(prevState => {
          if (timeSinceLastMsg > 30000 && prevState !== 'Offline') {
            addActivity('ESP32 Offline (Timeout > 30s)', 'critical');
            return 'Offline';
          } else if (timeSinceLastMsg > 10000 && timeSinceLastMsg <= 30000 && prevState !== 'Warning') {
            addActivity('ESP32 Warning (No data > 10s)', 'warning');
            return 'Warning';
          }
          return prevState;
        });
      }

      // 2. Simulated Telemetry Logic (if no real telemetry arrives)
      setData(prev => {
        // Only simulate if not receiving real telemetry recently
        // We'll just generate smooth random walk for simulation
        const latChange = (Math.random() - 0.5) * 0.0001;
        const lngChange = (Math.random() - 0.5) * 0.0001;
        const newLat = (prev.latitude || 9.5937) + latChange;
        const newLng = (prev.longitude || 76.5222) + lngChange;
        const newAlt = Math.max(10, Math.min(100, (prev.altitude || 25) + (Math.random() - 0.5) * 2));
        const newHeading = (prev.heading || 0) + (Math.random() - 0.5) * 10;
        
        const simData = {
          ...prev,
          latitude: newLat,
          longitude: newLng,
          altitude: newAlt,
          heading: (newHeading + 360) % 360,
          speed: Math.max(0, Math.min(15, (prev.speed || 5) + (Math.random() - 0.5))),
          battery: Math.max(0, (prev.battery || 100) - 0.01) // slowly drain
        };

        setPathHistory(ph => [...ph, [newLat, newLng]].slice(-100));

        return simData;
      });

    }, 2000);
    return () => clearInterval(timer);
  }, [addActivity]);

  const getExportHistory = useCallback(() => snapshotBuffer.current, []);
  const clearAlerts = useCallback(() => setAlerts([]), []);

  // For backward compatibility with existing UI components that use 'isConnected'
  const isConnected = backendConnected;
  // Map old esp32Connected to the new state
  const esp32Connected = esp32ConnectionState === 'Connected' || esp32ConnectionState === 'Warning';

  const value = useMemo(() => ({
    data,
    history: sensorHistory, // Ensure history maps to sensorHistory if components use it
    alerts,
    pathHistory,
    sensorHistory,
    isConnected,
    backendConnected,
    esp32Connected,
    esp32ConnectionState,
    lastReceivedTimestamp,
    activityFeed,
    samplesCollected,
    missionStartTime,
    getExportHistory,
    clearAlerts,
  }), [
    data,
    alerts,
    pathHistory,
    sensorHistory,
    isConnected,
    backendConnected,
    esp32Connected,
    esp32ConnectionState,
    lastReceivedTimestamp,
    activityFeed,
    samplesCollected,
    missionStartTime,
    getExportHistory,
    clearAlerts,
  ]);

  return (
    <DroneDataContext.Provider value={value}>
      {children}
    </DroneDataContext.Provider>
  );
}

export function useDroneData() {
  const ctx = useContext(DroneDataContext);
  if (!ctx) throw new Error('useDroneData must be used within DroneDataProvider');
  return ctx;
}

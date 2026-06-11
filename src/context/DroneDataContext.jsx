import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { API_BASE, fetchJson } from '../utils/api';

const DroneDataContext = createContext();

const ESP32_WARNING_MS = 30000;
const ESP32_OFFLINE_MS = 90000;
const HEALTH_POLL_INTERVAL_MS = 10000;
const HEALTH_FAILURES_BEFORE_OFFLINE = 3;
const ESP32_STATE_CHECK_INTERVAL_MS = 2000;

function computeEsp32State(lastTelemetryAt) {
  if (!lastTelemetryAt) return 'Offline';
  const elapsed = Date.now() - lastTelemetryAt.getTime();
  if (elapsed > ESP32_OFFLINE_MS) return 'Offline';
  if (elapsed > ESP32_WARNING_MS) return 'Warning';
  return 'Connected';
}

function deriveRiskLevel(gas) {
  if (!gas || gas === 'Unknown') return 'Low';
  const g = gas.toLowerCase();
  if (g.includes('smoke') || g.includes('lpg') || g.includes('carbon') || g.includes('co')) return 'High';
  if (g.includes('alcohol') || g.includes('perfume') || g.includes('mixed')) return 'Medium';
  return 'Low';
}

function distributionToTopPredictions(distribution) {
  if (!distribution || typeof distribution !== 'object') return [];
  return Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([gas, score]) => ({ gas, score }));
}

function deriveSensorHealth(rawValues, baselines) {
  if (!baselines) return null;
  const health = {};
  const pct = {};
  ['mq2', 'mq5', 'mq9', 'mq135'].forEach((sensor) => {
    const raw = rawValues[sensor] ?? 0;
    const base = baselines[sensor]?.baseline ?? 0;
    const maxSeen = baselines[sensor]?.max_seen ?? base + 1;
    const range = Math.max(maxSeen - base, 1);
    const deviation = Math.abs(raw - base) / range;
    const healthPct = Math.max(0, Math.min(100, 100 - deviation * 50));
    pct[sensor] = healthPct;
    if (healthPct >= 70) health[sensor] = 'healthy';
    else if (healthPct >= 40) health[sensor] = 'calibration_required';
    else health[sensor] = 'warning';
  });
  health.dht11 = rawValues.dht_temp != null ? 'healthy' : 'warning';
  health.bme280 = rawValues.pressure != null && rawValues.pressure > 0 ? 'healthy' : 'calibration_required';
  pct.dht11 = rawValues.dht_temp != null ? 95 : 0;
  pct.bme280 = rawValues.pressure > 0 ? 95 : 0;
  return { health, pct };
}

const persisted = {
  lastTelemetryAt: null,
  backendReachable: false,
  consecutiveHealthFailures: 0,
  totalReconnects: 0,
  lastHealthResult: 'pending',
  socketInitialized: false,
  activityIdCounter: 0,
};

function getSocket() {
  if (!persisted.socketInitialized) {
    console.log(`[SOCKET] Initializing socket connection to: ${API_BASE}`);
    persisted.socketInitialized = true;
    persisted._socket = io(API_BASE, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket'],
      upgrade: false,
      timeout: 20000,
    });
  }
  return persisted._socket;
}

const socket = getSocket();

export function DroneDataProvider({ children }) {
  const [backendConnected, setBackendConnected] = useState(persisted.backendReachable);
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [transportType, setTransportType] = useState(
    socket.connected ? socket.io.engine.transport.name : 'none'
  );
  const [reconnectCount, setReconnectCount] = useState(0);
  const [lastHealthCheckResult, setLastHealthCheckResult] = useState(persisted.lastHealthResult);

  const [esp32ConnectionState, setEsp32ConnectionState] = useState(() =>
    computeEsp32State(persisted.lastTelemetryAt)
  );
  const [lastReceivedTimestamp, setLastReceivedTimestamp] = useState(persisted.lastTelemetryAt);
  const lastReceivedRef = useRef(persisted.lastTelemetryAt);

  const [systemHealth, setSystemHealth] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [sensorBaselines, setSensorBaselines] = useState(null);

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
    predicted_gas: 'Unknown',
    prediction: 'Unknown',
    confidence: 0,
    distribution: {},
    top_predictions: [],
    latitude: null,
    longitude: null,
    altitude: null,
    heading: null,
    speed: null,
    battery: null,
    signal_strength: null,
    eqs: null,
    smoke_index: null,
    voc_index: null,
    air_quality_index: null,
    hazard_level: null,
    pollution_score: null,
    risk_level: 'Low',
    model: null,
    samples_collected: 0,
    predictions_generated: 0,
  });

  const [alerts, setAlerts] = useState([]);
  const [pathHistory, setPathHistory] = useState([]);
  const [missionStartTime] = useState(new Date());

  const [sensorHistory, setSensorHistory] = useState({
    timestamps: [],
    dht_temp: [],
    dht_humidity: [],
    mq2: [],
    mq5: [],
    mq9: [],
    mq135: [],
  });

  const [activityFeed, setActivityFeed] = useState([]);
  const snapshotBuffer = useRef([]);
  const [samplesPerMinute, setSamplesPerMinute] = useState(0);
  const samplesPerMinuteRef = useRef([]);

  const addActivity = useCallback((message, type = 'info') => {
    const DEDUP_WINDOW_MS = 10000;
    setActivityFeed((prev) => {
      // Check if the same message exists within the dedup window
      const now = Date.now();
      const existingIdx = prev.findIndex(
        (item) =>
          item.message === message &&
          now - (item._ts || 0) < DEDUP_WINDOW_MS
      );
      if (existingIdx !== -1) {
        // Update timestamp + increment count on existing entry
        const updated = [...prev];
        const existing = updated[existingIdx];
        const count = (existing.count || 1) + 1;
        updated[existingIdx] = {
          ...existing,
          timestamp: new Date().toLocaleTimeString(),
          _ts: now,
          count,
          message: existing._baseMessage || message,
          _baseMessage: existing._baseMessage || message,
        };
        return updated;
      }
      // New unique entry
      persisted.activityIdCounter += 1;
      return [
        {
          id: `activity-${persisted.activityIdCounter}`,
          timestamp: new Date().toLocaleTimeString(),
          _ts: now,
          _baseMessage: message,
          message,
          type,
          count: 1,
        },
        ...prev,
      ].slice(0, 50);
    });
  }, []);

  const applyBackendHealthResult = useCallback((healthData) => {
    const isReachable = healthData?.backend === 'online';
    if (isReachable) {
      persisted.consecutiveHealthFailures = 0;
      persisted.backendReachable = true;
      persisted.lastHealthResult = 'ok';
      setLastHealthCheckResult('ok');
      setBackendConnected(true);
      setSystemHealth(healthData);
      setData((prev) => ({
        ...prev,
        samples_collected: healthData.total_samples ?? prev.samples_collected,
        predictions_generated: healthData.total_predictions ?? prev.predictions_generated,
      }));
      console.log('[HEALTH] Backend health check successful');
      return;
    }

    persisted.consecutiveHealthFailures += 1;
    persisted.lastHealthResult = 'failed';
    setLastHealthCheckResult('failed');
    console.log(
      `[HEALTH] Backend health check failed (consecutive: ${persisted.consecutiveHealthFailures}/${HEALTH_FAILURES_BEFORE_OFFLINE})`
    );

    if (persisted.consecutiveHealthFailures >= HEALTH_FAILURES_BEFORE_OFFLINE) {
      persisted.backendReachable = false;
      setBackendConnected(false);
      console.log('[BACKEND] Backend offline state entered');
    }
  }, []);

  const checkBackendHealth = useCallback(async () => {
    try {
      const healthData = await fetchJson('/api/system-health');
      applyBackendHealthResult(healthData);
      return healthData.backend === 'online';
    } catch (err) {
      console.log('[HEALTH] Backend health check failed:', err.message);
    }
    applyBackendHealthResult(null);
    return false;
  }, [applyBackendHealthResult]);

  const fetchModelStatus = useCallback(async () => {
    try {
      const status = await fetchJson('/api/model-status');
      setModelStatus(status);
      setData((prev) => ({
        ...prev,
        model: status.filename || status.model_type || prev.model,
      }));
    } catch (err) {
      console.log('[HEALTH] Model status fetch failed:', err.message);
    }
  }, []);

  const fetchBaselines = useCallback(async () => {
    try {
      const baselines = await fetchJson('/api/sensor-baselines');
      setSensorBaselines(baselines);
    } catch (err) {
      console.log('[HEALTH] Sensor baselines fetch failed:', err.message);
    }
  }, []);

  const hydrateFromLatest = useCallback(async () => {
    try {
      const latest = await fetchJson('/api/latest');
      if (latest.sensor) {
        const s = latest.sensor;
        const now = new Date(s.timestamp);
        persisted.lastTelemetryAt = now;
        lastReceivedRef.current = now;
        setLastReceivedTimestamp(now);
        setEsp32ConnectionState(computeEsp32State(now));

        setData((prev) => ({
          ...prev,
          raw_mq2: s.raw_mq2,
          raw_mq5: s.raw_mq5,
          raw_mq9: s.raw_mq9,
          raw_mq135: s.raw_mq135,
          mq2: s.normalized_mq2,
          mq5: s.normalized_mq5,
          mq9: s.normalized_mq9,
          mq135: s.normalized_mq135,
          dht_temp: s.temperature,
          dht_humidity: s.humidity,
          bme_temp: s.temperature,
          bme_humidity: s.humidity,
          eqs: s.eqs,
          // Map all 5 derived indices returned by the updated /api/latest endpoint
          smoke_index:       s.smoke_index       ?? prev.smoke_index,
          voc_index:         s.voc_index         ?? prev.voc_index,
          air_quality_index: s.air_quality_index ?? s.eqs ?? prev.air_quality_index,
          hazard_level:      s.hazard_level      ?? prev.hazard_level,
          pollution_score:   s.pollution_score   ?? prev.pollution_score,
        }));
      }
      if (latest.prediction) {
        const p = latest.prediction;
        setData((prev) => ({
          ...prev,
          predicted_gas: p.predicted_gas,
          prediction: p.predicted_gas,
          confidence: p.confidence,
          risk_level: deriveRiskLevel(p.predicted_gas),
        }));
      }
    } catch (err) {
      console.log('[TELEMETRY] Latest data fetch failed:', err.message);
    }
  }, []);

  const hydrateTelemetry = useCallback(async () => {
    try {
      const telemetry = await fetchJson('/api/telemetry/latest');
      if (!telemetry) return;

      setData((prev) => ({
        ...prev,
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
        altitude: telemetry.altitude,
        speed: telemetry.speed,
        battery: telemetry.battery,
        signal_strength: telemetry.signal_strength,
        heading: telemetry.heading,
        drone_status: telemetry.mission_status || 'Active',
      }));

      if (telemetry.latitude && telemetry.longitude) {
        setPathHistory((prev) =>
          [...prev, { lat: telemetry.latitude, lng: telemetry.longitude }].slice(-100)
        );
      }
    } catch (err) {
      console.log('[TELEMETRY] Telemetry fetch failed:', err.message);
    }
  }, []);

  const updateEsp32FromTelemetry = useCallback((timestamp = new Date()) => {
    persisted.lastTelemetryAt = timestamp;
    lastReceivedRef.current = timestamp;
    setLastReceivedTimestamp(timestamp);

    setEsp32ConnectionState((prevState) => {
      if (prevState !== 'Connected') {
        console.log('[ESP32] Connected state entered');
      }
      return 'Connected';
    });
  }, []);

  useEffect(() => {
    checkBackendHealth();
    fetchModelStatus();
    fetchBaselines();
    hydrateFromLatest();
    hydrateTelemetry();

    const healthTimer = setInterval(checkBackendHealth, HEALTH_POLL_INTERVAL_MS);
    const modelTimer = setInterval(fetchModelStatus, 30000);
    const telemetryTimer = setInterval(hydrateTelemetry, 15000);

    return () => {
      clearInterval(healthTimer);
      clearInterval(modelTimer);
      clearInterval(telemetryTimer);
    };
  }, [checkBackendHealth, fetchModelStatus, fetchBaselines, hydrateFromLatest, hydrateTelemetry]);

  useEffect(() => {
    const handleConnect = () => {
      const transport = socket.io.engine.transport.name;
      setTransportType(transport);
      setSocketConnected(true);
      setReconnectCount(0);
      console.log(`[SOCKET] Connected using transport: ${transport}`);
      addActivity(`Socket Connected (${transport})`, 'success');
      hydrateFromLatest();
    };

    const handleDisconnect = (reason) => {
      setSocketConnected(false);
      setTransportType('none');
      console.log(`[SOCKET] Disconnected: ${reason}`);
      addActivity(`Socket Disconnected: ${reason}`, 'warning');
    };

    const handleConnectError = (error) => {
      console.log(`[SOCKET] Connection Error: ${error.message}`);
    };

    const handleReconnectAttempt = (attempt) => {
      setReconnectCount(attempt);
      console.log(`[SOCKET] Reconnection attempt #${attempt}`);
    };

    const handleReconnect = () => {
      persisted.totalReconnects += 1;
      const transport = socket.io.engine.transport.name;
      setTransportType(transport);
      setSocketConnected(true);
      setReconnectCount(0);
      console.log(`[SOCKET] Reconnected (total reconnects: ${persisted.totalReconnects})`);
      addActivity('WebSocket Reconnected', 'success');
      hydrateFromLatest();
    };

    const handleSensorUpdate = (sensorData) => {
      console.log('[TELEMETRY] Sensor reading received');

      const now = new Date();
      updateEsp32FromTelemetry(now);

      samplesPerMinuteRef.current.push(now.getTime());
      samplesPerMinuteRef.current = samplesPerMinuteRef.current.filter(
        (t) => now.getTime() - t < 60000
      );
      setSamplesPerMinute(samplesPerMinuteRef.current.length);

      addActivity('Sensor Reading Received', 'info');

      const rawValues = {
        mq2: sensorData.raw_mq2,
        mq5: sensorData.raw_mq5,
        mq9: sensorData.raw_mq9,
        mq135: sensorData.raw_mq135,
        dht_temp: sensorData.temperature,
        pressure: sensorData.pressure,
      };
      const sensorHealthData = deriveSensorHealth(rawValues, sensorBaselines);

      setData((prev) => ({
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
        bme_temp: sensorData.temperature,
        bme_humidity: sensorData.humidity,
        eqs: sensorData.eqs,
        smoke_index: sensorData.smoke_index ?? prev.smoke_index,
        voc_index: sensorData.voc_index ?? prev.voc_index,
        air_quality_index: sensorData.air_quality_index ?? sensorData.eqs ?? prev.air_quality_index,
        hazard_level: sensorData.hazard_level ?? prev.hazard_level,
        pollution_score: sensorData.pollution_score ?? prev.pollution_score,
        sensor_health: sensorHealthData?.health ?? prev.sensor_health,
        sensor_health_pct: sensorHealthData?.pct ?? prev.sensor_health_pct,
      }));

      setSensorHistory((prev) => {
        const ts = new Date(sensorData.timestamp).toLocaleTimeString();
        return {
          timestamps: [...prev.timestamps, ts].slice(-60),
          dht_temp: [...prev.dht_temp, sensorData.temperature].slice(-60),
          dht_humidity: [...prev.dht_humidity, sensorData.humidity].slice(-60),
          mq2: [...prev.mq2, sensorData.normalized_mq2].slice(-60),
          mq5: [...prev.mq5, sensorData.normalized_mq5].slice(-60),
          mq9: [...prev.mq9, sensorData.normalized_mq9].slice(-60),
          mq135: [...prev.mq135, sensorData.normalized_mq135].slice(-60),
        };
      });

      snapshotBuffer.current.push(sensorData);
      if (snapshotBuffer.current.length > 500) snapshotBuffer.current.shift();
    };

    const handlePredictionUpdate = (prediction) => {
      const topPredictions = distributionToTopPredictions(prediction.distribution);
      setData((prev) => ({
        ...prev,
        predicted_gas: prediction.predicted_gas,
        prediction: prediction.predicted_gas,
        confidence: prediction.confidence,
        distribution: prediction.distribution || {},
        top_predictions: topPredictions,
        risk_level: deriveRiskLevel(prediction.predicted_gas),
        predictions_generated: (prev.predictions_generated || 0) + 1,
      }));
      addActivity(
        `Prediction Generated: ${prediction.predicted_gas} (${prediction.confidence}%)`,
        'info'
      );
    };

    const handleAlertUpdate = (alertData) => {
      setAlerts((prev) => [alertData, ...prev].slice(0, 50));
      addActivity(`Alert Triggered: ${alertData.message}`, alertData.severity?.toLowerCase() || 'warning');
    };

    const handleTelemetryUpdate = (telemetry) => {
      setData((prev) => ({
        ...prev,
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
        altitude: telemetry.altitude,
        speed: telemetry.speed,
        battery: telemetry.battery,
        signal_strength: telemetry.signal_strength,
        heading: telemetry.heading,
        drone_status: telemetry.mission_status || 'Active',
      }));

      if (telemetry.latitude && telemetry.longitude) {
        setPathHistory((prev) =>
          [...prev, { lat: telemetry.latitude, lng: telemetry.longitude }].slice(-100)
        );
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect', handleReconnect);
    socket.on('sensor_update', handleSensorUpdate);
    socket.on('prediction_update', handlePredictionUpdate);
    socket.on('alert_update', handleAlertUpdate);
    socket.on('telemetry_update', handleTelemetryUpdate);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect', handleReconnect);
      socket.off('sensor_update', handleSensorUpdate);
      socket.off('prediction_update', handlePredictionUpdate);
      socket.off('alert_update', handleAlertUpdate);
      socket.off('telemetry_update', handleTelemetryUpdate);
    };
  }, [
    addActivity,
    updateEsp32FromTelemetry,
    hydrateFromLatest,
    sensorBaselines,
    systemHealth,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      const lastAt = lastReceivedRef.current || persisted.lastTelemetryAt;
      if (!lastAt) return;

      const timeSinceLastMsg = Date.now() - lastAt.getTime();

      setEsp32ConnectionState((prevState) => {
        if (timeSinceLastMsg > ESP32_OFFLINE_MS) {
          if (prevState !== 'Offline') {
            console.log('[ESP32] Offline state entered');
            addActivity('ESP32 Offline (Timeout > 90s)', 'critical');
          }
          return 'Offline';
        }
        if (timeSinceLastMsg > ESP32_WARNING_MS) {
          if (prevState !== 'Warning') {
            console.log('[ESP32] Warning state entered');
            addActivity('ESP32 Warning (No data > 30s)', 'warning');
          }
          return 'Warning';
        }
        if (prevState !== 'Connected') {
          console.log('[ESP32] Connected state entered');
        }
        return 'Connected';
      });
    }, ESP32_STATE_CHECK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [addActivity]);

  const getExportHistory = useCallback(() => snapshotBuffer.current, []);
  const clearAlerts = useCallback(() => setAlerts([]), []);

  const totalSamples = systemHealth?.total_samples ?? 0;
  const isConnected = backendConnected;
  const esp32Connected =
    esp32ConnectionState === 'Connected' || esp32ConnectionState === 'Warning';
  const socketReconnecting = !socketConnected && backendConnected;
  const hasGps = data.latitude != null && data.longitude != null && data.latitude !== 0;

  const value = useMemo(
    () => ({
      data,
      history: sensorHistory,
      alerts,
      pathHistory,
      sensorHistory,
      isConnected,
      backendConnected,
      socketConnected,
      socketReconnecting,
      reconnectCount,
      totalReconnects: persisted.totalReconnects,
      transportType,
      esp32Connected,
      esp32ConnectionState,
      lastReceivedTimestamp,
      lastHealthCheckResult,
      activityFeed,
      samplesCollected: totalSamples,
      samplesPerMinute,
      totalSamples,
      systemHealth,
      modelStatus,
      sensorBaselines,
      hasGps,
      missionStartTime,
      getExportHistory,
      clearAlerts,
    }),
    [
      data,
      alerts,
      pathHistory,
      sensorHistory,
      isConnected,
      backendConnected,
      socketConnected,
      socketReconnecting,
      reconnectCount,
      transportType,
      esp32Connected,
      esp32ConnectionState,
      lastReceivedTimestamp,
      lastHealthCheckResult,
      activityFeed,
      totalSamples,
      samplesPerMinute,
      systemHealth,
      modelStatus,
      sensorBaselines,
      hasGps,
      missionStartTime,
      getExportHistory,
      clearAlerts,
    ]
  );

  return <DroneDataContext.Provider value={value}>{children}</DroneDataContext.Provider>;
}

export function useDroneData() {
  const ctx = useContext(DroneDataContext);
  if (!ctx) throw new Error('useDroneData must be used within DroneDataProvider');
  return ctx;
}

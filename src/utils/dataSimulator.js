// Realistic drone data simulator matching the E-NOSE JSON schema
// Uses random walk for smooth, natural-looking sensor transitions

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const walk = (v, step, min, max) => clamp(v + (Math.random() - 0.5) * step, min, max);

const GAS_TYPES = [
  'Clean Air', 'Smoke', 'LPG Leak', 'Methane Leak',
  'Vehicle Emissions', 'Industrial Pollution', 'Chemical Hazard', 'Hazardous Environment'
];

const MODELS = ['Random Forest', 'XGBoost', 'SVM', 'Neural Network'];

const HEALTH_STATES = ['healthy', 'healthy', 'healthy', 'healthy', 'calibration_required', 'warning'];

const ALERT_TYPES = [
  { type: 'gas_leak', level: 'critical', message: 'Gas leak detected in sector 4' },
  { type: 'smoke', level: 'warning', message: 'Elevated smoke levels detected' },
  { type: 'low_battery', level: 'warning', message: 'Battery below 20%' },
  { type: 'gps_loss', level: 'critical', message: 'GPS signal lost' },
  { type: 'sensor_failure', level: 'emergency', message: 'MQ-9 sensor fault detected' },
  { type: 'comm_failure', level: 'critical', message: 'Communication link degraded' },
  { type: 'hazardous', level: 'emergency', message: 'Hazardous environment detected' },
  { type: 'info', level: 'information', message: 'Calibration cycle completed' },
  { type: 'info', level: 'information', message: 'AI model updated successfully' },
  { type: 'smoke', level: 'warning', message: 'Smoke index rising in Zone B' },
];

let state = {
  drone_status: 'Online',
  battery: 87,
  battery_voltage: 12.4,
  health: 95,
  signal_strength: 92,
  flight_mode: 'Loiter',
  armed: true,
  gps_lock: true,
  satellites: 14,
  flight_time: 0,

  latitude: 9.5937,
  longitude: 76.5222,
  altitude: 32,
  ground_speed: 5.2,
  air_speed: 6.1,
  distance_home: 120,
  heading: 45,
  roll: 0,
  pitch: 2,
  yaw: 45,

  mq2: 420,
  mq5: 380,
  mq9: 510,
  mq135: 460,

  dht_temp: 29.5,
  dht_humidity: 72,

  bme_temp: 29.3,
  bme_humidity: 71,
  pressure: 1013,

  air_quality_index: 84,
  voc_index: 68,
  hazard_level: 22,
  smoke_index: 35,
  pollution_score: 42,

  prediction: 'Clean Air',
  confidence: 96,
  risk_level: 'Low',
  model: 'Random Forest',
  inference_time: '32ms',

  top_predictions: [
    { gas: 'Clean Air', score: 96 },
    { gas: 'Methane', score: 3 },
    { gas: 'LPG', score: 1 }
  ],

  sensor_health: {
    mq2: 'healthy',
    mq5: 'healthy',
    mq9: 'healthy',
    mq135: 'healthy',
    dht11: 'healthy',
    bme280: 'healthy'
  },

  sensor_health_pct: {
    mq2: 98, mq5: 97, mq9: 95, mq135: 96, dht11: 99, bme280: 98
  },

  waypoint_current: 3,
  waypoint_total: 8,
  mission_progress: 37.5,
  return_home: false,
  comm_status: 'Stable',
  flight_time_remaining: 1200,

  samples_collected: 0,
  predictions_generated: 0,
  area_surveyed: 0,
  distance_covered: 0,
};

let pathHistory = [{ lat: 9.5937, lng: 76.5222 }];
let tickCount = 0;

export function generateData() {
  tickCount++;

  // Drone telemetry
  state.battery = walk(state.battery, 0.3, 15, 100);
  state.battery_voltage = 10.5 + (state.battery / 100) * 2.1;
  state.health = walk(state.health, 0.5, 70, 100);
  state.signal_strength = walk(state.signal_strength, 1, 60, 100);
  state.satellites = clamp(Math.round(walk(state.satellites, 0.5, 8, 18)), 8, 18);
  state.flight_time += 2;

  // Position
  state.latitude = walk(state.latitude, 0.0001, 9.58, 9.61);
  state.longitude = walk(state.longitude, 0.0001, 76.51, 76.54);
  state.altitude = walk(state.altitude, 0.5, 10, 80);
  state.ground_speed = walk(state.ground_speed, 0.3, 0, 15);
  state.air_speed = state.ground_speed + walk(0.8, 0.2, 0.2, 2);
  state.heading = walk(state.heading, 3, 0, 360);
  state.roll = walk(state.roll, 1.5, -15, 15);
  state.pitch = walk(state.pitch, 1, -10, 10);
  state.yaw = state.heading;
  state.distance_home = walk(state.distance_home, 3, 20, 500);

  pathHistory.push({ lat: state.latitude, lng: state.longitude });
  if (pathHistory.length > 200) pathHistory.shift();

  // Gas sensors
  state.mq2 = walk(state.mq2, 15, 100, 900);
  state.mq5 = walk(state.mq5, 12, 80, 800);
  state.mq9 = walk(state.mq9, 18, 100, 950);
  state.mq135 = walk(state.mq135, 14, 100, 850);

  // Environmental sensors
  state.dht_temp = walk(state.dht_temp, 0.3, 18, 42);
  state.dht_humidity = walk(state.dht_humidity, 0.5, 30, 95);
  state.bme_temp = walk(state.bme_temp, 0.2, 18, 42);
  state.bme_humidity = walk(state.bme_humidity, 0.4, 30, 95);
  state.pressure = walk(state.pressure, 0.5, 990, 1030);

  // Indices
  state.air_quality_index = clamp(Math.round(walk(state.air_quality_index, 3, 0, 100)), 0, 100);
  state.voc_index = clamp(Math.round(walk(state.voc_index, 2, 0, 100)), 0, 100);
  state.hazard_level = clamp(Math.round(walk(state.hazard_level, 2, 0, 100)), 0, 100);
  state.smoke_index = clamp(Math.round(walk(state.smoke_index, 2.5, 0, 100)), 0, 100);
  state.pollution_score = clamp(Math.round(walk(state.pollution_score, 2, 0, 100)), 0, 100);

  // AI predictions (update less frequently)
  if (tickCount % 5 === 0) {
    const primary = Math.random() > 0.7
      ? GAS_TYPES[Math.floor(Math.random() * GAS_TYPES.length)]
      : state.prediction;
    const conf = clamp(Math.round(walk(state.confidence, 3, 60, 99)), 60, 99);
    const remaining = 100 - conf;
    const second = clamp(Math.round(remaining * 0.7), 0, remaining);
    const third = remaining - second;
    const others = GAS_TYPES.filter(g => g !== primary);

    state.prediction = primary;
    state.confidence = conf;
    state.top_predictions = [
      { gas: primary, score: conf },
      { gas: others[Math.floor(Math.random() * others.length)], score: second },
      { gas: others[Math.floor(Math.random() * others.length)], score: third }
    ];
    state.model = MODELS[Math.floor(Math.random() * MODELS.length)];
    state.inference_time = `${Math.round(20 + Math.random() * 40)}ms`;
    state.risk_level = state.hazard_level > 70 ? 'Critical' : state.hazard_level > 45 ? 'High' : state.hazard_level > 20 ? 'Medium' : 'Low';
    state.predictions_generated++;
  }

  // Sensor health (occasional changes)
  if (tickCount % 20 === 0) {
    const sensors = ['mq2', 'mq5', 'mq9', 'mq135', 'dht11', 'bme280'];
    sensors.forEach(s => {
      state.sensor_health[s] = HEALTH_STATES[Math.floor(Math.random() * HEALTH_STATES.length)];
      state.sensor_health_pct[s] = clamp(walk(state.sensor_health_pct[s], 2, 70, 100), 70, 100);
    });
  }

  // Mission
  state.mission_progress = clamp(state.mission_progress + 0.15, 0, 100);
  state.waypoint_current = Math.min(Math.floor(state.mission_progress / 12.5) + 1, state.waypoint_total);
  state.flight_time_remaining = Math.max(0, state.flight_time_remaining - 2);
  state.samples_collected += Math.random() > 0.7 ? 1 : 0;
  state.area_surveyed = walk(state.area_surveyed + 0.5, 0.1, 0, 9999);
  state.distance_covered += state.ground_speed * 0.002;

  return { ...state };
}

export function getPathHistory() {
  return [...pathHistory];
}

export function generateAlert() {
  if (Math.random() > 0.85) {
    const alert = ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)];
    return {
      id: Date.now() + Math.random(),
      ...alert,
      timestamp: new Date().toISOString()
    };
  }
  return null;
}

export function getInitialData() {
  return { ...state };
}

export function exportSensorSnapshot(data) {
  return {
    timestamp: new Date().toISOString(),
    latitude: data.latitude?.toFixed(6),
    longitude: data.longitude?.toFixed(6),
    altitude: data.altitude?.toFixed(1),
    battery: data.battery?.toFixed(1),
    mq2: data.mq2?.toFixed(0),
    mq5: data.mq5?.toFixed(0),
    mq9: data.mq9?.toFixed(0),
    mq135: data.mq135?.toFixed(0),
    dht_temp: data.dht_temp?.toFixed(1),
    dht_humidity: data.dht_humidity?.toFixed(1),
    bme_temp: data.bme_temp?.toFixed(1),
    bme_humidity: data.bme_humidity?.toFixed(1),
    pressure: data.pressure?.toFixed(1),
    air_quality_index: data.air_quality_index,
    voc_index: data.voc_index,
    hazard_level: data.hazard_level,
    smoke_index: data.smoke_index,
    pollution_score: data.pollution_score,
    prediction: data.prediction,
    confidence: data.confidence,
    risk_level: data.risk_level,
    model: data.model,
  };
}

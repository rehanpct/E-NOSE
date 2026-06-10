// Export utilities for CSV and PDF generation

export function exportToCSV(data, filename = 'enose_data.csv') {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
  const csvRows = [headers.join(',')];

  data.forEach(row => {
    const values = headers.map(h => {
      const val = row[h];
      if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
      return val ?? '';
    });
    csvRows.push(values.join(','));
  });

  downloadFile(csvRows.join('\n'), filename, 'text/csv');
}

export function exportSensorSnapshot(currentData) {
  const timestamp = new Date().toISOString();
  const row = {
    timestamp,
    drone_status: currentData.drone_status,
    battery: Math.round(currentData.battery),
    health: Math.round(currentData.health),
    latitude: currentData.latitude?.toFixed(6),
    longitude: currentData.longitude?.toFixed(6),
    altitude: currentData.altitude?.toFixed(1),
    mq2: Math.round(currentData.mq2),
    mq5: Math.round(currentData.mq5),
    mq9: Math.round(currentData.mq9),
    mq135: Math.round(currentData.mq135),
    dht_temp: currentData.dht_temp?.toFixed(1),
    dht_humidity: currentData.dht_humidity?.toFixed(1),
    bme_temp: currentData.bme_temp?.toFixed(1),
    bme_humidity: currentData.bme_humidity?.toFixed(1),
    pressure: currentData.pressure?.toFixed(1),
    air_quality_index: currentData.air_quality_index,
    voc_index: currentData.voc_index,
    hazard_level: currentData.hazard_level,
    prediction: currentData.prediction,
    confidence: currentData.confidence,
    model: currentData.model,
  };
  return row;
}

export function exportHistoryToCSV(history, filename = 'enose_history.csv') {
  if (!history || history.length === 0) return;
  exportToCSV(history, filename);
}

export function generateMissionReport(data, alerts) {
  const now = new Date().toLocaleString();
  const report = `
===============================================
   E-NOSE MISSION REPORT
   AI Drone-Based Environmental Monitoring System
===============================================

Generated: ${now}

--- DRONE STATUS ---
Status: ${data.drone_status}
Battery: ${Math.round(data.battery)}%
Health Score: ${Math.round(data.health)}%
Flight Time: ${formatTime(data.flight_time)}
Signal Strength: ${Math.round(data.signal_strength)}%

--- LOCATION ---
Latitude: ${data.latitude?.toFixed(6)}
Longitude: ${data.longitude?.toFixed(6)}
Altitude: ${data.altitude?.toFixed(1)}m
Distance from Home: ${data.distance_home?.toFixed(0)}m

--- SENSOR READINGS ---
MQ-2: ${Math.round(data.mq2)} ppm
MQ-5: ${Math.round(data.mq5)} ppm
MQ-9: ${Math.round(data.mq9)} ppm
MQ-135: ${Math.round(data.mq135)} ppm
DHT11 Temp: ${data.dht_temp?.toFixed(1)}°C
DHT11 Humidity: ${data.dht_humidity?.toFixed(1)}%
BME280 Temp: ${data.bme_temp?.toFixed(1)}°C
BME280 Humidity: ${data.bme_humidity?.toFixed(1)}%
Pressure: ${data.pressure?.toFixed(1)} hPa

--- AI ANALYSIS ---
Prediction: ${data.prediction}
Confidence: ${data.confidence}%
Model: ${data.model}
Risk Level: ${data.risk_level}
Inference Time: ${data.inference_time}

--- INDICES ---
Air Quality Index: ${data.air_quality_index}
VOC Index: ${data.voc_index}
Smoke Index: ${data.smoke_index}
Hazard Level: ${data.hazard_level}
Pollution Score: ${data.pollution_score}

--- MISSION STATS ---
Samples Collected: ${data.samples_collected}
Predictions Generated: ${data.predictions_generated}
Area Surveyed: ${data.area_surveyed?.toFixed(1)} m²
Distance Covered: ${data.distance_covered?.toFixed(1)} km
Mission Progress: ${data.mission_progress?.toFixed(1)}%

--- RECENT ALERTS (${alerts?.length || 0}) ---
${(alerts || []).slice(0, 20).map(a =>
  `[${a.level?.toUpperCase()}] ${a.message} - ${new Date(a.timestamp).toLocaleTimeString()}`
).join('\n')}

===============================================
   END OF REPORT
===============================================
`;

  downloadFile(report, `enose_mission_report_${Date.now()}.txt`, 'text/plain');
}

export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

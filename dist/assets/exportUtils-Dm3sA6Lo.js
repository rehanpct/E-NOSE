function M(e,o="enose_data.csv"){if(!e||e.length===0)return;const r=Object.keys(e[0]).filter(n=>typeof e[0][n]!="object"),i=[r.join(",")];e.forEach(n=>{const t=r.map(c=>{const s=n[c];return typeof s=="string"&&s.includes(",")?`"${s}"`:s??""});i.push(t.join(","))}),x(i.join(`
`),o,"text/csv")}function v(e,o){var n,t,c,s,l,$,u,d,p,S,h,_;const i=`
===============================================
   E-NOSE MISSION REPORT
   AI Drone-Based Environmental Monitoring System
===============================================

Generated: ${new Date().toLocaleString()}

--- DRONE STATUS ---
Status: ${e.drone_status}
Battery: ${Math.round(e.battery)}%
Health Score: ${Math.round(e.health)}%
Flight Time: ${f(e.flight_time)}
Signal Strength: ${Math.round(e.signal_strength)}%

--- LOCATION ---
Latitude: ${(n=e.latitude)==null?void 0:n.toFixed(6)}
Longitude: ${(t=e.longitude)==null?void 0:t.toFixed(6)}
Altitude: ${(c=e.altitude)==null?void 0:c.toFixed(1)}m
Distance from Home: ${(s=e.distance_home)==null?void 0:s.toFixed(0)}m

--- SENSOR READINGS ---
MQ-2: ${Math.round(e.mq2)} ppm
MQ-5: ${Math.round(e.mq5)} ppm
MQ-9: ${Math.round(e.mq9)} ppm
MQ-135: ${Math.round(e.mq135)} ppm
DHT11 Temp: ${(l=e.dht_temp)==null?void 0:l.toFixed(1)}°C
DHT11 Humidity: ${($=e.dht_humidity)==null?void 0:$.toFixed(1)}%
BME280 Temp: ${(u=e.bme_temp)==null?void 0:u.toFixed(1)}°C
BME280 Humidity: ${(d=e.bme_humidity)==null?void 0:d.toFixed(1)}%
Pressure: ${(p=e.pressure)==null?void 0:p.toFixed(1)} hPa

--- AI ANALYSIS ---
Prediction: ${e.prediction}
Confidence: ${e.confidence}%
Model: ${e.model}
Risk Level: ${e.risk_level}
Inference Time: ${e.inference_time}

--- INDICES ---
Air Quality Index: ${e.air_quality_index}
VOC Index: ${e.voc_index}
Smoke Index: ${e.smoke_index}
Hazard Level: ${e.hazard_level}
Pollution Score: ${e.pollution_score}

--- MISSION STATS ---
Samples Collected: ${e.samples_collected}
Predictions Generated: ${e.predictions_generated}
Area Surveyed: ${(S=e.area_surveyed)==null?void 0:S.toFixed(1)} m²
Distance Covered: ${(h=e.distance_covered)==null?void 0:h.toFixed(1)} km
Mission Progress: ${(_=e.mission_progress)==null?void 0:_.toFixed(1)}%

--- RECENT ALERTS (${(o==null?void 0:o.length)||0}) ---
${(o||[]).slice(0,20).map(m=>{var g;return`[${(g=m.level)==null?void 0:g.toUpperCase()}] ${m.message} - ${new Date(m.timestamp).toLocaleTimeString()}`}).join(`
`)}

===============================================
   END OF REPORT
===============================================
`;x(i,`enose_mission_report_${Date.now()}.txt`,"text/plain")}function x(e,o,r){const i=new Blob([e],{type:r}),n=URL.createObjectURL(i),t=document.createElement("a");t.href=n,t.download=o,document.body.appendChild(t),t.click(),document.body.removeChild(t),URL.revokeObjectURL(n)}function f(e){const o=Math.floor(e/3600),r=Math.floor(e%3600/60),i=Math.floor(e%60);return`${o.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}:${i.toString().padStart(2,"0")}`}export{M as e,f,v as g};

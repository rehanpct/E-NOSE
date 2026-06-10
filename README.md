# E-NOSE AI Drone Monitoring Platform

This project is a complete real-time monitoring platform for an AI-powered Electronic Nose (E-NOSE) drone. It consists of a React frontend, a Flask Socket.IO backend, PostgreSQL for persistence, and ESP32 C++ firmware.

## Architecture

1. **ESP32 Node:** Reads MQ and DHT sensors and sends JSON payloads via HTTP POST to the backend.
2. **Flask Backend:** Receives data, saves it to PostgreSQL, runs an ML Random Forest inference for gas classification, checks against thresholds for alerts, and emits everything via Socket.IO.
3. **React Frontend:** Connects via Socket.IO to display live sensor charts, ML predictions, drone telemetry, system health, and alerts instantly.

## Deployment Instructions

### 1. Docker Deployment (Recommended)
This requires Docker and Docker Compose installed.

```bash
# Start all services (Frontend, Backend, Postgres, pgAdmin)
docker-compose up --build -d
```
- Frontend will be available at `http://localhost:5173`
- Backend API will be available at `http://localhost:5000`
- pgAdmin will be available at `http://localhost:5050` (Login: `admin@enose.local` / `admin`)

### 2. Local Deployment (Without Docker)

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env to set your PostgreSQL credentials
python app.py
```

#### Frontend Setup
```bash
npm install
npm run dev
```

### 3. ESP32 Firmware
1. Open `esp32/esp32_firmware/esp32_firmware.ino` in the Arduino IDE.
2. Install `WiFi.h` and `HTTPClient.h` libraries (usually pre-installed with ESP32 board manager).
3. Change `YOUR_WIFI_SSID` and `YOUR_WIFI_PASSWORD`.
4. Change `serverName` to point to the IP address where the Flask server is running (e.g. `http://192.168.1.100:5000/api/sensor-data`).
5. Flash to your ESP32.

## API Documentation

### POST `/api/sensor-data`
Sends a new reading to the platform.
**Body:**
```json
{
  "mq2": 2107,
  "mq5": 1130,
  "mq9": 782,
  "mq135": 418,
  "temperature": 29,
  "humidity": 38
}
```

### GET `/api/system-health`
Returns the operational status of the backend, database, and ML model.

### GET `/api/latest`
Returns the latest sensor reading and prediction stored in the database.

## WebSocket Events

The frontend automatically subscribes to these Socket.IO events from the backend:
- `sensor_update`: Fired when a new reading is processed.
- `prediction_update`: Fired with the new ML class and confidence.
- `alert_update`: Fired when a sensor exceeds warning/critical thresholds.

#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Adjust to the IP address of your running Flask server
const char* serverName = "http://192.168.1.100:5000/api/sensor-data";

// Sensor Pins
const int MQ2_PIN = 34;
const int MQ5_PIN = 35;
const int MQ9_PIN = 32;
const int MQ135_PIN = 33;

// For DHT11, you would normally use Adafruit DHT library
// #include <DHT.h>
// #define DHTPIN 4
// #define DHTTYPE DHT11
// DHT dht(DHTPIN, DHTTYPE);

unsigned long lastTime = 0;
// Set timer to 2 seconds (2000 ms)
unsigned long timerDelay = 2000;

void setup() {
  Serial.begin(115200);
  
  // dht.begin();
  
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Send HTTP POST request every 2 seconds
  if ((millis() - lastTime) > timerDelay) {
    // Check WiFi connection status
    if(WiFi.status() == WL_CONNECTED){
      HTTPClient http;
      
      http.begin(serverName);
      http.addHeader("Content-Type", "application/json");
      
      // Read sensors
      int mq2_val = analogRead(MQ2_PIN);
      int mq5_val = analogRead(MQ5_PIN);
      int mq9_val = analogRead(MQ9_PIN);
      int mq135_val = analogRead(MQ135_PIN);
      
      // float t = dht.readTemperature();
      // float h = dht.readHumidity();
      float t = 29.0; // Simulated for now
      float h = 38.0; // Simulated for now
      
      // Prepare JSON payload
      String jsonPayload = "{\"mq2\":" + String(mq2_val) + 
                           ",\"mq5\":" + String(mq5_val) + 
                           ",\"mq9\":" + String(mq9_val) + 
                           ",\"mq135\":" + String(mq135_val) + 
                           ",\"temperature\":" + String(t) + 
                           ",\"humidity\":" + String(h) + "}";
                           
      Serial.print("Sending Data: ");
      Serial.println(jsonPayload);
      
      // Send HTTP POST request
      int httpResponseCode = http.POST(jsonPayload);
      
      if (httpResponseCode > 0) {
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
        String payload = http.getString();
        Serial.println(payload);
      }
      else {
        Serial.print("Error code: ");
        Serial.println(httpResponseCode);
      }
      
      http.end();
    }
    else {
      Serial.println("WiFi Disconnected. Attempting to reconnect...");
      WiFi.reconnect();
    }
    lastTime = millis();
  }
}

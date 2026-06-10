#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT11

// MQ Sensor Pins
#define MQ2_PIN   34
#define MQ5_PIN   35
#define MQ9_PIN   32
#define MQ135_PIN 33

// =============================
// CHANGE THESE VALUES
// =============================
const char* ssid = "Rehan_iphone";
const char* password = "Netvenotharalo";

// Example:
// http://192.168.1.5:5000/api/sensor-data
const char* serverUrl = "http://172.20.10.3:5000/api/sensor-data";
// =============================

DHT dht(DHTPIN, DHTTYPE);

void setup() {
Serial.begin(115200);

dht.begin();

delay(2000);

Serial.println();
Serial.println("Connecting to WiFi...");

WiFi.begin(ssid, password);

while (WiFi.status() != WL_CONNECTED) {
delay(500);
Serial.print(".");
}

Serial.println();
Serial.println("WiFi Connected");
Serial.print("ESP32 IP: ");
Serial.println(WiFi.localIP());

Serial.println("Starting sensor transmission...");
}

void loop() {

int mq2 = analogRead(MQ2_PIN);
int mq5 = analogRead(MQ5_PIN);
int mq9 = analogRead(MQ9_PIN);
int mq135 = analogRead(MQ135_PIN);

float temp = dht.readTemperature();
float hum = dht.readHumidity();

if (isnan(temp) || isnan(hum)) {
temp = -1;
hum = -1;
}

Serial.println("----------------------------------");
Serial.print("MQ2: ");
Serial.println(mq2);

Serial.print("MQ5: ");
Serial.println(mq5);

Serial.print("MQ9: ");
Serial.println(mq9);

Serial.print("MQ135: ");
Serial.println(mq135);

Serial.print("Temperature: ");
Serial.println(temp);

Serial.print("Humidity: ");
Serial.println(hum);

if (WiFi.status() == WL_CONNECTED) {


HTTPClient http;

http.begin(serverUrl);

http.addHeader("Content-Type", "application/json");

String payload = "{";
payload += "\"mq2\":" + String(mq2) + ",";
payload += "\"mq5\":" + String(mq5) + ",";
payload += "\"mq9\":" + String(mq9) + ",";
payload += "\"mq135\":" + String(mq135) + ",";
payload += "\"temperature\":" + String(temp, 2) + ",";
payload += "\"humidity\":" + String(hum, 2);
payload += "}";

Serial.println("Sending JSON:");
Serial.println(payload);

int responseCode = http.POST(payload);

Serial.print("Server Response Code: ");
Serial.println(responseCode);

if (responseCode > 0) {
  String response = http.getString();

  Serial.println("Server Response:");
  Serial.println(response);
} else {
  Serial.println("Failed to send data");
}

http.end();


} else {

Serial.println("WiFi Disconnected");

WiFi.reconnect();


}

delay(1000);
}

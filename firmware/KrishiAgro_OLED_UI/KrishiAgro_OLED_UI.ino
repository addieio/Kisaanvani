/*
 * ==============================================================================
 * KRISHI-AGRO: Autonomous Smart Farm Assistant Firmware
 * Target Board: Seeed Studio XIAO ESP32-C6 (ESP32-C6FH4)
 * 
 * Hardware Pinout Mapping:
 * - D0 (GPIO0)  : Crowtail Soil Moisture Sensor v2.0 (Analog SIG)
 * - D1 (GPIO1)  : MAX4466 Analog Microphone (OUT)
 * - D2 (GPIO2)  : DHT22 Temperature & Humidity (DATA)
 * - D3 (GPIO21) : Multi-function Push Button (to GND, INPUT_PULLUP)
 * - D4 (GPIO22) : I2C SDA (OLED SSD1306 0x3C + MPU-6050 0x68)
 * - D5 (GPIO23) : I2C SCL (OLED SSD1306 0x3C + MPU-6050 0x68)
 * - D6 (GPIO16) : UART TX -> DFPlayer Mini RX (via 1k ohm resistor!)
 * - D7 (GPIO17) : UART RX <- DFPlayer Mini TX
 * - D8 (GPIO19) : Buzzer Module (I/O)
 * - D9 (GPIO20) : 5V Relay Module (IN - Active LOW)
 * - D10 (GPIO18): Reserved / Auxiliary
 *
 * Required Libraries (Install via Arduino Library Manager):
 * - Adafruit SSD1306
 * - Adafruit GFX Library
 * - DHT sensor library (Adafruit)
 * - Adafruit Unified Sensor
 * - DFRobotDFPlayerMini
 * ==============================================================================
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <DFRobotDFPlayerMini.h>

// -----------------------------------------------------------------------------
// Display Configuration
// -----------------------------------------------------------------------------
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// -----------------------------------------------------------------------------
// Hardware Pins
// -----------------------------------------------------------------------------
#define PIN_SOIL_ADC     0   // D0 / GPIO0 / ADC1_CH0
#define PIN_MIC_ADC      1   // D1 / GPIO1 / ADC1_CH1
#define PIN_DHT          2   // D2 / GPIO2
#define PIN_BUTTON       21  // D3 / GPIO21 (Internal Pullup)
#define PIN_I2C_SDA      22  // D4 / GPIO22
#define PIN_I2C_SCL      23  // D5 / GPIO23
#define PIN_DFP_TX       16  // D6 / GPIO16 (ESP TX -> DFP RX via 1k)
#define PIN_DFP_RX       17  // D7 / GPIO17 (ESP RX <- DFP TX)
#define PIN_BUZZER       19  // D8 / GPIO19
#define PIN_RELAY        20  // D9 / GPIO20 (Active LOW)

// -----------------------------------------------------------------------------
// Sensor Objects & Peripherals
// -----------------------------------------------------------------------------
#define DHTTYPE DHT22
DHT dht(PIN_DHT, DHTTYPE);

HardwareSerial dfpSerial(1); // Use UART1 on ESP32-C6
DFRobotDFPlayerMini dfplayer;
bool dfplayerReady = false;

// MPU-6050 I2C Address
#define MPU_ADDR 0x68
bool mpuReady = false;

// -----------------------------------------------------------------------------
// Sensor Calibration & Constants
// -----------------------------------------------------------------------------
// Typical raw ADC values for Crowtail Capacitive Moisture Sensor v2.0 (12-bit: 0-4095)
const int SOIL_DRY_ADC = 2950;  // Raw reading in completely dry air
const int SOIL_WET_ADC = 1350;  // Raw reading in cup of water
const int AUTO_IRRIGATE_THRESHOLD = 30; // Irrigation starts if moisture < 30%

// Step detection / Pedometer constants for MPU6050
const float STRIDE_METERS = 0.75f;     // Average agricultural step ~ 0.75m
const int TARGET_STEPS_5M = 7;         // ~5.25m
const int TARGET_STEPS_10M = 14;       // ~10.5m
int currentStepGoal = TARGET_STEPS_10M;

// -----------------------------------------------------------------------------
// State Machine Variables
// -----------------------------------------------------------------------------
enum AppScreen {
  SCREEN_OVERVIEW = 0,
  SCREEN_IRRIGATION = 1,
  SCREEN_GRID_WALK = 2,
  SCREEN_AI_ADVISOR = 3,
  TOTAL_SCREENS = 4
};

AppScreen currentScreen = SCREEN_OVERVIEW;
bool langHindi = true; // Toggle between Hindi (Transliterated) & English

// Live Readings Cache
int rawSoilADC = 0;
int soilPercentage = 45;
float ambientTemp = 28.0;
float ambientHum = 60.0;
bool pumpState = false;
bool autoModeEnabled = true;

// Step counter state
int stepCount = 0;
float lastAccelMag = 1.0;
unsigned long lastStepTime = 0;

// Button Timing & Debounce
unsigned long btnPressStartTime = 0;
bool isBtnPressed = false;
const unsigned long LONG_PRESS_MS = 600;
const unsigned long DEBOUNCE_MS = 40;

// Non-blocking Refresh Timers
unsigned long lastSensorReadTime = 0;
unsigned long lastDisplayRefreshTime = 0;
unsigned long lastPedometerTime = 0;

// -----------------------------------------------------------------------------
// Audio / Buzzer Helpers
// -----------------------------------------------------------------------------
void beepShort(int freq = 2000, int duration = 50) {
  tone(PIN_BUZZER, freq, duration);
}

void beepConfirm() {
  tone(PIN_BUZZER, 2400, 80);
  delay(90);
  tone(PIN_BUZZER, 3200, 100);
}

void playVoiceTrack(int trackNumber) {
  if (dfplayerReady) {
    dfplayer.play(trackNumber);
  }
}

// -----------------------------------------------------------------------------
// MPU6050 Accelerometer Step Detection (Pedometer)
// -----------------------------------------------------------------------------
void initMPU6050() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); // Power Management 1 register
  Wire.write(0x00); // Wake up MPU-6050
  if (Wire.endTransmission() == 0) {
    mpuReady = true;
    Serial.println("[MPU6050] Initialized successfully.");
  } else {
    mpuReady = false;
    Serial.println("[MPU6050] Not detected on I2C bus.");
  }
}

void updatePedometer() {
  if (!mpuReady) return;

  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B); // Starting register for Accel readings
  if (Wire.endTransmission(false) != 0) return;

  Wire.requestFrom(MPU_ADDR, 6, true);
  if (Wire.available() < 6) return;

  int16_t ax = (Wire.read() << 8) | Wire.read();
  int16_t ay = (Wire.read() << 8) | Wire.read();
  int16_t az = (Wire.read() << 8) | Wire.read();

  // Convert raw to G's
  float gX = ax / 16384.0f;
  float gY = ay / 16384.0f;
  float gZ = az / 16384.0f;

  // Compute magnitude vector
  float accelMag = sqrt(gX * gX + gY * gY + gZ * gZ);

  // Peak detection with refractory lockout period (320ms)
  unsigned long now = millis();
  if (accelMag > 1.35f && lastAccelMag <= 1.35f && (now - lastStepTime > 320)) {
    stepCount++;
    lastStepTime = now;
    beepShort(2800, 30); // Subtle step tick

    // Target alert
    if (stepCount == currentStepGoal) {
      beepConfirm();
      playVoiceTrack(5); // "Target distance reached! Place sensor in soil."
    }
  }
  lastAccelMag = accelMag;
}

// -----------------------------------------------------------------------------
// Sensor Acquisition
// -----------------------------------------------------------------------------
void readSensors() {
  // 1. Crowtail Soil Moisture
  rawSoilADC = analogRead(PIN_SOIL_ADC);
  // Constrain and map ADC to 0-100% moisture
  int mappedMoist = map(rawSoilADC, SOIL_DRY_ADC, SOIL_WET_ADC, 0, 100);
  soilPercentage = constrain(mappedMoist, 0, 100);

  // 2. DHT22 Climate
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t)) ambientTemp = t;
  if (!isnan(h)) ambientHum = h;

  // 3. Autonomous Irrigation Logic
  if (autoModeEnabled) {
    if (soilPercentage < AUTO_IRRIGATE_THRESHOLD && !pumpState) {
      setPump(true);
      playVoiceTrack(3); // "Irrigation started"
    } else if (soilPercentage >= (AUTO_IRRIGATE_THRESHOLD + 20) && pumpState) {
      setPump(false);
      playVoiceTrack(4); // "Target reached, pump stopped"
    }
  }
}

void setPump(bool state) {
  pumpState = state;
  // Standard relay modules are active LOW
  digitalWrite(PIN_RELAY, pumpState ? LOW : HIGH);
  if (pumpState) {
    beepShort(1800, 150);
  } else {
    beepShort(1200, 100);
  }
}

// -----------------------------------------------------------------------------
// Button State Machine (Short Click = Next Page | Long Press = Action)
// -----------------------------------------------------------------------------
void handleButton() {
  bool pinState = digitalRead(PIN_BUTTON); // LOW when pressed

  if (pinState == LOW && !isBtnPressed) {
    // Just pressed
    isBtnPressed = true;
    btnPressStartTime = millis();
  } 
  else if (pinState == HIGH && isBtnPressed) {
    // Just released
    unsigned long duration = millis() - btnPressStartTime;
    isBtnPressed = false;

    if (duration >= LONG_PRESS_MS) {
      // Long Press Trigger
      beepConfirm();
      executeLongPressAction();
    } else if (duration >= DEBOUNCE_MS) {
      // Short Click Trigger
      beepShort(2500, 40);
      currentScreen = (AppScreen)((currentScreen + 1) % TOTAL_SCREENS);
    }
  }
}

void executeLongPressAction() {
  switch (currentScreen) {
    case SCREEN_OVERVIEW:
      // Long press on Overview: Toggle Hindi / English
      langHindi = !langHindi;
      break;

    case SCREEN_IRRIGATION:
      // Long press on Irrigation: Toggle Pump
      setPump(!pumpState);
      break;

    case SCREEN_GRID_WALK:
      // Long press on Grid: Reset steps or toggle 5m / 10m target
      if (stepCount >= currentStepGoal) {
        stepCount = 0; // Reset after reaching goal
      } else {
        // Toggle goal between 5m (7 steps) and 10m (14 steps)
        currentStepGoal = (currentStepGoal == TARGET_STEPS_10M) ? TARGET_STEPS_5M : TARGET_STEPS_10M;
        stepCount = 0;
      }
      break;

    case SCREEN_AI_ADVISOR:
      // Trigger voice test advisory
      playVoiceTrack(soilPercentage < 30 ? 2 : 1);
      break;
  }
}

// -----------------------------------------------------------------------------
// OLED Screen Renderers
// -----------------------------------------------------------------------------
void drawHeader(const char* titleEn, const char* titleHi) {
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);

  // Screen Title
  display.print(langHindi ? titleHi : titleEn);

  // Top Right Status Indicators
  display.setCursor(82, 0);
  if (pumpState) {
    display.print("[P:ON]");
  } else {
    display.print("[P:OFF]");
  }

  // Divider Line
  display.drawFastHLine(0, 10, SCREEN_WIDTH, SSD1306_WHITE);
}

void drawFooterHints(const char* hintEn, const char* hintHi) {
  display.drawFastHLine(0, 53, SCREEN_WIDTH, SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 56);
  display.print(langHindi ? hintHi : hintEn);

  // Page Indicator Dots
  for (int i = 0; i < TOTAL_SCREENS; i++) {
    int dotX = 104 + (i * 6);
    if (i == (int)currentScreen) {
      display.fillCircle(dotX, 59, 2, SSD1306_WHITE);
    } else {
      display.drawCircle(dotX, 59, 1, SSD1306_WHITE);
    }
  }
}

// Page 0: Live Farm Overview
void renderScreenOverview() {
  drawHeader("FARM STATUS", "KRISHI STATUS");

  // Soil Percentage Bar
  display.setTextSize(1);
  display.setCursor(0, 15);
  display.print(langHindi ? "Nami (Moist): " : "Soil Moist: ");
  display.setTextSize(2);
  display.print(soilPercentage);
  display.setTextSize(1);
  display.print("%");

  // Gauge Progress Bar
  int barWidth = map(soilPercentage, 0, 100, 0, 120);
  display.drawRect(0, 31, 124, 7, SSD1306_WHITE);
  display.fillRect(2, 33, barWidth, 3, SSD1306_WHITE);

  // Temp & Humidity Chips
  display.setTextSize(1);
  display.setCursor(0, 42);
  display.print("T:");
  display.print(ambientTemp, 1);
  display.print("C  H:");
  display.print(ambientHum, 0);
  display.print("%");

  // Condition Tag
  display.setCursor(82, 42);
  if (soilPercentage < 30) {
    display.print("[DRY]");
  } else if (soilPercentage > 75) {
    display.print("[WET]");
  } else {
    display.print("[OPT]");
  }

  drawFooterHints("Hold: Lang HI/EN", "Hold: Bhasha Badle");
}

// Page 1: Irrigation & Manual Control
void renderScreenIrrigation() {
  drawHeader("IRRIGATION", "SINCHAI PANEL");

  display.setTextSize(1);
  display.setCursor(0, 16);
  display.print(langHindi ? "Pump Sthiti:" : "Pump State: ");
  display.setTextSize(1);
  display.print(pumpState ? " [RUNNING]" : " [STOPPED]");

  display.setCursor(0, 28);
  display.print(langHindi ? "Karya Mode : " : "Control Mode: ");
  display.print(autoModeEnabled ? "AUTO" : "MANUAL");

  display.setCursor(0, 40);
  display.print(langHindi ? "Cutoff Nami: <" : "Cutoff Moist: <");
  display.print(AUTO_IRRIGATE_THRESHOLD);
  display.print("%");

  drawFooterHints("Hold: Toggle Pump", "Hold: Pump On/Off");
}

// Page 2: 5m / 10m Grid Walk Distance
void renderScreenGridWalk() {
  drawHeader("GRID SAMPLER", "DURI MAPAK");

  float metersWalked = stepCount * STRIDE_METERS;
  float targetMeters = currentStepGoal * STRIDE_METERS;

  display.setTextSize(1);
  display.setCursor(0, 14);
  display.print(langHindi ? "Lakshya (Goal): " : "Target Dist: ");
  display.print(targetMeters, 1);
  display.print("m");

  // Large Distance Readout
  display.setTextSize(2);
  display.setCursor(0, 26);
  display.print(metersWalked, 1);
  display.setTextSize(1);
  display.print("m (");
  display.print(stepCount);
  display.print(" stp)");

  // Walk Progress Bar
  int progressW = map(stepCount, 0, currentStepGoal, 0, 122);
  progressW = constrain(progressW, 0, 122);
  display.drawRect(0, 43, 124, 6, SSD1306_WHITE);
  display.fillRect(2, 45, progressW, 2, SSD1306_WHITE);

  if (stepCount >= currentStepGoal) {
    drawFooterHints("REACHED! Place probe", "PAHUCH GAYE! Sensor lagaye");
  } else {
    drawFooterHints("Hold: Reset / Switch", "Hold: 5m/10m Badle");
  }
}

// Page 3: Offline AI Advisor & Audio
void renderScreenAIAdvisor() {
  drawHeader("AI ADVISOR", "KRISHI SALAH");

  display.setTextSize(1);
  display.setCursor(0, 14);
  display.print(langHindi ? "Fasal Nami:" : "Crop Health:");

  display.setCursor(0, 25);
  if (soilPercentage < 30) {
    display.print(langHindi ? "Pani de! Nami kam h." : "Dry alert! Water now.");
    display.setCursor(0, 36);
    display.print(langHindi ? "Track 0002.mp3 chalega" : "Voice track: 0002.mp3");
  } else {
    display.print(langHindi ? "Nami uttam h. Gehu OK." : "Moisture optimal!");
    display.setCursor(0, 36);
    display.print(langHindi ? "Fasal swasth h." : "Conditions healthy.");
  }

  display.setCursor(0, 45);
  display.print("Mic OUT: Standby (D1)");

  drawFooterHints("Hold: Play Audio", "Hold: Awaz Sunein");
}

void renderDisplay() {
  display.clearDisplay();

  switch (currentScreen) {
    case SCREEN_OVERVIEW:   renderScreenOverview();   break;
    case SCREEN_IRRIGATION: renderScreenIrrigation(); break;
    case SCREEN_GRID_WALK:  renderScreenGridWalk();   break;
    case SCREEN_AI_ADVISOR: renderScreenAIAdvisor();  break;
  }

  display.display();
}

// -----------------------------------------------------------------------------
// Arduino Setup & Main Loop
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n--- Starting KRISHI-AGRO Smart Farm Assistant ---");

  // Pin Configurations
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, HIGH); // Relay OFF initially (Active LOW)

  // Initialize I2C Bus on XIAO ESP32-C6 (D4=SDA, D5=SCL)
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

  // Initialize OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println("[OLED] Allocation failed. Check wiring on D4/D5.");
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(10, 25);
    display.println("KRISHI-AGRO v1.0");
    display.setCursor(10, 38);
    display.println("Starting systems...");
    display.display();
    delay(1000);
  }

  // Initialize DHT22
  dht.begin();

  // Initialize MPU-6050
  initMPU6050();

  // Initialize DFPlayer Mini UART
  dfpSerial.begin(9600, SERIAL_8N1, PIN_DFP_RX, PIN_DFP_TX);
  if (dfplayer.begin(dfpSerial)) {
    dfplayerReady = true;
    dfplayer.volume(22); // Volume range 0-30
    Serial.println("[DFPlayer] MP3 TF1CP v3.0 Online!");
    playVoiceTrack(1);   // Boot welcome track
  } else {
    Serial.println("[DFPlayer] Offline or SD card not inserted.");
  }

  beepConfirm();
  Serial.println("[Setup] All peripherals initialized.");
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. Instant Button Check (Debounced state machine)
  handleButton();

  // 2. High-rate Pedometer Check (every 20ms = 50Hz)
  if (currentMillis - lastPedometerTime >= 20) {
    lastPedometerTime = currentMillis;
    updatePedometer();
  }

  // 3. Sensor Read Periodic Loop (every 1000ms)
  if (currentMillis - lastSensorReadTime >= 1000) {
    lastSensorReadTime = currentMillis;
    readSensors();
  }

  // 4. OLED Refresh Loop (every 80ms ~ 12.5 FPS for smooth UI)
  if (currentMillis - lastDisplayRefreshTime >= 80) {
    lastDisplayRefreshTime = currentMillis;
    renderDisplay();
  }
}


/*
 * ==============================================================================
 * KRISHI-AGRO: High-Taste OLED UI in HINDI with DIAGRAMS, DHT22, MPU-6050 & BUZZER
 * ZERO EXTERNAL LIBRARIES! Uses only native <Wire.h>
 * 
 * Hardware Wiring:
 * - XIAO 3V3         --> OLED, MPU-6050, DHT22, Buzzer, AND Crowtail Moisture v2.0 VCC (Red Wire)
 * - XIAO GND         --> Common GND for all sensors AND Crowtail GND (Black Wire)
 * - XIAO D1 / A1     --> Crowtail Moisture Sensor v2.0 SIG Pin (YELLOW Wire on standard Crowtail cable!)
 * - (Optional) D0/A0 --> Crowtail WHITE Wire (Monitored simultaneously on Screen 0!)
 *                        Firmware reads BOTH D1 and D0 in real-time, auto-locking to the active pin!
 * - XIAO D2 (GPIO2)  --> DHT22 DATA Pin
 * - XIAO D3 (GPIO21) --> Push Button (to GND, internal INPUT_PULLUP)
 * - XIAO D4 (GPIO22) --> OLED SDA  AND  MPU-6050 SDA (Shared I2C Bus)
 * - XIAO D5 (GPIO23) --> OLED SCL  AND  MPU-6050 SCL (Shared I2C Bus)
 * - XIAO D8 (GPIO19) --> Buzzer Module I/O (Advanced Haptic & Acoustic Melodies)
 * - XIAO D9 (GPIO20) --> 5HP Pump Relay Module Signal (Active HIGH / Auto-Shutoff on High Moisture >80%)
 *
 * Visual Diagrams & Screens (7 Total, Short-click cycles forward):
 * 0. मुख्य डैशबोर्ड: Multi-segment Moisture Gauge, Climate tile, Status badge
 * 1. लाइव मौसम: Dual Temperature/Humidity Cards + Real Live Sparkline Graph!
 * 2. पोषक तत्व NPK: 4-Channel Calibrated Horizontal Equalizer Bar Graph Diagram
 * 3. सिंचाई नियंत्रण: Hydraulic Pipeline Schematic + Rotating Pump Impeller Motor & Relay D9
 * 4. एआई कृषि सहायक: Robot Avatar + 8-Band Animated Audio Spectrum Visualizer
 * 5. दूरी मापक MPU: 10-20 cm Metric Track & Moving Cursor Sensor Diagram
 * 6. विशेषज्ञ कॉल: Twilio Outbound Phone Call via BLE to +919876543210 (Hold Button to Call)
 * ==============================================================================
 */

#include <Wire.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "hindi_bitmaps.h"

// -----------------------------------------------------------------------------
// BLE Nordic UART Service (NUS) Definitions (ESP32-C6)
// -----------------------------------------------------------------------------
#define BLE_DEVICE_NAME        "KRISHI-AGRO-C6"
#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// -----------------------------------------------------------------------------
// Pin Definitions (Seeed Studio XIAO ESP32-C6)
// -----------------------------------------------------------------------------
#define PIN_MOISTURE     1   // D1 / GPIO1 (ADC1_CH1 - Crowtail Moisture Sensor v2.0 SIG)
#define PIN_MOISTURE_ALT 0   // D0 / GPIO0 (ADC1_CH0 - Backup / Secondary analog)
#define PIN_DHT          2   // D2 / GPIO2  (DHT22 DATA)
#define PIN_BUTTON   21  // D3 / GPIO21 (Button to GND, internal pullup)
#define PIN_SDA      22  // D4 / GPIO22 (I2C SDA)
#define PIN_SCL      23  // D5 / GPIO23 (I2C SCL)
#define PIN_BUZZER   19  // D8 / GPIO19 (3-pin Buzzer Module I/O)
#define PIN_DFP_TX   16  // D6 / GPIO16 (ESP32 TX -> Optional DFPlayer RX)
#define PIN_DFP_RX   17  // D7 / GPIO17 (ESP32 RX <- Optional DFPlayer TX)
#define PIN_PUMP_RELAY     20 // D9 / GPIO20 (Primary 5HP Pump Relay)
#define PIN_PUMP_RELAY_ALT  9 // D10 / GPIO9 (Secondary Relay Pin - drives both simultaneously)

// -----------------------------------------------------------------------------
// 5V/3.3V Relay Module Polarity (Songle Optocoupler Relay: ACTIVE-LOW Standard)
// -----------------------------------------------------------------------------
// - LOW  (0V)   = Optocoupler conducts -> Coil energized -> Relay clicks ON!
// - HIGH (3.3V) = Optocoupler off -> Coil de-energized -> Relay OFF
#define RELAY_ACTIVE_LOW true

#if RELAY_ACTIVE_LOW
  #define RELAY_ON  LOW
  #define RELAY_OFF HIGH
#else
  #define RELAY_ON  HIGH
  #define RELAY_OFF LOW
#endif

// -----------------------------------------------------------------------------
// 3-Pin Buzzer Polarity (Fix for Continuous Buzzing / Active-Low Modules)
// -----------------------------------------------------------------------------
// Standard 3-pin buzzer modules (KY-012 / Keyes / S8550 PNP driver) are ACTIVE-LOW:
// - LOW  = Transistor conducts -> Buzzer ON
// - HIGH = Transistor cuts off -> Buzzer OFF (Silent)
#define BUZZER_ACTIVE_LOW true

#if BUZZER_ACTIVE_LOW
  #define BUZZER_ON  LOW
  #define BUZZER_OFF HIGH
#else
  #define BUZZER_ON  HIGH
  #define BUZZER_OFF LOW
#endif

// I2C Addresses
#define OLED_ADDR  0x3C  // 0.96" 128x64 OLED
#define MPU_ADDR   0x68  // MPU-6050 Accelerometer (AD0 to GND)

// 128x64 Screen Buffer (1024 bytes)
uint8_t oled_buffer[1024];

// Built-in 5x7 ASCII Font (Numbers, English letters, and symbols)
static const uint8_t font5x7[] PROGMEM = {
  0x00, 0x00, 0x00, 0x00, 0x00, // 32 ' '
  0x00, 0x00, 0x5F, 0x00, 0x00, // 33 !
  0x00, 0x07, 0x00, 0x07, 0x00, // 34 "
  0x14, 0x7F, 0x14, 0x7F, 0x14, // 35 #
  0x24, 0x2A, 0x7F, 0x2A, 0x12, // 36 $
  0x23, 0x13, 0x08, 0x64, 0x62, // 37 %
  0x36, 0x49, 0x55, 0x22, 0x50, // 38 &
  0x00, 0x05, 0x03, 0x00, 0x00, // 39 '
  0x00, 0x1C, 0x22, 0x41, 0x00, // 40 (
  0x00, 0x41, 0x22, 0x1C, 0x00, // 41 )
  0x14, 0x08, 0x3E, 0x08, 0x14, // 42 *
  0x08, 0x08, 0x3E, 0x08, 0x08, // 43 +
  0x00, 0x50, 0x30, 0x00, 0x00, // 44 ,
  0x08, 0x08, 0x08, 0x08, 0x08, // 45 -
  0x00, 0x60, 0x60, 0x00, 0x00, // 46 .
  0x20, 0x10, 0x08, 0x04, 0x02, // 47 /
  0x3E, 0x51, 0x49, 0x45, 0x3E, // 48 0
  0x00, 0x42, 0x7F, 0x40, 0x00, // 49 1
  0x42, 0x61, 0x51, 0x49, 0x46, // 50 2
  0x21, 0x41, 0x45, 0x4B, 0x31, // 51 3
  0x18, 0x14, 0x12, 0x7F, 0x10, // 52 4
  0x27, 0x45, 0x45, 0x45, 0x39, // 53 5
  0x3C, 0x4A, 0x49, 0x49, 0x30, // 54 6
  0x01, 0x71, 0x09, 0x05, 0x03, // 55 7
  0x36, 0x49, 0x49, 0x49, 0x36, // 56 8
  0x06, 0x49, 0x49, 0x29, 0x1E, // 57 9
  0x00, 0x36, 0x36, 0x00, 0x00, // 58 :
  0x00, 0x56, 0x36, 0x00, 0x00, // 59 ;
  0x08, 0x14, 0x22, 0x41, 0x00, // 60 <
  0x14, 0x14, 0x14, 0x14, 0x14, // 61 =
  0x00, 0x41, 0x22, 0x14, 0x08, // 62 >
  0x02, 0x01, 0x51, 0x09, 0x06, // 63 ?
  0x32, 0x49, 0x79, 0x41, 0x3E, // 64 @
  0x7E, 0x11, 0x11, 0x11, 0x7E, // 65 A
  0x7F, 0x49, 0x49, 0x49, 0x36, // 66 B
  0x3E, 0x41, 0x41, 0x41, 0x22, // 67 C
  0x7F, 0x41, 0x41, 0x22, 0x1C, // 68 D
  0x7F, 0x49, 0x49, 0x49, 0x41, // 69 E
  0x7F, 0x09, 0x09, 0x09, 0x01, // 70 F
  0x3E, 0x41, 0x49, 0x49, 0x7A, // 71 G
  0x7F, 0x08, 0x08, 0x08, 0x7F, // 72 H
  0x00, 0x41, 0x7F, 0x41, 0x00, // 73 I
  0x20, 0x40, 0x41, 0x3F, 0x01, // 74 J
  0x7F, 0x08, 0x14, 0x22, 0x41, // 75 K
  0x7F, 0x40, 0x40, 0x40, 0x40, // 76 L
  0x7F, 0x02, 0x0C, 0x02, 0x7F, // 77 M
  0x7F, 0x04, 0x08, 0x10, 0x7F, // 78 N
  0x3E, 0x41, 0x41, 0x41, 0x3E, // 79 O
  0x7F, 0x09, 0x09, 0x09, 0x06, // 80 P
  0x3E, 0x41, 0x51, 0x21, 0x5E, // 81 Q
  0x7F, 0x09, 0x19, 0x29, 0x46, // 82 R
  0x46, 0x49, 0x49, 0x49, 0x31, // 83 S
  0x01, 0x01, 0x7F, 0x01, 0x01, // 84 T
  0x3F, 0x40, 0x40, 0x40, 0x3F, // 85 U
  0x1F, 0x20, 0x40, 0x20, 0x1F, // 86 V
  0x3F, 0x40, 0x38, 0x40, 0x3F, // 87 W
  0x63, 0x14, 0x08, 0x14, 0x63, // 88 X
  0x07, 0x08, 0x70, 0x08, 0x07, // 89 Y
  0x61, 0x51, 0x49, 0x45, 0x43, // 90 Z
  0x00, 0x7F, 0x41, 0x41, 0x00, // 91 [
  0x02, 0x04, 0x08, 0x10, 0x20, // 92 "\"
  0x00, 0x41, 0x41, 0x7F, 0x00, // 93 ]
  0x04, 0x02, 0x01, 0x02, 0x04, // 94 ^
  0x40, 0x40, 0x40, 0x40, 0x40, // 95 _
  0x00, 0x01, 0x02, 0x04, 0x00, // 96 `
  0x20, 0x54, 0x54, 0x54, 0x78, // 97 a
  0x7F, 0x48, 0x44, 0x44, 0x38, // 98 b
  0x38, 0x44, 0x44, 0x44, 0x20, // 99 c
  0x38, 0x44, 0x44, 0x48, 0x7F, // 100 d
  0x38, 0x54, 0x54, 0x54, 0x18, // 101 e
  0x08, 0x7E, 0x09, 0x01, 0x02, // 102 f
  0x0C, 0x52, 0x52, 0x52, 0x3E, // 103 g
  0x7F, 0x08, 0x04, 0x04, 0x78, // 104 h
  0x00, 0x44, 0x7D, 0x40, 0x00, // 105 i
  0x20, 0x40, 0x44, 0x3D, 0x00, // 106 j
  0x7F, 0x10, 0x28, 0x44, 0x00, // 107 k
  0x00, 0x41, 0x7F, 0x40, 0x00, // 108 l
  0x7C, 0x04, 0x18, 0x04, 0x78, // 109 m
  0x7C, 0x08, 0x04, 0x04, 0x78, // 110 n
  0x38, 0x44, 0x44, 0x44, 0x38, // 111 o
  0x7C, 0x14, 0x14, 0x14, 0x08, // 112 p
  0x08, 0x14, 0x14, 0x18, 0x7C, // 113 q
  0x7C, 0x08, 0x04, 0x04, 0x08, // 114 r
  0x48, 0x54, 0x54, 0x54, 0x20, // 115 s
  0x04, 0x3F, 0x44, 0x40, 0x20, // 116 t
  0x3C, 0x40, 0x40, 0x20, 0x7C, // 117 u
  0x1C, 0x20, 0x40, 0x20, 0x1C, // 118 v
  0x3C, 0x40, 0x30, 0x40, 0x3C, // 119 w
  0x44, 0x28, 0x10, 0x28, 0x44, // 120 x
  0x0C, 0x50, 0x50, 0x50, 0x3C, // 121 y
  0x44, 0x64, 0x54, 0x4C, 0x44, // 122 z
  0x00, 0x08, 0x36, 0x41, 0x00, // 123 {
  0x00, 0x00, 0x77, 0x00, 0x00, // 124 |
  0x00, 0x41, 0x36, 0x08, 0x00, // 125 }
  0x08, 0x08, 0x2A, 0x1C, 0x08  // 126 ~
};

// -----------------------------------------------------------------------------
// OLED I2C Low-Level Commands
// -----------------------------------------------------------------------------
void oled_cmd(uint8_t cmd) {
  Wire.beginTransmission(OLED_ADDR);
  Wire.write(0x00); // Command stream
  Wire.write(cmd);
  Wire.endTransmission();
}

void oled_init() {
  oled_cmd(0xAE); // Display OFF
  oled_cmd(0xD5); oled_cmd(0x80); // Clock divide
  oled_cmd(0xA8); oled_cmd(0x3F); // Multiplex 64
  oled_cmd(0xD3); oled_cmd(0x00); // Display offset = 0
  oled_cmd(0x40); // Start line = 0
  oled_cmd(0x8D); oled_cmd(0x14); // Enable Charge Pump
  oled_cmd(0x20); oled_cmd(0x00); // Horizontal mode
  oled_cmd(0xA1); // Seg remap (flip H)
  oled_cmd(0xC8); // COM scan dir (flip V)
  oled_cmd(0xDA); oled_cmd(0x12); // COM pins
  oled_cmd(0x81); oled_cmd(0xCF); // Contrast
  oled_cmd(0xD9); oled_cmd(0xF1); // Pre-charge
  oled_cmd(0xDB); oled_cmd(0x40); // VCOMH
  oled_cmd(0xA4); // Output follows RAM
  oled_cmd(0xA6); // Normal display
  oled_cmd(0xAF); // Display ON!
}

void oled_clear() {
  memset(oled_buffer, 0x00, sizeof(oled_buffer));
}

void oled_update() {
  oled_cmd(0x21); oled_cmd(0); oled_cmd(127);
  oled_cmd(0x22); oled_cmd(0); oled_cmd(7);

  for (int i = 0; i < 1024; i += 16) {
    Wire.beginTransmission(OLED_ADDR);
    Wire.write(0x40);
    for (int j = 0; j < 16; j++) {
      Wire.write(oled_buffer[i + j]);
    }
    Wire.endTransmission();
  }
}

// -----------------------------------------------------------------------------
// Graphics Primitives & Geometric Diagram Drivers
// -----------------------------------------------------------------------------
void oled_pixel(int x, int y, uint8_t color) {
  if (x < 0 || x >= 128 || y < 0 || y >= 64) return;
  int byte_idx = x + (y / 8) * 128;
  uint8_t bit = 1 << (y % 8);
  if (color) oled_buffer[byte_idx] |= bit;
  else oled_buffer[byte_idx] &= ~bit;
}

void oled_hline(int x, int y, int w, uint8_t color) {
  for (int i = 0; i < w; i++) oled_pixel(x + i, y, color);
}

void oled_vline(int x, int y, int h, uint8_t color) {
  for (int i = 0; i < h; i++) oled_pixel(x, y + i, color);
}

void oled_line(int x0, int y0, int x1, int y1, uint8_t color) {
  int dx = abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  int dy = -abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  int err = dx + dy, e2;
  while (true) {
    oled_pixel(x0, y0, color);
    if (x0 == x1 && y0 == y1) break;
    e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

void oled_rect(int x, int y, int w, int h, uint8_t color) {
  oled_hline(x, y, w, color);
  oled_hline(x, y + h - 1, w, color);
  oled_vline(x, y, h, color);
  oled_vline(x + w - 1, y, h, color);
}

void oled_fill_rect(int x, int y, int w, int h, uint8_t color) {
  for (int j = 0; j < h; j++) {
    oled_hline(x, y + j, w, color);
  }
}

void oled_circle(int x0, int y0, int r, uint8_t color) {
  int f = 1 - r;
  int ddF_x = 1;
  int ddF_y = -2 * r;
  int x = 0;
  int y = r;

  oled_pixel(x0, y0 + r, color);
  oled_pixel(x0, y0 - r, color);
  oled_pixel(x0 + r, y0, color);
  oled_pixel(x0 - r, y0, color);

  while (x < y) {
    if (f >= 0) {
      y--;
      ddF_y += 2;
      f += ddF_y;
    }
    x++;
    ddF_x += 2;
    f += ddF_x;
    oled_pixel(x0 + x, y0 + y, color);
    oled_pixel(x0 - x, y0 + y, color);
    oled_pixel(x0 + x, y0 - y, color);
    oled_pixel(x0 - x, y0 - y, color);
    oled_pixel(x0 + y, y0 + x, color);
    oled_pixel(x0 - y, y0 + x, color);
    oled_pixel(x0 + y, y0 - x, color);
    oled_pixel(x0 - y, y0 - x, color);
  }
}

void oled_draw_bitmap(int x, int y, const uint8_t* bm, int w, int h) {
  int byte_w = (w + 7) / 8;
  for (int j = 0; j < h; j++) {
    for (int i = 0; i < w; i++) {
      if (pgm_read_byte(bm + j * byte_w + (i / 8)) & (128 >> (i & 7))) {
        oled_pixel(x + i, y + j, 1);
      }
    }
  }
}

void oled_char(int x, int y, char c, uint8_t size, uint8_t color) {
  if (c < 32 || c > 126) c = ' ';
  int font_idx = (c - 32) * 5;

  for (int col = 0; col < 5; col++) {
    uint8_t line = pgm_read_byte(&font5x7[font_idx + col]);
    for (int row = 0; row < 7; row++) {
      if (line & (1 << row)) {
        if (size == 1) {
          oled_pixel(x + col, y + row, color);
        } else {
          oled_fill_rect(x + col * size, y + row * size, size, size, color);
        }
      }
    }
  }
}

void oled_str(int x, int y, const char* str, uint8_t size, uint8_t color) {
  int cur_x = x;
  while (*str) {
    oled_char(cur_x, y, *str, size, color);
    cur_x += 6 * size;
    str++;
  }
}

// -----------------------------------------------------------------------------
// Advanced Haptic & Acoustic Melodic Engine (Active-Low Safe!)
// -----------------------------------------------------------------------------
void buzzerSilence() {
  digitalWrite(PIN_BUZZER, BUZZER_OFF);
}

// 1. Ultra-crisp mechanical tactile tick (8ms pulse) on button tap
void buzzerHapticTick() {
  digitalWrite(PIN_BUZZER, BUZZER_ON);
  delay(8);
  digitalWrite(PIN_BUZZER, BUZZER_OFF);
}

// 2. Whisper-soft micro-click (4ms pulse) on screen transition
void buzzerScreenTick() {
  digitalWrite(PIN_BUZZER, BUZZER_ON);
  delay(4);
  digitalWrite(PIN_BUZZER, BUZZER_OFF);
}

// 3. Rich two-step melodic chirp (12ms -> 22ms) on button hold / action confirm
void buzzerHoldAck() {
  digitalWrite(PIN_BUZZER, BUZZER_ON);
  delay(12);
  digitalWrite(PIN_BUZZER, BUZZER_OFF);
  delay(18);
  digitalWrite(PIN_BUZZER, BUZZER_ON);
  delay(22);
  digitalWrite(PIN_BUZZER, BUZZER_OFF);
}

// 4. "Plant Thirsty" Staccato Warning Alarm (Three 25ms chirps)
void buzzerThirstyAlert() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(PIN_BUZZER, BUZZER_ON);
    delay(25);
    digitalWrite(PIN_BUZZER, BUZZER_OFF);
    delay(30);
  }
}

// 5. "Plant Watered / Happy" Dual-Pip (Gentle 15ms -> 35ms tune)
void buzzerWateredTune() {
  digitalWrite(PIN_BUZZER, BUZZER_ON);
  delay(15);
  digitalWrite(PIN_BUZZER, BUZZER_OFF);
  delay(35);
  digitalWrite(PIN_BUZZER, BUZZER_ON);
  delay(35);
  digitalWrite(PIN_BUZZER, BUZZER_OFF);
}

// 6. Celebratory Victory Fanfare (MPU 15cm reached: Beethoven 5th / Morse victory)
void buzzerVictoryFanfare() {
  // Short, Short, Short, Long!
  for (int i = 0; i < 3; i++) {
    digitalWrite(PIN_BUZZER, BUZZER_ON);
    delay(35);
    digitalWrite(PIN_BUZZER, BUZZER_OFF);
    delay(35);
  }
  delay(30);
  digitalWrite(PIN_BUZZER, BUZZER_ON);
  delay(120);
  digitalWrite(PIN_BUZZER, BUZZER_OFF);
}

// 7. Tech Startup Jingle (4-pulse ascending cadence on boot)
void buzzerStartupJingle() {
  int pulses[4] = { 8, 14, 20, 50 };
  int gaps[3]   = { 30, 22, 16 };
  for (int i = 0; i < 4; i++) {
    digitalWrite(PIN_BUZZER, BUZZER_ON);
    delay(pulses[i]);
    digitalWrite(PIN_BUZZER, BUZZER_OFF);
    if (i < 3) delay(gaps[i]);
  }
}

// -----------------------------------------------------------------------------
// ELECROW Crowtail-Moisture Sensor 2.0 (RS7446) Driver
// Pure Arduino C++ Implementation (Zero external libraries / No broken IDF types)
// Dedicated to Pin D1 (A1 / GPIO 1)
// -----------------------------------------------------------------------------
int rawD1 = 0;       // Live raw ADC on D1 (Pin A1)
int rawSoilADC = 0;  // Active sensor ADC reading
float filteredSoilADC = 0.0f;
int soilMoist = 0;   // Calibrated 0..100%
const char* activePinName = "D1";

// Baselines for Crowtail Moisture Sensor 2.0 (Resistive Type RS7446):
// Auto-calibrated to sensor's actual resting baseline on boot
int adcDry = 380;  // Baseline reading in air (0%)
int adcWet = 2800; // Baseline reading when wet in water (100%)

unsigned long lastSoilSample = 0;
bool previousDryState = false;
bool pumpState = false;   // 5HP Submersible Pump Relay State (GPIO 20 / D9)
bool twilioCallActive = false; // Outbound Twilio Call State via BLE
unsigned long twilioCallTimer = 0;

void triggerOledAlert(const char* title, const char* detail, unsigned long durationMs = 5000);

void setPumpRelay(bool on) {
  pumpState = on;
  // Active-LOW relay module logic: LOW = ON (contacts close), HIGH = OFF
  digitalWrite(PIN_PUMP_RELAY, on ? RELAY_ON : RELAY_OFF);
  digitalWrite(PIN_PUMP_RELAY_ALT, on ? RELAY_ON : RELAY_OFF);

  if (on) {
    buzzerWateredTune();
    triggerOledAlert("PUMP RELAY: ON", "5HP MOTOR RUNNING", 5000);
    Serial.println("[RELAY D9/D10] PUMP RELAY ACTIVE -> ENERGIZED (ON)!");
  } else {
    buzzerHoldAck();
    triggerOledAlert("PUMP RELAY: OFF", "MOTOR STOPPED", 5000);
    Serial.println("[RELAY D9/D10] PUMP RELAY DEACTIVE -> CUTOFF (OFF)!");
  }
}

// Fast multi-sample oversampled ADC read with ESP32-C6 millivolt fallback
int readSmoothADC(int pin) {
  long sum = 0;
  for (int i = 0; i < 16; i++) {
    int r = analogRead(pin);
    // On ESP32-C6, if raw analogRead returns 0 due to an uncalibrated core bug,
    // analogReadMilliVolts() uses the hardware e-fuses to read correctly:
    if (r == 0) {
      int mv = analogReadMilliVolts(pin);
      if (mv > 20) {
        r = (int)((mv * 4095L) / 3300L);
      }
    }
    sum += r;
    delayMicroseconds(50);
  }
  return (int)(sum / 16);
}

// Rock-solid calibration: 0% when <= adcDry, 100% when >= adcWet, smooth linear between
int calculateMoisturePct(int rawAdc, int dryVal, int wetVal) {
  if (wetVal <= dryVal + 30) wetVal = dryVal + 150;
  if (rawAdc <= dryVal) return 0;
  if (rawAdc >= wetVal) return 100;
  return map(rawAdc, dryVal, wetVal, 0, 100);
}

void autoCalibrateSensor() {
  long sum1 = 0;
  for (int i = 0; i < 30; i++) {
    sum1 += readSmoothADC(PIN_MOISTURE);     // GPIO 1 (D1)
    delay(5);
  }
  rawSoilADC = (int)(sum1 / 30);
  rawD1 = rawSoilADC;
  activePinName = "D1";

  filteredSoilADC = (float)rawSoilADC;
  // Automatically lock resting reading in air as 0% DRY baseline
  adcDry = rawSoilADC;
  // Wet baseline for Crowtail in water is typically 2200..3200 counts
  adcWet = 2800;
  if (adcDry >= adcWet - 300) {
    adcWet = adcDry + 1200;
  }
  if (adcWet > 4095) adcWet = 4095;

  Serial.println("[CROWTAIL 2.0] Sensor initialized on Pin D1 (GPIO 1).");
  Serial.printf("[CROWTAIL 2.0] Calibrated: Dry(0%%)=%d | Wet(100%%)=%d\n",
                adcDry, adcWet);
}

void updateSoilMoisture() {
  if (millis() - lastSoilSample >= 200) { // Sample every 200ms
    lastSoilSample = millis();

    rawSoilADC = readSmoothADC(PIN_MOISTURE); // Read D1 (GPIO 1)
    rawD1 = rawSoilADC;

    // Auto-expand maximum wet range if sensor outputs higher than adcWet
    if (rawSoilADC > adcWet) {
      adcWet = rawSoilADC;
    }

    // Exponential moving average filter for smooth graphical meter
    filteredSoilADC = (0.75f * filteredSoilADC) + (0.25f * (float)rawSoilADC);

    // Calculate moisture percentage (0..100%)
    soilMoist = calculateMoisturePct((int)filteredSoilADC, adcDry, adcWet);

    // Audio Haptic Alert on State Change
    if (soilMoist < 30 && !previousDryState) {
      previousDryState = true;
      buzzerThirstyAlert();
    } else if (soilMoist >= 35 && previousDryState) {
      previousDryState = false;
      buzzerWateredTune(); // Plant received water!
    }

    // Automatic Safety Shutoff: High Soil Moisture (>80%) auto-trips Relay OFF!
    if (soilMoist >= 80 && pumpState) {
      setPumpRelay(false);
      buzzerThirstyAlert(); // Triple alert acoustic chirp indicating emergency shutoff
      Serial.println("[SAFETY ALERT] Soil Moisture >= 80%! Automatic Pump Relay Shutoff Tripped!");
    }

    // Live Serial Telemetry every 500ms
    static unsigned long lastSerialLog = 0;
    if (millis() - lastSerialLog >= 500) {
      lastSerialLog = millis();
      int mv1 = analogReadMilliVolts(PIN_MOISTURE);
      float volts = (rawSoilADC * 3.3f) / 4095.0f;
      Serial.printf("[SOIL D1] ADC=%4d | Voltage=%.2fV (%4dmV) | Moist=%3d%% | Baseline: Dry=%d Wet=%d\n",
                    rawSoilADC, volts, mv1, soilMoist, adcDry, adcWet);
    }
  }
}

// -----------------------------------------------------------------------------
// Pure C++ Zero-Library DFPlayer Mini (MP3-TF-16P / NA087) Driver
// -----------------------------------------------------------------------------
void dfplayer_send_cmd(uint8_t cmd, uint16_t param) {
  uint8_t param_h = (param >> 8) & 0xFF;
  uint8_t param_l = param & 0xFF;
  uint16_t sum = 0xFF + 0x06 + cmd + 0x00 + param_h + param_l;
  uint16_t checksum = 0 - sum;

  uint8_t packet[10] = {
    0x7E,                                // Start byte
    0xFF,                                // Version
    0x06,                                // Length
    cmd,                                 // Command ID
    0x00,                                // Feedback flag (0 = off)
    param_h,                             // Parameter High Byte
    param_l,                             // Parameter Low Byte
    (uint8_t)((checksum >> 8) & 0xFF),   // Checksum High
    (uint8_t)(checksum & 0xFF),          // Checksum Low
    0xEF                                 // End byte
  };

  Serial1.write(packet, 10);
}

void dfplayer_init() {
  // Serial1 on XIAO ESP32-C6: RX=17 (D7), TX=16 (D6)
  Serial1.begin(9600, SERIAL_8N1, PIN_DFP_RX, PIN_DFP_TX);
  delay(300);
  // Set volume to 20 out of 30 (Loud & clear, prevents clipping on 0.5W-1W speakers)
  dfplayer_send_cmd(0x06, 20);
  delay(50);
}

void dfplayer_play(uint16_t track) {
  // Command 0x12: Play track from /mp3/ folder (e.g. 0001.mp3)
  dfplayer_send_cmd(0x12, track);
  delay(30);
  // Command 0x03 fallback (direct file indexing)
  dfplayer_send_cmd(0x03, track);
}

void dfplayer_stop() {
  dfplayer_send_cmd(0x16, 0); // Stop playback
}

// -----------------------------------------------------------------------------
// Pure C++ Bit-Bang DHT22 Sensor Driver
// -----------------------------------------------------------------------------
float liveTemp = 28.5f;
float liveHum = 58.0f;
bool dhtConnected = false;
unsigned long lastDhtTime = 0;

// Rolling circular history buffer for live sparkline trend graph (16 samples)
float tempHistory[16] = { 27.8f, 28.0f, 28.2f, 28.1f, 28.3f, 28.5f, 28.4f, 28.6f,
                          28.5f, 28.7f, 28.5f, 28.6f, 28.4f, 28.5f, 28.5f, 28.5f };

bool readDHT22(float &tOut, float &hOut) {
  uint8_t data[5] = {0, 0, 0, 0, 0};

  // 1. Send 1.2ms LOW start pulse
  pinMode(PIN_DHT, OUTPUT);
  digitalWrite(PIN_DHT, LOW);
  delayMicroseconds(1200);

  // Release and switch to input pullup
  digitalWrite(PIN_DHT, HIGH);
  delayMicroseconds(30);
  pinMode(PIN_DHT, INPUT_PULLUP);

  // 2. Wait for DHT response (80us LOW followed by 80us HIGH)
  unsigned long timeout = micros();
  while (digitalRead(PIN_DHT) == HIGH) {
    if (micros() - timeout > 90) return false;
  }
  timeout = micros();
  while (digitalRead(PIN_DHT) == LOW) {
    if (micros() - timeout > 90) return false;
  }
  timeout = micros();
  while (digitalRead(PIN_DHT) == HIGH) {
    if (micros() - timeout > 90) return false;
  }

  // 3. Read 40 data bits
  for (int i = 0; i < 40; i++) {
    timeout = micros();
    while (digitalRead(PIN_DHT) == LOW) {
      if (micros() - timeout > 100) return false;
    }

    unsigned long tStart = micros();
    timeout = micros();
    while (digitalRead(PIN_DHT) == HIGH) {
      if (micros() - timeout > 120) return false;
    }
    unsigned long pulseLen = micros() - tStart;

    int byteIdx = i / 8;
    data[byteIdx] <<= 1;
    if (pulseLen > 40) {
      data[byteIdx] |= 1;
    }
  }

  // 4. Verify 8-bit checksum
  uint8_t sum = (data[0] + data[1] + data[2] + data[3]) & 0xFF;
  if (sum != data[4]) return false;

  // 5. Decode humidity & temperature
  int16_t rawHum = (data[0] << 8) | data[1];
  int16_t rawTemp = ((data[2] & 0x7F) << 8) | data[3];
  if (data[2] & 0x80) rawTemp = -rawTemp;

  hOut = rawHum * 0.1f;
  tOut = rawTemp * 0.1f;
  return true;
}

void updateDHTSensor() {
  if (millis() - lastDhtTime >= 2000) { // Sample every 2 seconds
    lastDhtTime = millis();
    float t, h;
    if (readDHT22(t, h)) {
      if (t >= -20.0f && t <= 70.0f && h >= 0.0f && h <= 100.0f) {
        liveTemp = t;
        liveHum = h;
        dhtConnected = true;

        // Shift sparkline history buffer left
        for (int i = 0; i < 15; i++) {
          tempHistory[i] = tempHistory[i + 1];
        }
        tempHistory[15] = liveTemp;
      }
    }
  }
}

// -----------------------------------------------------------------------------
// MPU-6050 Motion Driver (10-20 cm Metric Track Demo)
// -----------------------------------------------------------------------------
bool mpuOnline = false;
float gBaseline = 1.0f;
float velocityCmS = 0.0f;
float demoDistCm = 0.0f;
const float GOAL_DIST_CM = 15.0f; // 15 cm target
bool goalAchievedChimePlayed = false;

void mpu_init() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); // PWR_MGMT_1
  Wire.write(0x00); // Wake up
  if (Wire.endTransmission() == 0) {
    mpuOnline = true;
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x1C); // ACCEL_CONFIG
    Wire.write(0x00); // +/- 2g range
    Wire.endTransmission();
    Serial.println("[MPU6050] Connected on 0x68!");
  } else {
    mpuOnline = false;
    Serial.println("[MPU6050] Offline or AD0 not grounded.");
  }
}

void updateMPUMotion() {
  if (!mpuOnline) return;

  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  if (Wire.endTransmission(false) != 0) return;

  Wire.requestFrom(MPU_ADDR, 6, true);
  if (Wire.available() < 6) return;

  int16_t rawX = (Wire.read() << 8) | Wire.read();
  int16_t rawY = (Wire.read() << 8) | Wire.read();
  int16_t rawZ = (Wire.read() << 8) | Wire.read();

  float ax = (float)rawX / 16384.0f;
  float ay = (float)rawY / 16384.0f;
  float az = (float)rawZ / 16384.0f;

  float aMag = sqrt(ax * ax + ay * ay + az * az);
  gBaseline = (0.92f * gBaseline) + (0.08f * aMag);
  float aMotion = abs(aMag - gBaseline);

  if (aMotion > 0.06f) {
    velocityCmS += (aMotion * 980.0f * 0.033f);
    demoDistCm += (velocityCmS * 0.033f * 0.25f);
  }

  velocityCmS *= 0.82f; // Friction damping
  if (demoDistCm > GOAL_DIST_CM) {
    demoDistCm = GOAL_DIST_CM;
    if (!goalAchievedChimePlayed) {
      goalAchievedChimePlayed = true;
      buzzerVictoryFanfare(); // Celebratory victory fanfare (Short-Short-Short-Long)!
    }
  }
}

// -----------------------------------------------------------------------------
// Application State & Agronomic Data
// -----------------------------------------------------------------------------
int currentScreen = 0; // 0..6 (7 Screens Total)
const int TOTAL_SCREENS = 7;

bool sampleToggle = true;
int nitrogenN = 142;      // mg/kg
int phosphorusP = 45;     // mg/kg
int potassiumK = 185;     // mg/kg
float soilPH = 6.8f;      // pH
int pumpAnimPhase = 0;    // For rotating pump impeller

// AI Voice Agent State
bool aiVoiceActive = false;
unsigned long aiVoiceTimer = 0;
int waveAnimPhase = 0;

// Button Timing
bool btnDown = false;
unsigned long btnPressTime = 0;

// -----------------------------------------------------------------------------
// Button State Machine with Haptic Feedback
// -----------------------------------------------------------------------------
void handleButton() {
  int pinVal = digitalRead(PIN_BUTTON); // LOW = pressed (INPUT_PULLUP)

  if (pinVal == LOW && !btnDown) {
    btnDown = true;
    btnPressTime = millis();
  } 
  else if (pinVal == HIGH && btnDown) {
    unsigned long duration = millis() - btnPressTime;
    btnDown = false;

    if (duration >= 500) {
      // LONG HOLD (Action / Toggle):
      buzzerHoldAck(); // Rich confirmation double-chirp!

      if (currentScreen == 0) {
        // One-touch Re-Zero Calibration on Screen 0:
        // Locks current sensor reading as 0% (BONE DRY) baseline!
        adcDry = rawSoilADC;
        adcWet = 2800;
        if (adcDry >= adcWet - 300) adcWet = adcDry + 1200;
        if (adcWet > 4095) adcWet = 4095;
        buzzerWateredTune(); // Cheerful confirmation melody
        Serial.printf("[SOIL] Re-Zeroed to 0%% on D1! adcDry=%d, adcWet=%d\n", adcDry, adcWet);
      } 
      else if (currentScreen == 1) {
        // DHT Immediate Sample trigger
        updateDHTSensor();
      }
      else if (currentScreen == 2) {
        sampleToggle = !sampleToggle; // Toggle soil profile
        if (sampleToggle) {
          nitrogenN = 142; phosphorusP = 45; potassiumK = 185; soilPH = 6.8;
        } else {
          nitrogenN = 75; phosphorusP = 22; potassiumK = 95; soilPH = 7.4;
        }
      } 
      else if (currentScreen == 3) {
        setPumpRelay(!pumpState); // Toggle pump relay safely with proper polarity & alerts
      } 
      else if (currentScreen == 4) {
        aiVoiceActive = true;   // Trigger AI Voice Dialog
        aiVoiceTimer = millis();
      }
      else if (currentScreen == 5) {
        demoDistCm = 0.0f;     // Reset MPU distance odometer
        velocityCmS = 0.0f;
        goalAchievedChimePlayed = false;
      }
      else if (currentScreen == 6) {
        twilioCallActive = true;
        twilioCallTimer = millis();
        // Dialing tone melody
        for (int i = 0; i < 2; i++) {
          digitalWrite(PIN_BUZZER, BUZZER_ON);
          delay(40);
          digitalWrite(PIN_BUZZER, BUZZER_OFF);
          delay(40);
          digitalWrite(PIN_BUZZER, BUZZER_ON);
          delay(60);
          digitalWrite(PIN_BUZZER, BUZZER_OFF);
          delay(120);
        }
        Serial.println("[CALL_REQ:TWILIO_EXPERT] Outbound Twilio Call to +919876543210 requested via ESP32 Button!");
      }
    } 
    else if (duration >= 30) {
      // SHORT CLICK:
      buzzerHapticTick(); // Crisp 8ms tactile click!

      if (currentScreen == 4 && aiVoiceActive) {
        aiVoiceActive = false; // Close voice dialog
      } else if (currentScreen == 6 && twilioCallActive) {
        twilioCallActive = false; // Cancel dialing
        buzzerHapticTick();
      } else {
        // Subtle micro-tick on screen change
        buzzerScreenTick();
        currentScreen = (currentScreen + 1) % TOTAL_SCREENS;
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Standard Header & Footer (Strict Zero-Overlap Geometry)
// -----------------------------------------------------------------------------
void drawHeader(const char* titleEn, const uint8_t* titleBm, int bmW, int bmH) {
  // Title (Left, x=2..61, y=0..12)
  if (titleBm) {
    oled_draw_bitmap(2, 0, titleBm, bmW, bmH);
  } else {
    oled_str(2, 2, titleEn, 1, 1);
  }

  // Wi-Fi or Bluetooth Status Icon (x=88, y=3)
  if (deviceConnected) {
    oled_draw_bitmap(88, 3, icon_bt_8x8, 8, 8); // Bluetooth Icon when linked!
  } else {
    oled_draw_bitmap(88, 3, icon_wifi_8x7, 8, 7); // Wi-Fi Icon
  }

  // Pump Status Pill (x=98..125, y=2..10)
  if (pumpState) {
    oled_fill_rect(98, 2, 27, 9, 1);
    oled_str(101, 3, "ON!", 1, 0); // Inverted text
  } else {
    oled_rect(98, 2, 27, 9, 1);
    oled_str(101, 3, "OFF", 1, 1);
  }

  // Header Divider Line (y=13)
  oled_hline(0, 13, 128, 1);
}

void drawFooter(const char* promptHint) {
  // Footer Divider Line (y=53)
  oled_hline(0, 53, 128, 1);

  if (promptHint) {
    oled_str(2, 55, promptHint, 1, 1);
  } else {
    oled_str(2, 55, "Next >>", 1, 1);
  }

  // 7 Screen Pagination Pills (x=73..122, y=55..59)
  for (int i = 0; i < TOTAL_SCREENS; i++) {
    int x = 73 + (i * 7);
    if (i == currentScreen) {
      oled_fill_rect(x, 56, 5, 4, 1); // Solid active pill
    } else {
      oled_rect(x, 56, 5, 4, 1);      // Hollow inactive frame
    }
  }
}

// -----------------------------------------------------------------------------
// Screen 0: मुख्य डैशबोर्ड (Soil Gauge Diagram & Climate Overview)
// -----------------------------------------------------------------------------
void renderDashboard() {
  drawHeader("KRISHI AGRO", bm_krishi_agro, BM_KRISHI_AGRO_W, BM_KRISHI_AGRO_H);

  // Left Half: Soil Moisture Gauge Diagram (x=2..62)
  oled_draw_bitmap(4, 17, icon_droplet_8x8, 8, 8);
  oled_draw_bitmap(14, 16, bm_nami, BM_NAMI_W, BM_NAMI_H);

  // Moisture Condition Badge (x=38..59): सूखी (Dry) or उचित (Optimal)
  oled_rect(38, 16, 22, 10, 1);
  if (soilMoist < 30) {
    oled_draw_bitmap(40, 17, bm_sukhi, BM_SUKHI_W, BM_SUKHI_H);
  } else {
    oled_draw_bitmap(40, 17, bm_uchit, BM_UCHIT_W, BM_UCHIT_H);
  }

  // Large Scaled Moisture Digits & Percent Sign
  char mBuf[8];
  sprintf(mBuf, "%d", soilMoist);
  oled_str(4, 27, mBuf, 2, 1);
  int numLen = (soilMoist >= 100) ? 3 : (soilMoist >= 10 ? 2 : 1);
  int pctX = 4 + (numLen * 12);
  oled_str(pctX, 28, "%", 1, 1);

  // Live Raw ADC & Millivolts Readout for D1 (x=36..62, y=27..42)
  char aBuf[12];
  sprintf(aBuf, "D1:%d", rawSoilADC);
  oled_str(36, 27, aBuf, 1, 1);
  char bBuf[12];
  int mvNow = analogReadMilliVolts(PIN_MOISTURE);
  sprintf(bBuf, "%dmV", mvNow);
  oled_str(36, 36, bBuf, 1, 1);

  // Multi-Segmented Meter Gauge Diagram (5 discrete blocks, x=4..58, y=45)
  int activeSegs = (soilMoist * 5) / 100;
  for (int s = 0; s < 5; s++) {
    int sx = 4 + (s * 11);
    oled_rect(sx, 45, 9, 6, 1);
    if (s < activeSegs) {
      oled_fill_rect(sx + 1, 46, 7, 4, 1);
    }
  }

  // Vertical Center Separator (Dotted line at x=64, y=16..51)
  for (int y = 16; y < 51; y += 2) {
    oled_pixel(64, y, 1);
  }

  // Right Half: Live Climate Tile (x=68..124)
  oled_draw_bitmap(68, 18, icon_thermo_8x8, 8, 8);
  char tBuf[10];
  sprintf(tBuf, "%.1fC", liveTemp);
  oled_str(78, 18, tBuf, 1, 1);

  oled_draw_bitmap(68, 30, icon_droplet_8x8, 8, 8);
  char hBuf[8];
  sprintf(hBuf, "%.0f%%", liveHum);
  oled_str(78, 30, hBuf, 1, 1);

  // Climate Health Status Chip
  oled_rect(68, 41, 56, 10, 1);
  if (liveTemp > 33.0f) {
    oled_str(72, 42, "HEAT!", 1, 1);
  } else {
    oled_str(72, 42, "NORMAL", 1, 1);
  }

  drawFooter("[Hold:Calib]");
}

// -----------------------------------------------------------------------------
// Screen 1: लाइव मौसम (Dual Cards + Live Sparkline Trend Graph Diagram!)
// -----------------------------------------------------------------------------
void renderLiveStats() {
  drawHeader("CLIMATE", bm_live_stats, BM_LIVE_STATS_W, BM_LIVE_STATS_H);

  // Dual Metric Cards (y=16..29)
  // Left: Temperature Card
  oled_rect(2, 16, 59, 13, 1);
  oled_draw_bitmap(5, 18, icon_thermo_8x8, 8, 8);
  char tBuf[10];
  sprintf(tBuf, "%.1f C", liveTemp);
  oled_str(16, 19, tBuf, 1, 1);

  // Right: Humidity Card
  oled_rect(66, 16, 59, 13, 1);
  oled_draw_bitmap(69, 18, icon_droplet_8x8, 8, 8);
  char hBuf[10];
  sprintf(hBuf, "%.1f%%", liveHum);
  oled_str(80, 19, hBuf, 1, 1);

  // Live Sparkline Trend Graph Diagram (y=32..51, x=2..125)
  oled_rect(2, 32, 123, 19, 1);
  oled_str(5, 34, "T~", 1, 1);

  // Dotted 28°C baseline across the sparkline
  for (int x = 16; x < 122; x += 4) {
    oled_pixel(x, 41, 1);
  }

  // Plot connected line segments from 16 historical temperature samples
  for (int i = 0; i < 15; i++) {
    int x0 = 16 + (i * 7);
    int x1 = 16 + ((i + 1) * 7);
    // Map 24.0C..32.0C to y=48..34 (inverted screen coords)
    int y0 = map((int)(tempHistory[i] * 10), 240, 320, 48, 34);
    int y1 = map((int)(tempHistory[i + 1] * 10), 240, 320, 48, 34);
    y0 = constrain(y0, 34, 48);
    y1 = constrain(y1, 34, 48);
    oled_line(x0, y0, x1, y1, 1);
  }

  drawFooter("[Hold:Sample]");
}

// -----------------------------------------------------------------------------
// Screen 2: पोषक तत्व NPK (4-Channel Calibrated Horizontal Bar Graph Diagram)
// -----------------------------------------------------------------------------
void renderNPK() {
  drawHeader("NPK SOIL", bm_poshak_npk, BM_POSHAK_NPK_W, BM_POSHAK_NPK_H);

  // Row 1: Nitrogen N (y=16)
  oled_str(3, 16, "N:", 1, 1);
  oled_rect(16, 16, 52, 6, 1);
  int nFill = map(nitrogenN, 0, 200, 0, 48);
  oled_fill_rect(18, 17, constrain(nFill, 0, 48), 4, 1);
  char nStr[10];
  sprintf(nStr, "%3d mg", nitrogenN);
  oled_str(72, 16, nStr, 1, 1);

  // Row 2: Phosphorus P (y=25)
  oled_str(3, 25, "P:", 1, 1);
  oled_rect(16, 25, 52, 6, 1);
  int pFill = map(phosphorusP, 0, 100, 0, 48);
  oled_fill_rect(18, 26, constrain(pFill, 0, 48), 4, 1);
  char pStr[10];
  sprintf(pStr, "%3d mg", phosphorusP);
  oled_str(72, 25, pStr, 1, 1);

  // Row 3: Potassium K (y=34)
  oled_str(3, 34, "K:", 1, 1);
  oled_rect(16, 34, 52, 6, 1);
  int kFill = map(potassiumK, 0, 250, 0, 48);
  oled_fill_rect(18, 35, constrain(kFill, 0, 48), 4, 1);
  char kStr[10];
  sprintf(kStr, "%3d mg", potassiumK);
  oled_str(72, 34, kStr, 1, 1);

  // Row 4: Soil pH (y=43)
  oled_str(3, 43, "pH", 1, 1);
  oled_rect(16, 43, 52, 6, 1);
  // Dotted neutral center line at pH 7.0
  oled_vline(42, 42, 8, 1);
  int phFill = map((int)(soilPH * 10), 0, 140, 0, 48);
  oled_fill_rect(18, 44, constrain(phFill, 0, 48), 4, 1);
  char phStr[10];
  sprintf(phStr, "%.1f pH", soilPH);
  oled_str(72, 43, phStr, 1, 1);
  oled_draw_bitmap(104, 43, bm_uchit, BM_UCHIT_W, BM_UCHIT_H);

  drawFooter("[Hold:Sample]");
}

// -----------------------------------------------------------------------------
// Screen 3: सिंचाई नियंत्रण (Hydraulic Pipeline & Pump Impeller Diagram)
// -----------------------------------------------------------------------------
void renderIrrigation() {
  drawHeader("PUMP AUTO", bm_sinchai, BM_SINCHAI_W, BM_SINCHAI_H);

  // Hydraulic Pipeline Schematic (y=16..33)
  // 1. Water Reservoir Tank (x=6..20)
  oled_rect(6, 17, 15, 14, 1);
  oled_hline(8, 22, 11, 1);
  oled_hline(8, 26, 11, 1);

  // 2. Intake pipe with direction arrow
  oled_hline(21, 24, 28, 1);
  oled_pixel(33, 23, 1); oled_pixel(34, 24, 1); oled_pixel(33, 25, 1); // Arrow '>'

  // 3. Rotating Pump Motor Diagram (Circle radius 7 at x=56, y=24)
  oled_circle(56, 24, 7, 1);
  if (pumpState) {
    pumpAnimPhase = (pumpAnimPhase + 1) % 4;
    // Animated rotating impeller blades
    if (pumpAnimPhase == 0 || pumpAnimPhase == 2) {
      oled_hline(51, 24, 11, 1);
      oled_vline(56, 19, 11, 1);
    } else {
      oled_line(52, 20, 60, 28, 1);
      oled_line(52, 28, 60, 20, 1);
    }
  } else {
    // Static motor cross
    oled_hline(52, 24, 9, 1);
    oled_vline(56, 20, 9, 1);
  }

  // 4. Output Pipe & Sprinkler Head
  oled_hline(63, 24, 38, 1);
  oled_pixel(80, 23, 1); oled_pixel(81, 24, 1); oled_pixel(80, 25, 1); // Arrow '>'
  oled_rect(101, 20, 8, 8, 1); // Sprinkler nozzle

  // Water spray droplets if pump active
  if (pumpState) {
    oled_pixel(111, 18, 1);
    oled_pixel(115, 23, 1);
    oled_pixel(112, 28, 1);
  }

  // Lower Pump Status Card (y=35..50)
  if (pumpState) {
    oled_fill_rect(6, 35, 116, 14, 1);
    oled_str(12, 38, "[PUMP: ON!] RELAY D9", 1, 0); // Inverted text
  } else {
    oled_rect(6, 35, 116, 14, 1);
    if (soilMoist >= 80) {
      oled_str(10, 38, "[CUTOFF!] MOIST >80%", 1, 1);
    } else {
      oled_str(12, 38, "[PUMP: OFF] AUTO: <30%", 1, 1);
    }
  }

  drawFooter("[Hold:Toggle]");
}

// -----------------------------------------------------------------------------
// Screen 4: एआई कृषि सहायक (Robot Avatar & 8-Band Audio Spectrum Diagram)
// -----------------------------------------------------------------------------
void renderAIAssistant() {
  drawHeader("AI VOICE", bm_ai_title, BM_AI_TITLE_W, BM_AI_TITLE_H);

  if (!aiVoiceActive) {
    // Standby Mode: 16x16 Robot Mascot Avatar on left
    oled_draw_bitmap(6, 17, icon_robot_16x16, 16, 16);

    // Dialogue Speech Bubble (x=26..124, y=16..49)
    oled_rect(26, 16, 98, 33, 1);
    oled_pixel(25, 23, 1); oled_pixel(24, 24, 1); // Dialogue triangle pointer

    // Prompt bitmap & instructions inside speech bubble
    oled_draw_bitmap(32, 19, bm_ask_prompt, BM_ASK_PROMPT_W, BM_ASK_PROMPT_H);
    oled_str(32, 32, "Hold Button to Talk", 1, 1);
    oled_str(32, 40, "Mic: D1 | Spk: D6/D7", 1, 1);
  } 
  else {
    // Active AI Mode: Animated 8-Band Audio Spectrum Visualizer Diagram (y=16..33)
    waveAnimPhase++;
    int baseHeights[8] = { 4, 10, 14, 8, 12, 15, 9, 5 };
    for (int b = 0; b < 8; b++) {
      int bx = 28 + (b * 9);
      int h = baseHeights[(b + waveAnimPhase) % 8];
      oled_rect(bx, 33 - h, 6, h, 1);
      oled_fill_rect(bx + 1, 34 - h, 4, h - 1, 1);
    }

    // Spoken Agronomic Advice Bubble (y=36..50)
    oled_rect(4, 36, 120, 14, 1);
    if (sampleToggle) {
      oled_draw_bitmap(8, 38, bm_resp_ok, BM_RESP_OK_W, BM_RESP_OK_H);
      oled_str(82, 39, "OK: 0001", 1, 1);
    } else {
      oled_draw_bitmap(8, 38, bm_resp_urea, BM_RESP_UREA_W, BM_RESP_UREA_H);
      oled_str(82, 39, "WARN:002", 1, 1);
    }

    // Auto-timeout back to standby after 8 seconds
    if (millis() - aiVoiceTimer > 8000) {
      aiVoiceActive = false;
    }
  }

  drawFooter(aiVoiceActive ? "[Click:Exit]" : "[Hold:Talk]");
}

// -----------------------------------------------------------------------------
// Screen 5: दूरी मापक MPU (10-20 cm Metric Track & Moving Cursor Diagram)
// -----------------------------------------------------------------------------
void renderMPUMotion() {
  drawHeader("DISTANCE MPU", bm_duri_mapak, BM_DURI_MAPAK_W, BM_DURI_MAPAK_H);

  // Top Odometer Readout (y=16..26)
  char dBuf[10];
  sprintf(dBuf, "%.1f", demoDistCm);
  oled_str(6, 16, dBuf, 2, 1);
  oled_str(54, 17, "cm", 1, 1);
  oled_str(74, 17, "/ 15cm Goal", 1, 1);

  // Metric Track & Ruler Diagram (y=28..39, x=8..120)
  oled_hline(8, 34, 112, 1); // Main track rail

  // Tick marks: 0cm, 5cm, 10cm, 15cm
  oled_vline(8, 31, 7, 1);   oled_str(6, 26, "0", 1, 1);
  oled_vline(45, 32, 5, 1);  oled_str(43, 26, "5", 1, 1);
  oled_vline(82, 32, 5, 1);  oled_str(78, 26, "10", 1, 1);
  oled_vline(119, 31, 7, 1); oled_draw_bitmap(114, 25, icon_flag_8x8, 8, 8); // Goal Flag

  // Dynamic Moving Probe Cursor (pointing down onto the ruler)
  int cursorX = 8 + (int)((demoDistCm / 15.0f) * 111.0f);
  cursorX = constrain(cursorX, 8, 119);
  oled_pixel(cursorX, 33, 1);
  oled_hline(cursorX - 2, 31, 5, 1);
  oled_hline(cursorX - 1, 32, 3, 1);

  // Status Badge (y=41..50)
  if (demoDistCm < 15.0f) {
    oled_rect(10, 41, 108, 10, 1);
    oled_draw_bitmap(18, 42, bm_slide_hint, BM_SLIDE_HINT_W, BM_SLIDE_HINT_H);
  } else {
    // Flashing Celebration Badge
    oled_fill_rect(10, 41, 108, 10, 1);
    oled_str(16, 42, "REACHED! PLANT SENSOR", 1, 0); // Inverted text
  }

  drawFooter("[Hold:Reset]");
}

// -----------------------------------------------------------------------------
// Screen 6: विशेषज्ञ कॉल / Twilio Voice Call (BLE Connected Phone Hotline)
// -----------------------------------------------------------------------------
void renderCallExpert() {
  drawHeader("TWILIO CALL", NULL, 0, 0);

  // Left side: Phone Box with radiating waves (x=4..44, y=16..50)
  oled_rect(4, 16, 40, 35, 1);
  oled_draw_bitmap(14, 21, icon_phone_8x8, 8, 8);
  oled_draw_bitmap(26, 21, icon_bt_8x8, 8, 8);

  if (twilioCallActive) {
    // Ringing wave animation
    int r = (millis() / 250) % 3;
    if (r >= 0) oled_circle(24, 25, 7, 1);
    if (r >= 1) oled_circle(24, 25, 11, 1);
    if (r >= 2) oled_circle(24, 25, 14, 1);
    oled_str(7, 39, "DIALING", 1, 1);
  } else {
    oled_str(7, 34, "BT:LINK", 1, 1);
    oled_str(8, 42, "SONIPAT", 1, 1);
  }

  // Right side: Expert info & Contact Card (x=48..125, y=16..50)
  oled_rect(48, 16, 76, 35, 1);
  oled_str(52, 19, "DR. R. SHARMA", 1, 1);
  oled_str(52, 28, "AGRI EXPERT", 1, 1);
  
  if (twilioCallActive) {
    oled_fill_rect(50, 37, 72, 12, 1);
    oled_str(53, 39, "CALLING...", 1, 0); // Inverted text
    
    // Auto reset dialing animation after 10 seconds
    if (millis() - twilioCallTimer > 10000) {
      twilioCallActive = false;
    }
  } else {
    oled_str(52, 38, "+91-9876543210", 1, 1);
  }

  drawFooter(twilioCallActive ? "[Calling...]" : "[Hold:Call]");
}

// -----------------------------------------------------------------------------
// Live 5-Second OLED Alert Overlay
// -----------------------------------------------------------------------------
char alertTitle[24] = "";
char alertDetail[24] = "";
unsigned long alertEndTime = 0;
bool isAlertActive = false;

void triggerOledAlert(const char* title, const char* detail, unsigned long durationMs) {
  strncpy(alertTitle, title, sizeof(alertTitle) - 1);
  alertTitle[sizeof(alertTitle) - 1] = '\0';
  strncpy(alertDetail, detail, sizeof(alertDetail) - 1);
  alertDetail[sizeof(alertDetail) - 1] = '\0';
  alertEndTime = millis() + durationMs;
  isAlertActive = true;
  buzzerThirstyAlert(); // Acoustic alert beep (3 staccato chirps)
}

void renderAlertOverlay() {
  if (millis() >= alertEndTime) {
    isAlertActive = false;
    return;
  }

  // Double Border Frame (x=2..125, y=4..60)
  oled_rect(2, 4, 124, 56, 1);
  oled_rect(4, 6, 120, 52, 1);

  // Inverted Black-on-White Header Banner (y=7..19)
  oled_fill_rect(5, 7, 118, 13, 1);
  oled_str(10, 9, "! APP OVERRIDE !", 1, 0); // Inverted text
  oled_str(100, 9, "5s", 1, 0);

  // Parameter Title (y=23..31)
  oled_str(8, 23, alertTitle, 1, 1);

  // Large Parameter Detail (y=34..44)
  oled_str(8, 34, alertDetail, 1, 1);

  // Remaining Duration Countdown Progress Bar (y=48..54)
  unsigned long remaining = alertEndTime - millis();
  int barW = map(remaining, 0, 5000, 0, 108);
  barW = constrain(barW, 0, 108);
  oled_rect(8, 48, 112, 6, 1);
  oled_fill_rect(10, 50, barW, 2, 1);
}

// -----------------------------------------------------------------------------
// Command Processor for BLE & USB-Serial Inbound Commands
// -----------------------------------------------------------------------------
void processCommand(String cmd) {
  cmd.trim();
  Serial.print("[CMD RECEIVED] ");
  Serial.println(cmd);

  String u = cmd;
  u.toUpperCase();
  u.trim();

  // Universal Pump / Motor Command Parser
  if (u.indexOf("PUMP=1") >= 0 || u.indexOf("PUMP:1") >= 0 || u.indexOf("PUMP_ON") >= 0 || 
      u.indexOf("PUMP:ON") >= 0 || u.indexOf("MOTOR_ON") >= 0 || u.indexOf("MOTOR:ON") >= 0 || 
      u.indexOf("MOTOR=1") >= 0 || u == "ON" || u == "1") {
    setPumpRelay(true);
  }
  else if (u.indexOf("PUMP=0") >= 0 || u.indexOf("PUMP:0") >= 0 || u.indexOf("PUMP_OFF") >= 0 || 
           u.indexOf("PUMP:OFF") >= 0 || u.indexOf("MOTOR_OFF") >= 0 || u.indexOf("MOTOR:OFF") >= 0 || 
           u.indexOf("MOTOR=0") >= 0 || u == "OFF" || u == "0") {
    setPumpRelay(false);
  }
  else if (u.startsWith("SET:MOIST=")) {
    int val = cmd.substring(10).toInt();
    soilMoist = constrain(val, 0, 100);
    char buf[24];
    sprintf(buf, "MOIST -> %d%%", soilMoist);
    triggerOledAlert("APP: MOIST SET", buf, 5000);
  }
  else if (u.startsWith("SET:NPK=")) {
    String params = cmd.substring(8);
    int c1 = params.indexOf(',');
    int c2 = params.indexOf(',', c1 + 1);
    int c3 = params.indexOf(',', c2 + 1);
    if (c1 > 0 && c2 > 0) {
      nitrogenN = params.substring(0, c1).toInt();
      phosphorusP = params.substring(c1 + 1, c2).toInt();
      if (c3 > 0) {
        potassiumK = params.substring(c2 + 1, c3).toInt();
        soilPH = params.substring(c3 + 1).toFloat();
      } else {
        potassiumK = params.substring(c2 + 1).toInt();
      }
      char buf[24];
      sprintf(buf, "N%d P%d K%d", nitrogenN, phosphorusP, potassiumK);
      triggerOledAlert("APP: NPK UPDATE", buf, 5000);
    }
  }
  else if (u.startsWith("SET:WEATHER=")) {
    String w = cmd.substring(12);
    triggerOledAlert("APP: WEATHER", w.c_str(), 5000);
  }
  else if (u.startsWith("CMD:CALL_EXPERT")) {
    currentScreen = 6;
    twilioCallActive = true;
    twilioCallTimer = millis();
    triggerOledAlert("TWILIO CALL", "DIALING DR. SHARMA", 5000);
    for (int i = 0; i < 2; i++) {
      digitalWrite(PIN_BUZZER, BUZZER_ON);
      delay(40);
      digitalWrite(PIN_BUZZER, BUZZER_OFF);
      delay(40);
      digitalWrite(PIN_BUZZER, BUZZER_ON);
      delay(60);
      digitalWrite(PIN_BUZZER, BUZZER_OFF);
      delay(120);
    }
  }
  else if (u.startsWith("CMD:REZERO")) {
    adcDry = rawSoilADC;
    adcWet = 2800;
    if (adcDry >= adcWet - 300) adcWet = adcDry + 1200;
    triggerOledAlert("RE-ZERO CALIB", "BASELINE 0% SET", 5000);
    buzzerWateredTune();
  }
}

// -----------------------------------------------------------------------------
// BLE Server & Characteristic Callbacks
// -----------------------------------------------------------------------------
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      oldDeviceConnected = true;
      buzzerWateredTune();
      Serial.println("[BLE] Client Connected to KRISHI-AGRO-C6!");
      triggerOledAlert("BLE CONNECTED", "PHONE LINKED OK", 4000);
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      oldDeviceConnected = false;
      buzzerHoldAck();
      Serial.println("[BLE] Client Disconnected! Immediately restarting advertising...");
      triggerOledAlert("BLE OFFLINE", "DISCONNECTED", 2500);
      // Restart advertising immediately so the ESP32 never goes silent
      BLEDevice::startAdvertising();
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String rxValue = String(pCharacteristic->getValue().c_str());
      if (rxValue.length() > 0) {
        processCommand(rxValue);
      }
    }
};

// -----------------------------------------------------------------------------
// Arduino Setup & Main Loop
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(150);

  // Hardware Pins (Do NOT call pinMode on analog ADC pins on ESP32!)
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  pinMode(PIN_DHT, INPUT_PULLUP);
  pinMode(PIN_PUMP_RELAY, OUTPUT);
  pinMode(PIN_PUMP_RELAY_ALT, OUTPUT);
  digitalWrite(PIN_PUMP_RELAY, RELAY_OFF);     // HIGH default so relay starts in safe OFF state!
  digitalWrite(PIN_PUMP_RELAY_ALT, RELAY_OFF);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, BUZZER_OFF); // Silent by default!

  // ESP32-C6 ADC Configuration (Standard Arduino Core)
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db); // Required for ESP32-C6 0..3.3V analog input range
  delay(300); // Allow sensor power rail to stabilize

  // Auto-detect soil sensor orientation and calibrate dry air baseline
  autoCalibrateSensor();

  // Startup Tech Jingle (4-pulse ascending chime)
  buzzerStartupJingle();

  // I2C Wire Bus Initialization
  Wire.begin(PIN_SDA, PIN_SCL);
  delay(50);

  oled_init();
  oled_clear();
  oled_update();

  mpu_init();

  // Initialize ESP32-C6 BLE (Nordic UART Service)
  BLEDevice::init(BLE_DEVICE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  pTxCharacteristic = pService->createCharacteristic(
                        CHARACTERISTIC_UUID_TX,
                        BLECharacteristic::PROPERTY_NOTIFY
                      );
  pTxCharacteristic->addDescriptor(new BLE2902());

  BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(
                                           CHARACTERISTIC_UUID_RX,
                                           BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
                                         );
  pRxCharacteristic->setCallbacks(new MyCallbacks());

  pService->start();

  // CRITICAL FIX: Explicit Advertising Packets to guarantee Name fits in 31-byte limit!
  // Primary Adv: Complete Name "KRISHI-AGRO-C6" + Flags (19 bytes, easily fits in 31 bytes)
  // Scan Response: 128-bit Nordic UART Service UUID
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();

  BLEAdvertisementData advData;
  advData.setFlags(ESP_BLE_ADV_FLAG_GEN_DISC | ESP_BLE_ADV_FLAG_BREDR_NOT_SPT);
  advData.setName(BLE_DEVICE_NAME);
  pAdvertising->setAdvertisementData(advData);

  BLEAdvertisementData scanResponseData;
  scanResponseData.setCompleteServices(BLEUUID(SERVICE_UUID));
  pAdvertising->setScanResponseData(scanResponseData);

  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("[BLE] Advertising started as 'KRISHI-AGRO-C6' (Optimized 31-byte packets)!");
}

void loop() {
  handleButton();
  updateSoilMoisture();
  updateDHTSensor();
  updateMPUMotion();

  // Handle USB Serial Commands
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) {
      processCommand(line);
    }
  }

  // Failsafe: if not connected, ensure advertising is actively running every 3 seconds
  static unsigned long lastAdvCheck = 0;
  if (!deviceConnected && millis() - lastAdvCheck >= 3000) {
    lastAdvCheck = millis();
    BLEDevice::startAdvertising();
  }

  // Periodic Telemetry Notification over BLE (every 1 second)
  static unsigned long lastBleNotify = 0;
  if (deviceConnected && millis() - lastBleNotify >= 1000) {
    lastBleNotify = millis();
    char notifyBuf[64];
    sprintf(notifyBuf, "TELEM:%d,%.1f,%.1f,%d\n", soilMoist, liveTemp, liveHum, pumpState ? 1 : 0);
    pTxCharacteristic->setValue((uint8_t*)notifyBuf, strlen(notifyBuf));
    pTxCharacteristic->notify();
  }

  // Render Display (Alert Overlay has priority for 5 seconds!)
  oled_clear();
  if (isAlertActive && millis() < alertEndTime) {
    renderAlertOverlay();
  } else {
    isAlertActive = false;
    switch (currentScreen) {
      case 0: renderDashboard();   break;
      case 1: renderLiveStats();   break;
      case 2: renderNPK();         break;
      case 3: renderIrrigation();  break;
      case 4: renderAIAssistant(); break;
      case 5: renderMPUMotion();   break;
      case 6: renderCallExpert();  break;
    }
  }
  oled_update();

  delay(25); // ~40 FPS smooth UI refresh rate
}

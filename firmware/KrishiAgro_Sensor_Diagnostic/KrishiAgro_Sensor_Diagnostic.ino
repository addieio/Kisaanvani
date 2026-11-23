/*
 * ELECROW Crowtail Moisture Sensor 2.0 (RS7446) - BARE METAL DIAGNOSTIC
 * Seeed Studio XIAO ESP32-C6
 * 
 * This sketch does ONE thing only: reads EVERY analog pin and prints results.
 * No OLED. No I2C. No buzzer. No libraries. Just raw analog reads.
 * 
 * Open Serial Monitor at 115200 baud.
 * Touch the sensor prongs with wet fingers - look for which pin's number changes.
 */

void setup() {
  Serial.begin(115200);
  delay(2000); // Give time to open Serial Monitor

  // ESP32-C6 ADC config
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  Serial.println();
  Serial.println("=============================================");
  Serial.println("CROWTAIL MOISTURE SENSOR - PIN SCANNER");
  Serial.println("XIAO ESP32-C6 - All Analog Pins");
  Serial.println("=============================================");
  Serial.println();
  Serial.println("Instructions:");
  Serial.println("1. Connect sensor VCC (Red) to 3V3");
  Serial.println("2. Connect sensor GND (Black) to GND");
  Serial.println("3. Connect sensor SIG wire to D0, D1, or D2");
  Serial.println("4. Touch the prongs with WET fingers");
  Serial.println("5. Look for which column's number JUMPS UP");
  Serial.println();
  Serial.println("   A0(D0)  A1(D1)  A2(D2)  A3(D3)");
  Serial.println("   ------  ------  ------  ------");
}

void loop() {
  // Read D0 (GPIO 0) and D1 (GPIO 1) with dual raw and millivolts
  int raw0 = analogRead(0);
  int mv0  = analogReadMilliVolts(0);
  int raw1 = analogRead(1);
  int mv1  = analogReadMilliVolts(1);

  // If raw is 0 but mv > 0 (ESP32-C6 calibration bug), scale mv to 12-bit
  if (raw0 == 0 && mv0 > 20) raw0 = (mv0 * 4095L) / 3300L;
  if (raw1 == 0 && mv1 > 20) raw1 = (mv1 * 4095L) / 3300L;

  Serial.printf("D1 (Pin 2): %4d (%4dmV)  |  D0 (Pin 1): %4d (%4dmV)", raw1, mv1, raw0, mv0);

  if (raw1 > 50 || mv1 > 50) {
    Serial.print("  <-- SIGNAL ON D1!");
  }
  if (raw0 > 50 || mv0 > 50) {
    Serial.print("  <-- SIGNAL ON D0!");
  }
  Serial.println();

  delay(300);
}

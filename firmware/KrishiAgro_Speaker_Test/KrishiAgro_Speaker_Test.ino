/*
 * ==============================================================================
 * KRISHI-AGRO: Direct Speaker Test (NO SD CARD REQUIRED!)
 * Test your RS009 Speaker directly from Seeed Studio XIAO ESP32-C6
 * ZERO EXTERNAL LIBRARIES!
 * 
 * Hardware Wiring:
 * - XIAO D8 (GPIO19) ---> [100Ω to 220Ω Resistor] ---> Speaker Wire 1 (+)
 * - XIAO GND        ---------------------------------> Speaker Wire 2 (-)
 * - XIAO D3 (GPIO21) ---> Push Button Leg 1 (Leg 2 to GND)
 * 
 * WHY THE RESISTOR IS CRUCIAL:
 * An 8-Ohm speaker connected directly to a 3.3V GPIO pin draws ~400mA, which
 * overloads the ESP32 pin (rated for max 40mA).
 * Adding a 100Ω–220Ω resistor in series limits current to a safe ~20–30mA
 * while producing plenty of volume for desk testing!
 * ==============================================================================
 */

#define PIN_SPEAKER 19  // D8 / GPIO19
#define PIN_BUTTON  21  // D3 / GPIO21 (Internal pullup)

// Musical Note Frequencies (Hz)
#define NOTE_C4  262
#define NOTE_D4  294
#define NOTE_E4  330
#define NOTE_F4  349
#define NOTE_G4  392
#define NOTE_A4  440
#define NOTE_B4  494
#define NOTE_C5  523
#define NOTE_D5  587
#define NOTE_E5  659
#define NOTE_G5  784
#define NOTE_C6  1046

void playTone(int freq, int durationMs) {
  tone(PIN_SPEAKER, freq, durationMs);
  delay(durationMs * 1.15); // Brief gap between notes
  noTone(PIN_SPEAKER);
}

// 1. Frequency Sweep: Tests full speaker frequency response (Bass to Treble)
void testFrequencySweep() {
  Serial.println("[TEST 1] Running Frequency Sweep: 200 Hz to 2400 Hz...");
  for (int f = 200; f <= 2400; f += 25) {
    tone(PIN_SPEAKER, f, 12);
    delay(12);
  }
  noTone(PIN_SPEAKER);
  delay(300);
}

// 2. Super Mario Power-Up Melody
void playMarioPowerUp() {
  Serial.println("[TEST 2] Playing Super Mario Power-Up Tune...");
  int melody[] = { 330, 392, 659, 523, 587, 784 };
  int durations[] = { 100, 100, 100, 100, 100, 180 };
  for (int i = 0; i < 6; i++) {
    playTone(melody[i], durations[i]);
  }
  delay(300);
}

// 3. Victory / Success Fanfare
void playVictoryFanfare() {
  Serial.println("[TEST 3] Playing Victory Fanfare...");
  int notes[] = { NOTE_C5, NOTE_E5, NOTE_G5, NOTE_C6 };
  int times[] = { 120, 120, 120, 300 };
  for (int i = 0; i < 4; i++) {
    playTone(notes[i], times[i]);
  }
  delay(300);
}

// 4. Robotic Beep-Boop Speech Cadence (Simulates voice activity)
void playRobotVoiceCadence() {
  Serial.println("[TEST 4] Simulating Robotic Voice Cadence...");
  int cadence[] = { 600, 850, 720, 950, 580, 820, 1100, 750 };
  for (int i = 0; i < 8; i++) {
    tone(PIN_SPEAKER, cadence[i], 50);
    delay(70);
  }
  noTone(PIN_SPEAKER);
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n==========================================");
  Serial.println("KRISHI-AGRO: DIRECT SPEAKER TEST BENCH");
  Serial.println("No SD Card or MP3 Module Needed!");
  Serial.println("==========================================\n");

  pinMode(PIN_SPEAKER, OUTPUT);
  pinMode(PIN_BUTTON, INPUT_PULLUP);

  // Run full audio diagnostic sequence on boot
  testFrequencySweep();
  delay(400);
  playMarioPowerUp();
  delay(400);
  playVictoryFanfare();
  delay(400);
  playRobotVoiceCadence();

  Serial.println("\n[READY] Press the D3 Button to replay the test melody anytime!");
}

bool btnDown = false;
void loop() {
  // Press D3 button to trigger melody anytime
  if (digitalRead(PIN_BUTTON) == LOW && !btnDown) {
    btnDown = true;
    Serial.println("\n>> Button Pressed: Playing Melodic Test!");
    playMarioPowerUp();
    playVictoryFanfare();
  } else if (digitalRead(PIN_BUTTON) == HIGH && btnDown) {
    btnDown = false;
  }

  delay(20);
}


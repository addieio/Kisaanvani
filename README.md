<div align="center">

# 🌾 किसानवाणी (KisanVaani)
### *Voice-First AI Agronomist, ESP32-C6 Soil Telemetry Stake & Mandi-Direct Escrow Portal*
#### **Built for Hack with Delhi 4.0**

[![Live Web Platform](https://img.shields.io/badge/Live_Cloud_Platform-kisanvaani--eight.vercel.app-000000?style=for-the-badge&logo=vercel)](https://kisanvaani-eight.vercel.app)
[![Hack with Delhi 4.0](https://img.shields.io/badge/Hack_with_Delhi-4.0_Project-FF5722?style=for-the-badge&logo=target)](https://github.com/addieio/Kisaanvani)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.2-black?style=for-the-badge&logo=next.js)](https://kisanvaani-eight.vercel.app)
[![Flutter](https://img.shields.io/badge/Flutter-3.29-02569B?style=for-the-badge&logo=flutter)](https://flutter.dev/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Custom_12--Class-00FFFF?style=for-the-badge&logo=ultralytics)](https://ultralytics.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-3.8_Flash-4285F4?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![Sarvam AI](https://img.shields.io/badge/Sarvam_AI-Bulbul_Indic_TTS-FF6F00?style=for-the-badge)](https://api.sarvam.ai/)
[![Twilio](https://img.shields.io/badge/Twilio-Voice_%26_SMS_API-F22F46?style=for-the-badge&logo=twilio)](https://www.twilio.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_16-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![ESP32-C6](https://img.shields.io/badge/IoT_Hardware-ESP32--C6_BLE_5.0-E7352C?style=for-the-badge&logo=espressif)](https://www.espressif.com/)

**Empowering smallholder Indian farmers through biophysical root-zone telemetry, edge computer-vision crop pathology, Indic-language voice AI, offline GSM feature-phone inclusion, and disintermediated fair-price mandi sales.**

---

### 🌐 Live Production Deployment
**Web Platform & Escrow Marketplace**: **[https://kisanvaani-eight.vercel.app](https://kisanvaani-eight.vercel.app)**
*Experience the live Farmer Portal, B2B Procurement Desk, Cold-Chain Logistics Calculator, and Government Sowing Quota Balancer directly in your browser.*

---

</div>

## 📖 Executive Summary & Vision

Smallholder cultivators across India face four systemic vulnerabilities:
1. **Late Crop Disease Detection**: Delayed pathology identification causes 20–40% preventable yield loss from foliar blights, rusts, and root rot.
2. **The Smartphone & Connectivity Divide**: Over 65% of rural Indian farmers do not own smartphones or operate in rural connectivity dark zones. They carry basic ₹1,000 keypad feature phones (GSM/2G) and are excluded from modern touch-screen apps.
3. **Digital Literacy & Interface Barriers**: Text-heavy dashboards alienate non-literate farmers who operate predominantly through verbal communication.
4. **Exploitative Middlemen & Credit Inaccessibility**: Middlemen depress farmgate prices, while banks (KCC loans) and insurers (PMFBY claims) require verified, tamper-proof soil and crop telemetry that farmers cannot produce.

**KisanVaani unifies five complementary engineering pillars to solve these challenges end-to-end:**
- 📡 **Real IoT Hardware Stake (Seeed Studio XIAO ESP32-C6)**: Field telemetry with Nordic UART BLE 5.0, Crowtail capacitive moisture auto-calibration, DHT22 micro-climate monitoring, MPU-6050 physical tilt detection, SSD1306 OLED with 5-second alert toasts, and Active-LOW pump relay safety cutoffs.
- 📞 **Zero-Smartphone Offline Telephony (Twilio Voice IVR + Sarvam AI Bulbul TTS)**: Enables farmers with basic keypad feature phones to verbally list crops, accept buyer bids via automated Hindi phone calls, and receive soil emergency alerts via SMS.
- 📱 **Voice-First Mobile App (Flutter & Apple iOS 18 Design)**: Large touch targets (≥74px), zero typing, 5 regional languages (Hindi, Punjabi, Marathi, Tamil, English), reactive BLE scanner, and tactile haptic feedback.
- 🔬 **Edge Computer Vision & AI Agronomist (YOLOv8 + Google Gemini 3.8 Flash)**: Custom-trained 12-class edge pathology model paired with conversational Hindi agronomy advice and spoken audio.
- 🌐 **Full-Stack Web Platform & Escrow Marketplace (Next.js 15 & Supabase on Vercel)**: Farmer portal, B2B restaurant procurement portal with radial cold-chain logistics, government district sowing quota balancer, and certified KCC/PMFBY financial passport exports.

---

## 🏛️ System Architecture

```
                                    [ Farmer / Cultivator ]
                                               │
                ┌───────────────────────────────┼───────────────────────────────┐
                ▼                               ▼                               ▼
      [ Next.js 15 Web PWA ]         [ 2G Basic Feature Phone ]         [ Flutter Android App ]
  https://kisanvaani-eight.vercel.app  (Zero Internet / Keypad GSM)      (BLE 5.0, Camera HUD, TTS)
                │                               │                               │
                │                ┌──────────────┴──────────────┐                │
                │                ▼                             ▼                │
                │      [ Twilio Voice IVR ]          [ Twilio SMS Gateway ]     │
                │   • Verbal Crop Posting (NLU)     • 4-Digit Handover Gate PIN │
                │   • Sarvam Bulbul Indic TTS       • Biophysical Soil Alarms   │
                │   • DTMF / Voice Bid Acceptance   (Hypoxia, Drought, Urea)    │
                │                └──────────────┬──────────────┘                │
                │                               │                               │
                ├───────────────────────────────┼───────────────────────────────┤
                ▼                               ▼                               ▼
    [ YOLOv8 Edge Vision ]           [ Gemini 3.8 Flash Doctor ]       [ XIAO ESP32-C6 Stake ]
    • Custom 12-Class Model          • Actionable Hindi Advice         • Crowtail Capacitive Moist
    • Trained Weights (best.pt)      • Automated Speech Generation     • DHT22 Temp & Humidity
    • Bounding Box Localization      • Voice Triage Dialog             • MPU-6050 6-DOF Tilt IMU
                │                               │                      • SSD1306 0.96" OLED Toast
                │                               │                      • Dual Active-LOW Relay Cutoff
                │                               │                               │
                └───────────────────────────────┴───────────────────────────────┘
                                                │
                                                ▼
                                [ Supabase PostgreSQL 16 ]
                       • 16 Normalized Database Tables
                       • Regional Sowing Quota Locks (Anti-Glut)
                       • Mandi-Direct Escrow (4-Digit PIN Handover)
                       • KCC Loan & PMFBY Insurance Dossier Exports
```

---

## 📡 Hardware Stake & Sensor Architecture

The physical field sensor stake monitors root-zone metrics, micro-climate factors, and physical stake stability, communicating over Nordic UART BLE 5.0:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │              Seeed Studio XIAO ESP32-C6                 │
                  │             (RISC-V 160MHz, BLE 5.0, Wi-Fi 6)           │
                  └──────┬────────────┬───────────┬────────────┬────────────┘
                         │            │           │            │
            Analog ADC1  │   1-Wire   │    I2C    │    GPIO    │ Dual GPIO
               (D1/GPIO1)│  (D2/GPIO2)│ (D4/D5)   │ (D8/GPIO19)│ (D9/GPIO20 & D10/GPIO9)
                         ▼            ▼           ▼            ▼            ▼
                  ┌────────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌────────────────┐
                  │  Crowtail  │ │  DHT22  │ │ SSD1306 │ │Active-Low│ │Optocoupled Dual│
                  │ Capacitive │ │Temp/Hum │ │  OLED   │ │  Buzzer  │ │Relay Motor Cut │
                  │  Moisture  │ │ Sensor  │ │ Display │ │(Acoustic)│ │ (Songle 10A)   │
                  └────────────┘ └─────────┘ └────┬────┘ └──────────┘ └────────────────┘
                                                  │
                                                  ▼
                                             ┌─────────┐
                                             │MPU-6050 │
                                             │6-DOF IMU│
                                             │ (Tilt)  │
                                             └─────────┘
```

### 1. What All Sensors Are There & How Each Works

#### 🌾 A. Crowtail Capacitive Soil Moisture Sensor (v2.0)
* **Hardware Interfacing**: Analog Pin `D1` / `GPIO 1` (`ADC1_CH1`).
* **Working Principle**: Operates on the principle of **dielectric permittivity** of soil. Unlike cheap resistive probes that corrode rapidly through electrolysis, the capacitive design uses insulated copper traces on a PCB forming a capacitor whose dielectric medium is the surrounding soil and moisture. Water has a high dielectric constant ($\approx 80$) compared to dry soil ($\approx 3\text{--}5$) and air ($\approx 1$).
* **Signal Processing & Auto-Calibration**: As volumetric water content rises, capacitance increases, lowering the timer output voltage. The firmware captures 12-bit ADC values ($0\text{--}4095$) with multi-sample rolling average smoothing, dynamically calibrating the dry-air baseline ($\approx 2800\text{--}3100$ raw ADC) and saturation threshold ($\approx 1200\text{--}1400$ raw ADC) into a calibrated $0\text{--}100\%$ Volumetric Soil Moisture metric.
* **Root Hypoxia Emergency Action**: When moisture exceeds $80\%$ (waterlogging / anaerobic root suffocation danger), the stake triggers an instant hardware pump cutoff, emits acoustic siren pulses, and flashes an OLED alert.

#### 🌡️ B. DHT22 (AM2302) Digital Temperature & Relative Humidity Sensor
* **Hardware Interfacing**: Digital Pin `D2` / `GPIO 2` with an external $10\text{ k}\Omega$ pull-up resistor to $3.3\text{V}$.
* **Working Principle**: Uses a capacitive humidity sensing element and a high-precision Negative Temperature Coefficient (NTC) thermistor. An onboard 8-bit chip outputs calibrated digital signals over a proprietary single-bus 1-wire protocol.
* **Biophysical Role & Vapor Pressure Deficit (VPD)**: Accurately tracks micro-climate conditions around the crop canopy ($-40^\circ\text{C}$ to $+80^\circ\text{C} \pm 0.5^\circ\text{C}$; $0\text{--}100\%$ RH $\pm 2\%$). Combined temperature and relative humidity allow real-time computation of **Vapor Pressure Deficit (VPD)**. When humidity remains $>90\%$ in warm temperatures, the biophysical engine predicts fungal spore germination (e.g., powdery mildew, leaf spot) before physical symptoms appear on leaves.

#### 📐 C. MPU-6050 6-Axis Motion Tracking Sensor (Accelerometer + Gyroscope)
* **Hardware Interfacing**: I2C Bus via `GPIO 22` (`SDA` / `D4`) and `GPIO 23` (`SCL` / `D5`) at $400\text{kHz}$ Fast Mode (I2C address `0x68`).
* **Working Principle**: Integrates a 3-axis MEMS accelerometer with a 3-axis MEMS gyroscope and an internal Digital Motion Processor (DMP).
* **Physical Telemetry Role**: Continuously monitors the physical inclination and spatial orientation of the field sensor stake. Detects physical displacement, stake toppling by high winds, heavy rain soil washouts, or cattle disturbances. If inclination exceeds $25^\circ$ from the vertical normal, the firmware flags a `STAKE_DISPLACED` status to alert the farmer that root-zone readings may no longer be accurate.

#### 📺 D. 0.96" SSD1306 Monochrome OLED Display (128x64 Pixels)
* **Hardware Interfacing**: Shared I2C Bus (`GPIO 22` SDA, `GPIO 23` SCL, I2C address `0x3C`).
* **Working Principle**: High-contrast self-emissive organic light-emitting diode matrix with zero backlight bleed, readable under harsh direct sunlight in the field.
* **Visual Layout & Toast Alert System**:
  - **Telemetry Carousel**: Cycles between real-time moisture %, temperature, humidity, NPK status, and pump relay states.
  - **Custom Compact Hindi Bitmaps**: Displays native Hindi text and icons (*नमी*, *मौसम*, *सिंचाई*, *उचित*, *सूखी*) without requiring external font flash overhead.
  - **5-Second Double-Border Toast System**: When app sliders or remote simulation commands are dispatched, an interruptible double-bordered alert card overrides the screen for exactly $5,000\text{ms}$ with beep tones, showing the updated parameter before restoring live metrics.

#### 🔊 E. Active-Low Acoustic Electromagnetic Buzzer (12mm)
* **Hardware Interfacing**: Digital Pin `D8` / `GPIO 19`.
* **Working Principle**: Built-in oscillation circuit driven by a low-side NPN/MOSFET switch. Pulling `GPIO 19` `LOW` activates the internal oscillator, driving the diaphragm at $\approx 2.7\text{kHz}$.
* **Acoustic Feedback Modes**: Provides distinct auditory feedback for rural field conditions: single short chirp ($100\text{ms}$) for button click / BLE command reception; triple rapid pulse ($3\times 80\text{ms}$) for threshold warnings; continuous pulsed siren for emergency over-irrigation pump cutoff.

#### ⚡ F. Dual-Pin Optocoupled Active-LOW Power Relay (Songle SRD-05VDC-SL-C)
* **Hardware Interfacing**: Driven in parallel by Digital Pin `D9` / `GPIO 20` (Primary) and Digital Pin `D10` / `GPIO 9` (Secondary) for pin fault tolerance and high switching reliability.
* **Working Principle**: Employs an EL817 optocoupler for complete galvanic isolation between the low-voltage ESP32 logic rail ($3.3\text{V}$) and high-power motor/pump circuits (up to $250\text{V AC} / 10\text{A}$ or $30\text{V DC} / 10\text{A}$). Pulling the control pins `LOW` illuminates the internal infrared LED, saturating the phototransistor and energizing the $5\text{V}$ relay coil.
* **Fail-Safe Protection**: Defaults to `HIGH` (Normally Open / de-energized) on reboot, power brownout, or high moisture ($>80\%$) to prevent field flooding.

---

### 2. Complete Hardware Circuit & Pinout Table

| Component | XIAO ESP32-C6 Pin | GPIO | Protocol / Mode | Connection Details |
| :--- | :--- | :--- | :--- | :--- |
| **Relay Signal (IN)** | **D9** *(Primary)* | **GPIO 20** | Digital Output | Active-LOW ($0\text{V}$ activates coil, turns motor ON) |
| **Relay Signal (ALT)** | **D10** *(Secondary)* | **GPIO 9** | Digital Output | Driven in parallel with D9 for pin fault tolerance |
| **Relay VCC** | **5V** | 5V Rail | Power | Connect to 5V rail (USB / external supply) |
| **Relay GND** | **GND** | GND | Ground | Common ground rail |
| **SSD1306 OLED SDA** | **D4** | **GPIO 22** | I2C Data (`0x3C`) | Display data line |
| **SSD1306 OLED SCL** | **D5** | **GPIO 23** | I2C Clock | Display clock line |
| **DHT22 Temp/Humidity** | **D2** | **GPIO 2** | Digital 1-Wire | $10\text{ k}\Omega$ pull-up resistor to 3.3V |
| **Crowtail Moisture Sensor** | **D1** *(or D0)* | **GPIO 1** | Analog ADC1_CH1 | Capacitive soil moisture signal |
| **Active-Low Buzzer** | **D8** | **GPIO 19** | Digital Output | Active-LOW acoustic buzzer driver |
| **MPU-6050 Accelerometer** | **D4 (SDA) / D5 (SCL)** | **GPIO 22 / 23** | I2C (`0x68`) | 6-DOF stake tilt & displacement detection |
| **Hardware Mode Button** | **D3** | **GPIO 21** | Digital Input | Pull-up to 3.3V, momentary to GND |

---

## ⚙️ How the Entire System Works (End-to-End Mechanics)

### 1. Root-Zone Biophysical Telemetry & BLE 5.0 Broadcast
1. The **XIAO ESP32-C6** reads analog moisture from the Crowtail sensor, digital ambient climate from the DHT22, and physical orientation angles from the MPU-6050.
2. An onboard biophysical engine computes rolling averages, checks threshold limits, and updates the **SSD1306 OLED**.
3. Telemetry is serialized into a compact string format (`TELEM:moist,temp,hum,pump`) and broadcast via the **Nordic UART Service (NUS)**:
   - **Service UUID**: `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`
   - **RX Characteristic (Write)**: `6E400002-B5A3-F393-E0A9-E50E24DCCA9E`
   - **TX Characteristic (Notify)**: `6E400003-B5A3-F393-E0A9-E50E24DCCA9E`
4. The **Flutter Mobile App** or **Web Bluetooth Bridge** subscribes to notifications, synchronizing real-time field status with zero manual polling.

---

### 2. 📞 Zero-Smartphone Offline Engine (Twilio Voice IVR + Sarvam AI Bulbul TTS)

Farmers in remote rural areas with basic ₹1,000 keypad feature phones (GSM/2G) participate in the digital marketplace without needing smartphones or mobile internet:

#### 🎙️ Workflow A: Verbal Crop Listing via Phone Call (No Internet Required)
1. **Interactive Voice IVR**: Farmer dials the platform hotline (or receives an automated check-in call) via Twilio Voice (`/api/twilio/offline-listing/voice`).
2. **Spoken Hindi Guidance**: The system greets the farmer:
   > *"नमस्ते किसान भाई! किसानवाणी में आपका स्वागत है। आप कौन सी सब्जी या फसल का आर्डर पोस्ट करना चाहते हैं और कितनी मात्रा? जैसे बोलिए: 300 किलो टमाटर। बीप के बाद अपनी आवाज में बोलें।"*
3. **Dialect-Agnostic Speech Capture**: Farmer speaks naturally into their phone (e.g., *"300 किलो टमाटर 40 रुपये भाव"* or *"5 क्विंटल आलू"*).
4. **AI Speech NLU Extraction (Gemini 3.8 Flash + Regex Classifier)**:
   - **Commodity Identification**: Extracts colloquial names (*tamatar*, *aloo*, *pyaz*, *mirch*, *bhindi*) into standardized market listings.
   - **Quantity Parsing**: Understands both kilograms (*किलो*) and quintals (*क्विंटल* = 100 kg).
   - **Target Rate**: Detects spoken rates per kg.
5. **Instant Database Sync**: Produce is published live to the Supabase database (`listings` table) tagged as `OFFLINE_VOICE_POST` and displayed on the buyer portal.

#### 🤝 Workflow B: Order Acceptance via Automated Hindi Calls (Sarvam AI Bulbul TTS)
1. **Outbound Call Trigger**: When a buyer places an order on the marketplace, an automated call is dispatched to the farmer via Twilio REST API.
2. **Sarvam AI Bulbul TTS (`bulbul:v4-flash`)**:
   - Synthesizes telecom-standard **8000Hz WAV audio** with natural Hindi phrasing:
     > *"नमस्कार जी। आपके लिए एक नया ऑर्डर आया है। देसी लाल टमाटर, 300 किलो, कुल राशि 12,000 रुपये। ऑर्डर स्वीकार करने के लिए कृपया एक दबाएं। या हाँ बोलें।"*
   - **Zero-Latency In-Memory Audio Pre-Warming**: Buffers pre-rendered audio during checkout, streaming in **<15ms** without stutter.
3. **Dual Acceptance (DTMF or Voice)**:
   - **Keypad**: Press **`1`** (DTMF tone detection).
   - **Voice**: Speak affirmative words: *"हाँ"*, *"स्वीकार"*, *"मंजूर"*, *"ठीक"*, *"done"*.
4. **State Transition**: Order transitions from `BID` ➔ `ACCEPTED`.

#### 📩 Workflow C: 4-Digit Handover Gate PIN & SMS Alerts
1. **Cryptographic Escrow PIN**: An SMS sends the farmer a unique **4-digit Gate PIN** (`4829`). When cold-chain transport arrives at the farmgate, the driver enters this PIN in the portal to release escrow funds.
2. **Biophysical Soil Alarms**: Real-time SMS alerts dispatched when field sensors detect stress conditions:
   - 🌊 **Waterlogging / Root Hypoxia**: *जलभराव! खेत में नमी अधिक है, मोटर तुरंत बंद करें।*
   - ☀️ **Severe Drought**: *सूखा तनाव! खेत में नमी कम है, तुरंत सिंचाई करें।*
   - ⚠️ **Excess Urea / Toxicity**: *अत्यधिक नाइट्रोजन! रासायनिक खाद तुरंत रोक दें।*
   - 🍂 **Nitrogen Starvation**: *नाइट्रोजन कमी! यूरिया या जीवामृत का छिड़काव करें।*
   - 🔒 **Phosphorus Lock**: *फास्फोरस कमी! जड़ विकास हेतु डीएपी या SSP खाद दें।*
   - 🥀 **Potassium Deficit**: *पोटाश कमी! फल चमक व मिठास हेतु 00:00:50 छिड़कें।*

---

### 3. 📱 Voice-First Mobile Application (Flutter 3.29)
* **Touch Ergonomics**: All actionable buttons are $\ge 74\text{px}$ in height with heavy haptic feedback (`HapticFeedback.heavyImpact()`).
* **5 Regional Indian Languages**: Hindi (हिंदी), Punjabi (ਪੰਜਾਬੀ), Marathi (मराठी), Tamil (தமிழ்), English (Indian).
* **Nordic UART BLE Controller**:
  - Real-time reactive scanning sheet using `StreamBuilder<List<ScanResult>>`.
  - Android system bonded & connected device support (`FlutterBluePlus.bondedDevices`).
  - 1-Tap Fast Auto-Connect (`⚡ KRISHI-AGRO-C6 से तुरंत जोड़ें`).
  - Persistent BLE Status Pill in the top navigation bar across all tabs (`C6 जुड़ा ✓` / `जोड़ें`).
* **Interactive Soil Simulator**:
  - Live sliders for Soil Moisture ($0\text{--}100\%$), Nitrogen ($0\text{--}200\text{ mg/kg}$), Phosphorus ($0\text{--}150\text{ mg/kg}$), and Potassium ($0\text{--}300\text{ mg/kg}$).
  - Adjusting sliders sends `SET:MOIST=` and `SET:NPK=` over BLE, triggering 5-second alert toasts on the physical OLED and buzzer beeps.
* **YOLO Leaf Camera Scanner**:
  - Live camera HUD with targeting reticle for diseased crop leaves.

---

### 4. 🔬 Edge Computer Vision (YOLOv8) & Gemini 3.8 Flash Agronomist
* **Custom YOLOv8 Model (`detection/best (1).pt`)**:
  - Trained specifically on 12 agricultural pathology classes:
    `ALS`, `Angular Leafspot`, `Anthracnose Fruit Rot`, `Bean Rust`, `Blossom Blight`, `Gray Mold`, `Leaf Spot`, `Powdery Mildew Fruit`, `Powdery Mildew Leaf`, `disease`, `leaf mold`, `spider mites`.
  - Real-time bounding box localization and confidence score evaluation.
* **Government-Subsidized Curative Remedies**:
  - Provides active chemical/organic ingredient, dilution ratio per 15L backpack pump, and government-mandated MRP price caps.
* **Gemini 3.8 Flash Conversational Agronomist**:
  - Delivers concise, conversational 2–3 sentence Hindi remedies with automated spoken text-to-speech.

---

### 5. 🌐 Full-Stack Web Platform & Fair-Price Escrow Marketplace
**Hosted on Vercel at: [https://kisanvaani-eight.vercel.app](https://kisanvaani-eight.vercel.app)**

* **Farmer Portal (`/farmer`)**:
  - Live biophysics dashboard, weather forecasts, regional anti-glut crop planning, and produce listing.
* **Explore Crops & Fertilizer Network (`/farmer/crops`)**:
  - Matches optimal crops to current soil NPK and moisture levels with a step-by-step fertilizer plan and nearby verified agro-dealer inventory with direct calling.
* **B2B Buyer / Restaurant Procurement Portal (`/buyer`)**:
  - Real-time inventory browsing, bulk order placement, multi-ring radial cold-chain logistics routing (R1 <80km, R2 80–300km, R3 >300km), transit temperature monitoring, and escrow release with 4-digit PIN verification.
* **Government District Portal (`/govt`)**:
  - Regional crop sowing quota balancer with traffic-light status (Green/Amber/Red) to prevent harvest gluts and catastrophic price crashes.
* **Financial Passport Exports**:
  - **KCC Bank Loan Telemetry Passport**: Certified soil health, irrigation history, and NPK stability record for bank credit officers.
  - **PMFBY Crop Insurance Loss Dossier**: Tamper-proof telemetry audit log proving waterlogging or drought events for fast-track insurance claim settlement.
  - Complete timestamped CSV ledger export.

---

## 🗄️ Supabase Database Architecture (16 Normalized Tables)

| Table | Description |
| :--- | :--- |
| `farmers` | Farmer registration, phone number, district, GPS coordinates, preferred language. |
| `plots` | Farm acreage, soil classification, active crop, GIS polygon boundaries. |
| `sowing_locks` | Quota Balancer: regional crop ceiling status (`GREEN`, `AMBER`, `RED`). |
| `buyer_preorders` | Forward contracts from institutional cloud kitchens and dark stores. |
| `sensor_readings` | ESP32 telemetry: Moisture %, Temperature, Humidity, N, P, K, pH, pump relay state. |
| `alerts` | Dynamic biophysical alerts with multilingual spoken text (`hi`, `pa`, `mr`, `ta`, `en`). |
| `dealers` | Verified local agro-dealers and distance calculations. |
| `remedies` | Recommended chemical & organic curative steps with government MRP price caps. |
| `dealer_leads` | Agro-dealer lead tracking and referral monetization log. |
| `listings` | Active marketplace crop listings, quality scores, and verification PINs. |
| `bids` | Buyer bids and procurement offers. |
| `orders` | Escrow state machine: `BID` ➔ `ACCEPTED` ➔ `IN_TRANSIT` ➔ `HANDOVER` ➔ `PAID`. |
| `order_events` | Immutable audit log of all order events and SMS/IVR notifications. |
| `farm_diary` | Immutable sensor diary for crop insurance proof. |
| `insurance_claims` | PMFBY insurance claims, evidence dossier URLs, and approval status. |
| `logistics_routes` | Radial delivery clusters (<80km, 80–300km, >300km) and transport costs. |

---

## 🏆 Hack with Delhi 4.0 Alignment

| Judging Category | KisanVaani Implementation |
| :--- | :--- |
| **Real-World Inclusivity & Impact** | Leaves no cultivator behind. Farmers with basic ₹1,000 keypad feature phones and zero mobile data can verbally list produce, accept buyer orders over automated Hindi phone calls, and receive biophysical alerts via **Sarvam AI & Twilio Voice/SMS**. |
| **Technical Depth & Integration** | Spans 5 distinct engineering layers: Next.js 15 PWA on Vercel, Flutter 3.29, YOLOv8 Edge Vision, Gemini 3.8 Flash NLU, Sarvam AI Bulbul TTS, Twilio Voice IVR & SMS, ESP32-C6 BLE 5.0 Hardware, and Supabase PostgreSQL 16. |
| **AI Innovation** | Domain-specific prompt engineering with Gemini 3.8 Flash, custom-trained 12-class edge computer vision on leaf pathologies, and Sarvam AI natural Indic Hindi speech synthesis with in-memory audio pre-warming (<15ms). |
| **Hardware & IoT Engineering** | Physical Seeed Studio XIAO ESP32-C6 stake with Nordic UART BLE 5.0, Crowtail capacitive moisture auto-calibration, DHT22 micro-climate monitoring, MPU-6050 physical tilt detection, dual-pin Active-LOW pump relay, 5-second OLED toast overlays, and automated safety cutoffs based on mathematical root hypoxia models. |
| **UI/UX Aesthetics & Accessibility** | Apple iOS 18 Design guidelines tailored for rural farmers with $\ge 74\text{px}$ touch ergonomics, high-contrast visual cues, tactile haptics, and zero-typing telephony accessibility. |

---

## 📜 License

Distributed under the MIT License. Built with ❤️ for Indian smallholder farmers.

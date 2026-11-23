'use client';

import React, { useState } from 'react';
import { useKisan } from '@/context/KisanContext';
import { 
  Cpu, 
  Power, 
  Droplet, 
  Zap, 
  Sparkles, 
  RotateCcw, 
  AlertTriangle, 
  CloudRain, 
  Sun, 
  Cloud, 
  PhoneCall, 
  Send, 
  Activity, 
  Sliders, 
  CheckCircle2, 
  Radio,
  ExternalLink,
  Bluetooth,
  Usb,
  Volume2,
  VolumeX,
  ShieldAlert,
  BatteryCharging,
  Wifi,
  ScreenShare
} from 'lucide-react';
import { soundFX } from '@/lib/audio-effects';

export function DemoControlPanel() {
  const { 
    sensorReading, 
    updateSensors, 
    isPumpActive, 
    togglePump, 
    autoCutoffActive,
    raiseMoisture, 
    raiseNPK, 
    setSoilParameters, 
    resetSensorsToNormal,
    dailyWeather,
    setDailyWeather,
    isCallingTwilio,
    triggerTwilioCall,
    physicsEvaluation,
    esp32State,
    connectESP32Bluetooth,
    connectESP32Serial,
    connectESP32Simulated,
    disconnectESP32,
    sendESP32Command,
    soundEnabled,
    setSoundEnabled
  } = useKisan();

  const [callFeedback, setCallFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'CONTROLS' | 'NPK' | 'WEATHER' | 'TWILIO'>('CONTROLS');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const handleConnectBLE = async () => {
    setIsConnecting(true);
    soundFX.click();
    try {
      await connectESP32Bluetooth();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectSerial = async () => {
    setIsConnecting(true);
    soundFX.click();
    try {
      await connectESP32Serial();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectSimulated = () => {
    soundFX.click();
    connectESP32Simulated();
  };

  const handleTriggerTwilio = async () => {
    soundFX.alertTone();
    setCallFeedback('📡 Twilio वॉइस कॉल डायल हो रहा है...');
    await sendESP32Command('CMD:CALL_EXPERT', 'TWILIO CALL', 'DR. R. SHARMA (+919876543210)');
    const result = await triggerTwilioCall('+919876543210');
    if (result.success) {
      setCallFeedback('✅ Twilio कॉल +919876543210 पर सफलतापूर्वक भेजी गई!');
    } else {
      setCallFeedback(`⚠️ कॉल अलर्ट भेजा गया: ${result.message}`);
    }
    setTimeout(() => setCallFeedback(null), 5000);
  };

  const handleWeatherSelect = (type: 'SUNNY' | 'RAIN_EXPECTED' | 'CLOUDY') => {
    soundFX.click();
    if (type === 'SUNNY') {
      setDailyWeather({
        temp: 34.0,
        humidity: 38,
        condition: 'SUNNY',
        rainProbability: 5,
        advisory: {
          hi: 'तेज धूप और उच्च तापमान। दोपहर में सिंचाई से बचें, शाम को नमी जांचें।',
          en: 'Intense sunlight and high temp. Avoid afternoon irrigation, check moisture at dusk.',
          pa: 'ਤੇਜ਼ ਧੁੱਪ ਅਤੇ ਗਰਮੀ। ਦੁਪਹਿਰ ਨੂੰ ਪਾਣੀ ਨਾ ਦਿਓ, ਸ਼ਾਮ ਨੂੰ ਨਮੀ ਚੈੱਕ ਕਰੋ।',
          mr: 'तीव्र ऊन आणि उष्णता. दुपारी पाणी देणे टाळा, संध्याकाळी ओलावा तपासा.',
          ta: 'அதிக வெயில். பிற்பகலில் பாசனம் செய்வதை தவிர்க்கவும்.',
        },
      });
      updateSensors({ air_temp: 34.0 });
      sendESP32Command('SET:WEATHER=SUNNY', 'WEATHER: SUNNY', '34C / 38% HUMIDITY');
    } else if (type === 'RAIN_EXPECTED') {
      setDailyWeather({
        temp: 26.5,
        humidity: 86,
        condition: 'RAIN_EXPECTED',
        rainProbability: 85,
        advisory: {
          hi: 'आगामी 24 घंटे में भारी वर्षा का अनुमान। पंप बंद रखें, जल निकासी सुनिश्चित करें।',
          en: 'Heavy rainfall forecast in next 24h. Keep pump OFF, inspect farm drainage.',
          pa: 'ਅਗਲੇ 24 ਘੰਟਿਆਂ ਵਿੱਚ ਭਾਰੀ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ। ਪੰਪ ਬੰਦ ਰੱਖੋ, ਪਾਣੀ ਦੀ ਨਿਕਾਸੀ ਦੇਖੋ।',
          mr: 'पुढील २४ तासांत मुसळधार पावसाचा अंदाज. पंप बंद ठेवा, पाण्याचा निचरा करा.',
          ta: 'அடுத்த 24 மணி நேரத்தில் பலத்த மழை பெய்யக்கூடும். பம்பை அணைக்கவும்.',
        },
      });
      const newM = Math.min(100, sensorReading.moisture + 20);
      updateSensors({ air_temp: 26.5, moisture: newM });
      sendESP32Command('SET:WEATHER=RAIN', 'WEATHER: RAIN', `26.5C / MOIST -> ${newM}%`);
    } else {
      setDailyWeather({
        temp: 28.0,
        humidity: 64,
        condition: 'CLOUDY',
        rainProbability: 30,
        advisory: {
          hi: 'बादल छाए रहेंगे और हवा सामान्य है। संतुलित स्थिति, सभी फसलें सुरक्षित हैं।',
          en: 'Overcast skies with mild breeze. Balanced weather, all crops safe.',
          pa: 'ਬੱਦਲਵਾਈ ਰਹੇਗੀ। ਅਨੁਕੂਲ ਮੌਸਮ, ਸਾਰੀਆਂ ਫ਼ਸਲਾਂ ਸੁਰੱਖਿਅਤ ਹਨ।',
          mr: 'ढगाळ वातावरण आणि अनुकूल हवा. सर्व पिके सुरक्षित आहेत.',
          ta: 'மேகமூட்டம் மற்றும் மிதமான காற்று. பயிர்கள் பாதுகாப்பாக உள்ளன.',
        },
      });
      updateSensors({ air_temp: 28.0 });
      sendESP32Command('SET:WEATHER=CLOUDY', 'WEATHER: CLOUDY', '28C / 64% HUMIDITY');
    }
  };

  const isConnected = esp32State.status === 'CONNECTED';

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-2xl border-2 border-slate-700/80 flex flex-col gap-5 w-full max-w-md mx-auto">
      {/* Controller Header with Hardware Status */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm tracking-wide text-white uppercase">
                ESP32-C6 Controller Link
              </h3>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              लाइव हार्डवेयर ब्लूटूथ व रिले नियंत्रक
            </p>
          </div>
        </div>

        {/* Audio Mute/Unmute Toggle */}
        <button
          onClick={() => {
            soundFX.click();
            setSoundEnabled(!soundEnabled);
          }}
          title={soundEnabled ? 'आवाज बंद करें (Mute)' : 'आवाज चालू करें (Unmute)'}
          className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1 font-bold ${
            soundEnabled
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {/* 1. ESP32-C6 Connection Status & Connect Buttons */}
      <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                isConnected ? 'bg-emerald-500' : (esp32State.status === 'CONNECTING' || esp32State.status === 'SCANNING' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500')
              }`}></span>
            </span>
            <span className="font-bold text-slate-200">
              {isConnected
                ? `जुड़ा हुआ: ${esp32State.deviceName || 'KRISHI-AGRO-C6'}`
                : esp32State.status === 'CONNECTING'
                ? 'कनेक्ट हो रहा है...'
                : esp32State.status === 'SCANNING'
                ? 'ब्लूटूथ स्कैनिंग...'
                : 'डिस्कनेक्ट (असंलग्न)'}
            </span>
          </div>

          {isConnected && (
            <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
              <span className="flex items-center gap-0.5"><Radio className="w-3 h-3" /> {esp32State.connectionType}</span>
              <span className="flex items-center gap-0.5"><BatteryCharging className="w-3 h-3 text-amber-400" /> {Math.round(esp32State.batteryPct)}%</span>
            </div>
          )}
        </div>

        {/* Connect Action Buttons */}
        {!isConnected ? (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleConnectBLE}
              disabled={isConnecting}
              className="py-2.5 px-2 bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all rounded-xl text-[11px] font-black text-white flex flex-col items-center justify-center gap-1 shadow-md shadow-blue-900/30 border border-blue-400/40"
            >
              <Bluetooth className="w-4 h-4 text-blue-200" />
              <span>BLE Connect</span>
            </button>

            <button
              onClick={handleConnectSerial}
              disabled={isConnecting}
              className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all rounded-xl text-[11px] font-black text-slate-200 flex flex-col items-center justify-center gap-1 border border-slate-700"
            >
              <Usb className="w-4 h-4 text-emerald-400" />
              <span>USB Serial</span>
            </button>

            <button
              onClick={handleConnectSimulated}
              className="py-2.5 px-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 transition-all rounded-xl text-[11px] font-black text-white flex flex-col items-center justify-center gap-1 border border-emerald-500/40 shadow-md shadow-emerald-950/40"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Live Sim Link</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono">
              सिंक: {esp32State.lastSyncTime || 'सक्रिय'}
            </span>
            <button
              onClick={() => disconnectESP32()}
              className="px-3 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-[10px] font-bold active:scale-95 transition-all"
            >
              डिस्कनेक्ट करें
            </button>
          </div>
        )}
      </div>

      {/* 2. Live 5-Second OLED Alert Display Simulator */}
      {esp32State.activeOledAlert && (
        <div className="bg-black rounded-2xl p-3 border-2 border-amber-400 shadow-lg shadow-amber-500/10 flex flex-col gap-2 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px] font-bold">
              <ScreenShare className="w-3.5 h-3.5" />
              <span>ESP32-C6 0.96&quot; OLED ALERT (5s)</span>
            </div>
            <span className="px-1.5 py-0.5 bg-amber-400 text-black text-[9px] font-black rounded uppercase">
              LIVE BROADCAST
            </span>
          </div>

          <div className="font-mono text-center py-1">
            <div className="text-amber-300 text-xs font-black uppercase tracking-wider">
              {esp32State.activeOledAlert.title}
            </div>
            <div className="text-white text-sm font-black mt-0.5">
              {esp32State.activeOledAlert.detail}
            </div>
          </div>

          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-400 h-1.5 rounded-full animate-[progress_5s_linear_forwards] w-full" />
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs for Controller */}
      <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
        <button
          onClick={() => { soundFX.click(); setActiveTab('CONTROLS'); }}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'CONTROLS' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          मुख्य
        </button>
        <button
          onClick={() => { soundFX.click(); setActiveTab('NPK'); }}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'NPK' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          NPK/pH
        </button>
        <button
          onClick={() => { soundFX.click(); setActiveTab('WEATHER'); }}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'WEATHER' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          मौसम
        </button>
        <button
          onClick={() => { soundFX.click(); setActiveTab('TWILIO'); }}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'TWILIO' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          कॉल
        </button>
      </div>

      {/* TAB 1: Main Controls (Quick Moisture & Relay Pump) */}
      {activeTab === 'CONTROLS' && (
        <div className="flex flex-col gap-4">
          {/* 5HP Submersible Pump Relay Switch */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                isPumpActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <Power className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-white">5HP पंप रिले (D9)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isPumpActive ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isPumpActive ? 'सक्रिय (ON)' : 'बंद (OFF)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {autoCutoffActive ? '⚠️ अत्यधिक नमी (>80%) कटऑफ!' : '1-क्लिक चालू/बंद (GPIO 20)'}
                </p>
              </div>
            </div>

            <button
              onClick={() => togglePump()}
              className={`px-5 py-3 rounded-2xl font-black text-xs active:scale-95 transition-all shadow-md ${
                isPumpActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
              }`}
            >
              {isPumpActive ? 'पंप रोकें' : 'पंप चलाएं'}
            </button>
          </div>

          {/* Moisture 1-Click Boost Buttons */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-cyan-400" />
                मिट्टी की नमी (Live Moisture)
              </span>
              <span className="text-lg font-black text-cyan-400 font-mono">
                {Math.round(sensorReading.moisture)}%
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="100"
              value={sensorReading.moisture}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSoilParameters({ moisture: val });
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => raiseMoisture(15)}
                className="py-3 px-3 bg-cyan-700 hover:bg-cyan-600 text-white font-black text-xs rounded-xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>+15% नमी बढ़ाएं</span>
              </button>
              <button
                onClick={() => raiseMoisture(-15)}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs rounded-xl active:scale-95 transition-all border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <span>-15% नमी घटाएं</span>
              </button>
            </div>
          </div>

          {/* Quick Scenario Presets */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                soundFX.click();
                setSoilParameters({ moisture: 18, n: 80, p: 30, k: 90, ph: 7.2 });
              }}
              className="p-2.5 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 border border-amber-800/50 rounded-xl text-[11px] font-bold text-center active:scale-95 transition-all"
            >
              सूखी मिट्टी (18%)
            </button>
            <button
              onClick={() => {
                soundFX.click();
                setSoilParameters({ moisture: 52, n: 145, p: 48, k: 185, ph: 6.8 });
              }}
              className="p-2.5 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 rounded-xl text-[11px] font-bold text-center active:scale-95 transition-all"
            >
              उचित संतुलित (52%)
            </button>
            <button
              onClick={() => {
                soundFX.click();
                setSoilParameters({ moisture: 88, n: 120, p: 40, k: 150, ph: 6.5 });
              }}
              className="p-2.5 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/50 rounded-xl text-[11px] font-bold text-center active:scale-95 transition-all"
            >
              बाढ़ चेतावनी (88%)
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: NPK & Soil Chemistry Sliders */}
      {activeTab === 'NPK' && (
        <div className="flex flex-col gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              NPK पोषक तत्व व pH नियंत्रक
            </span>
            <button
              onClick={() => raiseNPK(25)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black rounded-lg active:scale-95 transition-all"
            >
              +25 NPK बढ़ाएं
            </button>
          </div>

          {/* Nitrogen (N) */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-blue-400">नाइट्रोजन (N)</span>
              <span className="font-mono">{Math.round(sensorReading.n)} mg/kg</span>
            </div>
            <input
              type="range"
              min="0"
              max="250"
              value={sensorReading.n}
              onChange={(e) => setSoilParameters({ n: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Phosphorus (P) */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-purple-400">फास्फोरस (P)</span>
              <span className="font-mono">{Math.round(sensorReading.p)} mg/kg</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              value={sensorReading.p}
              onChange={(e) => setSoilParameters({ p: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Potassium (K) */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-amber-400">पोटाश (K)</span>
              <span className="font-mono">{Math.round(sensorReading.k)} mg/kg</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              value={sensorReading.k}
              onChange={(e) => setSoilParameters({ k: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* pH */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-emerald-400">मिट्टी का pH</span>
              <span className="font-mono">{sensorReading.ph.toFixed(1)} pH</span>
            </div>
            <input
              type="range"
              min="4.5"
              max="9.0"
              step="0.1"
              value={sensorReading.ph}
              onChange={(e) => setSoilParameters({ ph: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
      )}

      {/* TAB 3: Weather Simulation */}
      {activeTab === 'WEATHER' && (
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-300">
            दैनिक मौसम परिदृश्य चयन करें (Daily Weather):
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleWeatherSelect('SUNNY')}
              className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition-all text-xs font-bold active:scale-95 ${
                dailyWeather.condition === 'SUNNY'
                  ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-400" />
              <span>तेज धूप (34°C)</span>
            </button>

            <button
              onClick={() => handleWeatherSelect('RAIN_EXPECTED')}
              className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition-all text-xs font-bold active:scale-95 ${
                dailyWeather.condition === 'RAIN_EXPECTED'
                  ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <CloudRain className="w-5 h-5 text-cyan-400" />
              <span>भारी वर्षा (26°C)</span>
            </button>

            <button
              onClick={() => handleWeatherSelect('CLOUDY')}
              className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition-all text-xs font-bold active:scale-95 ${
                dailyWeather.condition === 'CLOUDY' || dailyWeather.condition === 'OPTIMAL'
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Cloud className="w-5 h-5 text-emerald-400" />
              <span>संतुलित (28°C)</span>
            </button>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300">
            <div className="font-bold text-emerald-400 mb-1">कृषि मौसम सलाह:</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {dailyWeather.advisory.hi}
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: Twilio Voice Call Trigger */}
      {activeTab === 'TWILIO' && (
        <div className="flex flex-col gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-emerald-400 animate-bounce" />
            <div>
              <div className="font-black text-xs text-white">Twilio विशेषज्ञ वॉयस कॉल</div>
              <div className="text-[10px] text-slate-400">ESP32 स्क्रीन 6 या यहाँ से 1-क्लिक कॉल</div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            जब फोन ब्लूटूथ से ESP32-C6 से जुड़ा हो, स्क्रीन 6 पर बटन देर तक दबाने पर या यहाँ क्लिक करने पर Twilio द्वारा किसान विशेषज्ञ को ऑटोमैटिक कॉल लगाई जाती है।
          </p>

          <button
            onClick={handleTriggerTwilio}
            disabled={isCallingTwilio}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-black text-xs rounded-xl active:scale-95 transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{isCallingTwilio ? 'Twilio डायल हो रहा है...' : 'अभी विशेषज्ञ को Twilio कॉल करें'}</span>
          </button>

          {callFeedback && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-[11px] font-bold rounded-xl text-center">
              {callFeedback}
            </div>
          )}
        </div>
      )}

      {/* Reset System Button */}
      <button
        onClick={() => {
          soundFX.click();
          resetSensorsToNormal();
          sendESP32Command('CMD:REZERO', 'SYSTEM RESET', 'NORMAL BASELINE RESTORED');
        }}
        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>रीसेट करें (Reset All to Normal Baseline)</span>
      </button>
    </div>
  );
}

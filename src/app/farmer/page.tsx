'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useKisan } from '@/context/KisanContext';
import { 
  Droplet, 
  Zap, 
  Power, 
  Volume2, 
  CheckCircle2, 
  AlertTriangle, 
  Stethoscope, 
  Store, 
  Bot, 
  Sprout, 
  ArrowRight, 
  PhoneCall,
  Sun,
  CloudRain,
  Cloud,
  Thermometer,
  ShieldCheck,
  Bluetooth 
} from 'lucide-react';

export default function FarmerHomePage() {
  const { 
    lang, 
    speak, 
    sensorReading, 
    isPumpActive, 
    togglePump, 
    autoCutoffActive,
    dailyWeather,
    activeAlerts,
    triggerTwilioCall,
    isCallingTwilio,
    esp32State,
    connectESP32Bluetooth
  } = useKisan();

  const texts: Record<string, {
    greeting: string;
    farmerName: string;
    fieldLocation: string;
    healthyTitle: string;
    healthySub: string;
    alertTitle: string;
    alertSub: string;
    pumpTurnOn: string;
    pumpTurnOff: string;
    pumpRunning: string;
    pumpStopped: string;
    doctorTile: string;
    doctorDesc: string;
    cropsTile: string;
    cropsDesc: string;
    assistantTile: string;
    assistantDesc: string;
    sellTile: string;
    sellDesc: string;
    expertCallBtn: string;
  }> = {
    hi: {
      greeting: 'नमस्ते',
      farmerName: 'रामेश्वर सिंह',
      fieldLocation: 'सोनीपत, हरियाणा · 4.5 एकड़ खेत',
      healthyTitle: 'खेत पूर्णतः स्वस्थ है',
      healthySub: 'जमीन में नमी व खाद का स्तर संतुलित है।',
      alertTitle: '⚠️ सावधान: जलभराव खतरा!',
      alertSub: 'नमी ज्यादा है। मोटर बंद रखें और जल निकासी देखें।',
      pumpTurnOn: '⚡ 5HP मोटर चालू करें',
      pumpTurnOff: '🔴 मोटर तुरंत बंद करें',
      pumpRunning: 'मोटर चालू है 💧 (Coil: Active)',
      pumpStopped: 'मोटर बंद है ⚡ (Standby)',
      doctorTile: 'पौधा डॉक्टर',
      doctorDesc: 'पत्ते की फोटो व बीमारी पहचान',
      cropsTile: 'फसलें व खाद',
      cropsDesc: 'मिट्टी अनुसार फसल व पास के विक्रेता',
      assistantTile: 'AI कृषि मित्र',
      assistantDesc: 'डॉक्टर से बोलकर सलाह लें',
      sellTile: 'मंडी बिक्री',
      sellDesc: 'सीधे ₹60/kg पर फसल बेचें',
      expertCallBtn: '📞 कृषि विशेषज्ञ से बात करें (Twilio Call)',
    },
    pa: {
      greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ',
      farmerName: 'ਰਾਮੇਸ਼ਵਰ ਸਿੰਘ',
      fieldLocation: 'ਸੋਨੀਪਤ, ਹਰਿਆਣਾ · 4.5 ਏਕੜ',
      healthyTitle: 'ਖੇਤ ਬਿਲਕੁਲ ਤੰਦਰੁਸਤ ਹੈ',
      healthySub: 'ਜ਼ਮੀਨ ਵਿੱਚ ਨਮੀ ਅਤੇ ਖਾਦ ਸਹੀ ਹੈ।',
      alertTitle: '⚠️ ਸਾਵਧਾਨ: ਪਾਣੀ ਜ਼ਿਆਦਾ ਹੈ!',
      alertSub: 'ਨਮੀ ਬਹੁਤ ਵੱਧ ਹੈ। ਮੋਟਰ ਬੰਦ ਰੱਖੋ।',
      pumpTurnOn: '⚡ 5HP ਮੋਟਰ ਚਾਲੂ ਕਰੋ',
      pumpTurnOff: '🔴 ਮੋਟਰ ਬੰਦ ਕਰੋ',
      pumpRunning: 'ਮੋਟਰ ਚੱਲ ਰਹੀ ਹੈ 💧',
      pumpStopped: 'ਮੋਟਰ ਬੰਦ ਹੈ ⚡',
      doctorTile: 'ਪੌਧਾ ਡਾਕਟਰ',
      doctorDesc: 'ਫੋਟੋ ਖਿੱਚੋ ਤੇ ਰੋਗ ਪਛਾਣੋ',
      cropsTile: 'ਫ਼ਸਲਾਂ ਤੇ ਖਾਦ',
      cropsDesc: 'ਮਿੱਟੀ ਅਨੁਸਾਰ ਫ਼ਸਲ ਤੇ ਡੀਲਰ',
      assistantTile: 'AI ਮਿੱਤਰ',
      assistantDesc: 'ਬੋਲ ਕੇ ਸਲਾਹ ਲਵੋ',
      sellTile: 'ਮੰਡੀ ਵੇਚੋ',
      sellDesc: 'ਸਿੱਧਾ ਮੰਡੀ ਵਿੱਚ ਵੇਚੋ',
      expertCallBtn: '📞 ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰੋ (Twilio Call)',
    },
    mr: {
      greeting: 'नमस्कार',
      farmerName: 'रामेश्वर सिंह',
      fieldLocation: 'सोनीपत, हरियाणा · ४.५ एकर',
      healthyTitle: 'शेत पूर्णपणे निरोगी आहे',
      healthySub: 'जमिनीत ओलावा आणि खत संतुलित आहे.',
      alertTitle: '⚠️ सावधान: पाण्याचा निचरा करा!',
      alertSub: 'ओलावा जास्त आहे. मोटर बंद ठेवा.',
      pumpTurnOn: '⚡ ५HP मोटर सुरू करा',
      pumpTurnOff: '🔴 मोटर बंद करा',
      pumpRunning: 'मोटर सुरू आहे 💧',
      pumpStopped: 'मोटर बंद आहे ⚡',
      doctorTile: 'पीक डॉक्टर',
      doctorDesc: 'पानाचा फोटो काढून रोग ओळखा',
      cropsTile: 'पिके व खते',
      cropsDesc: 'मातीनुसार पिके व स्थानिक विक्रेते',
      assistantTile: 'AI मित्र',
      assistantDesc: 'बोलून सल्ला घ्या',
      sellTile: 'बाजार विक्री',
      sellDesc: 'थेट बाजारात विका',
      expertCallBtn: '📞 तज्ज्ञांशी बोला (Twilio Call)',
    },
    ta: {
      greeting: 'வணக்கம்',
      farmerName: 'ராமேஷ்வர் சிங்',
      fieldLocation: 'சோனிபட், ஹரியானா · 4.5 ஏக்கர்',
      healthyTitle: 'வயல் ஆரோக்கியமாக உள்ளது',
      healthySub: 'மண்ணில் ஈரப்பதமும் உரமும் சீராக உள்ளது.',
      alertTitle: '⚠️ எச்சரிக்கை: அதிக ஈரப்பதம்!',
      alertSub: 'நீர் அதிகம். மோட்டாரை நிறுத்துங்கள்.',
      pumpTurnOn: '⚡ 5HP மோட்டார் இயக்கவும்',
      pumpTurnOff: '🔴 மோட்டார் நிறுத்தவும்',
      pumpRunning: 'மோட்டார் இயங்குகிறது 💧',
      pumpStopped: 'மோட்டார் நிறுத்தப்பட்டது ⚡',
      doctorTile: 'பயிர் மருத்துவர்',
      doctorDesc: 'இலை படம் எடுத்து நோய் அறிய',
      cropsTile: 'பயிர்கள் & உரம்',
      cropsDesc: 'மண் ஏற்ற பயிர் மற்றும் உரம்',
      assistantTile: 'AI தோழன்',
      assistantDesc: 'பேசி ஆலோசனை பெற',
      sellTile: 'சந்தை விற்பனை',
      sellDesc: 'நேரடியாக விற்க',
      expertCallBtn: '📞 நிபுணரை அழைக்கவும் (Twilio)',
    },
    en: {
      greeting: 'Welcome',
      farmerName: 'Rameshwar Singh',
      fieldLocation: 'Sonipat, Haryana · 4.5 Acre Farm',
      healthyTitle: 'Field is 100% Healthy',
      healthySub: 'Soil moisture and nutrient levels are balanced.',
      alertTitle: '⚠️ Warning: High Moisture Hazard!',
      alertSub: 'Excessive water. Keep motor OFF to avoid root rot.',
      pumpTurnOn: '⚡ Turn ON 5HP Motor',
      pumpTurnOff: '🔴 Turn OFF Motor',
      pumpRunning: 'Motor is RUNNING 💧',
      pumpStopped: 'Motor is OFF ⚡',
      doctorTile: 'Crop Doctor',
      doctorDesc: 'Scan leaves to detect disease',
      cropsTile: 'Explore Crops',
      cropsDesc: 'Soil-matched crops & nearby fertilizer sellers',
      assistantTile: 'AI Assistant',
      assistantDesc: 'Speak directly with AI Doctor',
      sellTile: 'Sell Produce',
      sellDesc: 'Direct B2B Mandi trading at ₹60/kg',
      expertCallBtn: '📞 Call Agri Expert via Twilio',
    },
  };

  const t = texts[lang] || texts.hi;
  const isHighMoisture = sensorReading.moisture > 80;

  const handleSpeakOverview = () => {
    const text = `${t.farmerName} जी, आपके खेत में नमी ${sensorReading.moisture.toFixed(0)} प्रतिशत है। ${isHighMoisture ? t.alertSub : t.healthySub}`;
    speak(text);
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-300">
      
      {/* Farmer Profile Header */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-semibold">{t.greeting},</span>
            <span className="text-sm font-extrabold text-gray-900">{t.farmerName}</span>
            <span title="सत्यापित किसान">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </span>
          </div>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">{t.fieldLocation}</p>
        </div>

        <button
          onClick={handleSpeakOverview}
          className="p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-all active:scale-95 cursor-pointer shadow-xs"
          title="खेत का हाल सुनें"
        >
          <Volume2 className="w-4 h-4 text-emerald-700" />
        </button>
      </div>

      {/* ESP32-C6 Hardware Connection Status Pill */}
      <div className={`p-3 rounded-2xl border transition-all flex items-center justify-between shadow-xs ${
        esp32State.status === 'CONNECTED'
          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
            esp32State.status === 'CONNECTED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-200 text-slate-600'
          }`}>
            <Bluetooth className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black">
              <span>ESP32-C6 नियंत्रक:</span>
              <span className={esp32State.status === 'CONNECTED' ? 'text-emerald-700' : 'text-slate-600'}>
                {esp32State.status === 'CONNECTED' ? (esp32State.deviceName || 'सक्रिय जुड़ाव (BLE)') : 'असंलग्न (Offline)'}
              </span>
            </div>
            <p className="text-[10px] text-gray-500">
              {esp32State.status === 'CONNECTED'
                ? 'लाइव टेलीमेट्री सिंक · रिले D9 सक्रिय · OLED अलर्ट लिंक'
                : 'खेत में सेंसर व OLED से जुड़ने के लिए कनेक्ट करें'}
            </p>
          </div>
        </div>

        {esp32State.status === 'CONNECTED' ? (
          <span className="px-2 py-1 bg-emerald-200 text-emerald-900 text-[10px] font-black rounded-lg uppercase">
            ONLINE
          </span>
        ) : (
          <button
            onClick={() => connectESP32Bluetooth()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black rounded-xl active:scale-95 transition-all shadow-sm flex items-center gap-1"
          >
            <span>जोड़ें</span>
          </button>
        )}
      </div>

      {/* Live Soil & Climate Telemetry Card */}
      <div className="bg-gradient-to-br from-[#132A1C] via-[#0E4424] to-[#0B7A3B] text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-white/15 text-emerald-200 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ESP32-C6 लाइव टेलीमेट्री
            </span>

            <span className="text-xs font-bold text-emerald-100/90">
              {sensorReading.air_temp.toFixed(1)}°C · {sensorReading.ph.toFixed(1)} pH
            </span>
          </div>

          {/* Moisture Highlight */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-200/90 font-bold block mb-0.5">मिट्टी की नमी (Moisture)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black tracking-tight">{sensorReading.moisture.toFixed(0)}</span>
                <span className="text-xl font-bold text-emerald-300">%</span>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                isHighMoisture
                  ? 'bg-red-500/90 text-white animate-pulse'
                  : 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
              }`}>
                {isHighMoisture ? '⚠️ जलभराव' : '✓ उत्तम नमी'}
              </span>
              <p className="text-[11px] text-emerald-200/80 mt-1">
                NPK: {sensorReading.n}:{sensorReading.p}:{sensorReading.k}
              </p>
            </div>
          </div>

          {/* Weather Strip */}
          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100">
            <div className="flex items-center gap-2">
              {dailyWeather.condition === 'RAIN_EXPECTED' ? (
                <CloudRain className="w-4 h-4 text-blue-300" />
              ) : dailyWeather.condition === 'SUNNY' ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Cloud className="w-4 h-4 text-emerald-200" />
              )}
              <span className="font-bold">आज: {dailyWeather.temp}°C ({dailyWeather.humidity}% आर्द्रता)</span>
            </div>

            <span className="text-[11px] text-emerald-200">
              बारिश: {dailyWeather.rainProbability}%
            </span>
          </div>

        </div>
      </div>

      {/* 5HP Tubewell Motor Control Card */}
      <div className={`p-4 rounded-3xl border transition-all ${
        autoCutoffActive || (isHighMoisture && !isPumpActive)
          ? 'bg-red-50/80 border-red-200'
          : isPumpActive
          ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
          : 'bg-white border-gray-200/90 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-2xl ${
              isPumpActive
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-gray-100 text-gray-700'
            }`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-gray-900">5HP नलकूप मोटर (Relay D9)</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isPumpActive ? t.pumpRunning : t.pumpStopped}
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            isPumpActive
              ? 'bg-emerald-200 text-emerald-900'
              : autoCutoffActive
              ? 'bg-red-200 text-red-900'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {isPumpActive ? 'चालू' : autoCutoffActive ? 'कट-ऑफ' : 'बंद'}
          </span>
        </div>

        {/* Auto cutoff feedback banner */}
        {isHighMoisture && (
          <div className="mb-3 p-2.5 bg-red-100/90 border border-red-300 rounded-2xl flex items-center gap-2 text-xs font-bold text-red-900">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>सुरक्षा नियम: नमी {sensorReading.moisture.toFixed(0)}% पर पंप स्वतः बंद रहता है।</span>
          </div>
        )}

        {/* Big 72px Tactile Actuation Button */}
        <button
          onClick={togglePump}
          className={`w-full min-h-[58px] py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all cursor-pointer ${
            isPumpActive
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : isHighMoisture
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#132A1C] hover:bg-[#0B7A3B] text-white'
          }`}
        >
          <Power className="w-5 h-5" />
          <span>{isPumpActive ? t.pumpTurnOff : t.pumpTurnOn}</span>
        </button>
      </div>

      {/* 4 Clean Primary Feature Tiles (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Tile 1: Explore Crops */}
        <Link
          href="/farmer/crops"
          className="p-4 bg-white hover:bg-emerald-50/50 border border-gray-200/90 rounded-3xl shadow-sm transition-all active:scale-95 cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-100/80 text-emerald-800 rounded-2xl">
              <Sprout className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-emerald-700 transition-all" />
          </div>
          <div>
            <div className="font-black text-sm text-gray-900">{t.cropsTile}</div>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">{t.cropsDesc}</p>
          </div>
        </Link>

        {/* Tile 2: AI Doctor Voice Assistant */}
        <Link
          href="/farmer/assistant"
          className="p-4 bg-white hover:bg-emerald-50/50 border border-gray-200/90 rounded-3xl shadow-sm transition-all active:scale-95 cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-100/80 text-blue-800 rounded-2xl">
              <Bot className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-blue-700 transition-all" />
          </div>
          <div>
            <div className="font-black text-sm text-gray-900">{t.assistantTile}</div>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">{t.assistantDesc}</p>
          </div>
        </Link>

        {/* Tile 3: Plant Doctor Scan */}
        <Link
          href="/farmer/alert"
          className="p-4 bg-white hover:bg-emerald-50/50 border border-gray-200/90 rounded-3xl shadow-sm transition-all active:scale-95 cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-100/80 text-amber-800 rounded-2xl">
              <Stethoscope className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-amber-700 transition-all" />
          </div>
          <div>
            <div className="font-black text-sm text-gray-900">{t.doctorTile}</div>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">{t.doctorDesc}</p>
          </div>
        </Link>

        {/* Tile 4: Mandi Sell */}
        <Link
          href="/farmer/sell"
          className="p-4 bg-white hover:bg-emerald-50/50 border border-gray-200/90 rounded-3xl shadow-sm transition-all active:scale-95 cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-100/80 text-purple-800 rounded-2xl">
              <Store className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-purple-700 transition-all" />
          </div>
          <div>
            <div className="font-black text-sm text-gray-900">{t.sellTile}</div>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">{t.sellDesc}</p>
          </div>
        </Link>

      </div>

      {/* Emergency Twilio Call Action Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 rounded-3xl shadow-md flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-black flex items-center gap-1.5 text-blue-200">
            <PhoneCall className="w-3.5 h-3.5 text-blue-300" />
            <span>आपातकालीन विशेषज्ञ सहायता</span>
          </div>
          <p className="text-[11px] text-blue-100/80">
            ESP32 बटन होल्ड करने पर या यहाँ दबाने पर सीधा कॉल कनेक्ट होगा।
          </p>
        </div>

        <button
          onClick={() => triggerTwilioCall('+919876543210')}
          disabled={isCallingTwilio}
          className="px-4 py-2.5 rounded-2xl bg-white hover:bg-blue-50 text-blue-950 font-black text-xs shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
        >
          {isCallingTwilio ? 'डायल हो रहा है...' : 'कॉल करें'}
        </button>
      </div>

    </div>
  );
}

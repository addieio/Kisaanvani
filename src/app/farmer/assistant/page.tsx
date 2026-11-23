'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useKisan } from '@/context/KisanContext';
import { startListening, stopActiveListening, requestMicrophonePermission, speakText, stopSpeaking } from '@/lib/speech';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'FARMER' | 'DOCTOR';
  text: string;
  speechText?: string;
  timestamp: string;
}

const SAMPLE_QUICK_QUESTIONS: Record<string, string[]> = {
  hi: [
    'टमाटर के पत्तों पर काले गोल धब्बे हैं, क्या दवा छिड़कें?',
    'आलू में झुलसा रोग की सही दवा व 15 लीटर पंप की मात्रा बताएं।',
    'गेहूं में पीलापन आ रहा है, कौन सी खाद डालें?',
    'खेत में ज्यादा पानी भर गया है, जड़ सड़न से कैसे बचाएं?',
  ],
  pa: [
    'ਟਮਾਟਰ ਦੇ ਪੱਤਿਆਂ ਤੇ ਕਾਲੇ ਧੱਬੇ ਹਨ, ਕੀ ਛਿੜਕਾਅ ਕਰੀਏ?',
    'ਕਣਕ ਵਿੱਚ ਪੀਲਾਪਣ ਆ ਰਿਹਾ ਹੈ, ਕਿਹੜੀ ਖਾਦ ਪਾਈਏ?',
    'ਆਲੂ ਵਿੱਚ ਝੁਲਸ ਰੋਗ ਦੀ ਸਹੀ ਦਵਾਈ ਤੇ ਮਾਤਰਾ ਦੱਸੋ।',
  ],
  mr: [
    'टोमॅटोच्या पानांवर काळे डाग पडले आहेत, कोणते औषध फवारावे?',
    'गव्हामध्ये पिवळेपणा येत आहे, कोणते खत द्यावे?',
    'बटाट्यावरील करपा रोगासाठी योग्य औषध आणि प्रमाण सांगा.',
  ],
  ta: [
    'தக்காளி இலைகளில் கரும்புள்ளிகள் உள்ளன, என்ன மருந்து தெளிக்க வேண்டும்?',
    'கோதுமையில் மஞ்சள் நிறம் வருகிறது, என்ன உரம் இட வேண்டும்?',
  ],
  en: [
    'Dark spots on tomato leaves, what spray should I use?',
    'Wheat leaves turning yellow, which fertilizer is needed?',
    'Soil is waterlogged, how to prevent root rot?',
  ],
};

export default function AssistantDoctorPage() {
  const { lang, speak } = useKisan();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'DOCTOR',
      text: lang === 'en'
        ? 'Namaste Farmer Brother! I am your AI Crop Doctor powered by Gemini. Tap the microphone and tell me your crop issue in your own language.'
        : 'नमस्ते किसान भाई! मैं आपका एआई कृषि डॉक्टर हूँ। नीचे माइक दबाकर अपनी फसल की समस्या अपनी भाषा में बताएं।',
      speechText: lang === 'en'
        ? 'Namaste Farmer Brother! I am your AI Crop Doctor. Tap the microphone to talk.'
        : 'नमस्ते किसान भाई! मैं आपका एआई कृषि डॉक्टर हूँ। माइक दबाकर अपनी समस्या बोलें।',
      timestamp: 'अभी',
    },
  ]);

  const [isListening, setIsListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading]);

  // Handle consultation query
  const handleConsultDoctor = async (queryText: string) => {
    if (!queryText.trim() || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'FARMER',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLiveTranscript('');
    setIsAiLoading(true);
    setMicError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText,
          lang: lang,
        }),
      });

      const data = await res.json();
      const replyText = data.text || 'किसान भाई, खेत में ट्राइकोडर्मा विरिडी या नीम तेल 5 मि.ली. प्रति लीटर पानी में मिलाकर छिड़काव करें।';
      const spoken = data.speech_text || replyText;

      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'DOCTOR',
        text: replyText,
        speechText: spoken,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Speak response automatically
      setIsPlayingAudio(true);
      speakText(spoken, lang).finally(() => setIsPlayingAudio(false));
    } catch (err: any) {
      console.error('Doctor consultation error:', err);
      const fallbackReply = 'किसान भाई, 15 लीटर पंप में 30 ग्राम मैन्कोजेब या 5 मि.ली. नीम तेल मिलाकर सुबह के समय छिड़कें।';
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-err-' + Date.now(),
          sender: 'DOCTOR',
          text: fallbackReply,
          speechText: fallbackReply,
          timestamp: 'अभी',
        },
      ]);
      speakText(fallbackReply, lang);
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleMicListening = async () => {
    if (isListening) {
      stopActiveListening();
      setIsListening(false);
      return;
    }

    setMicError(null);
    stopSpeaking();
    setIsPlayingAudio(false);

    // Explicitly verify microphone permission
    const hasPerm = await requestMicrophonePermission();
    if (!hasPerm) {
      setMicError('माइक अनुमति अस्वीकृत। ब्राउज़र सेटिंग्स में माइक्रोफोन चालू करें या नीचे सवाल चुनें।');
      return;
    }

    setLiveTranscript('');
    setIsListening(true);

    const stop = startListening(
      lang,
      (result) => {
        setLiveTranscript(result.transcript);
        if (result.isFinal && result.transcript.trim()) {
          setIsListening(false);
          handleConsultDoctor(result.transcript);
        }
      },
      (error) => {
        console.warn('Speech error:', error);
        setMicError(error);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const quickQuestions = SAMPLE_QUICK_QUESTIONS[lang] || SAMPLE_QUICK_QUESTIONS.hi;

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-300">
      
      {/* Header Card */}
      <div className="bg-gradient-to-r from-[#132A1C] via-[#0E4424] to-[#0B7A3B] text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl ring-1 ring-white/20">
              <Bot className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight">AI कृषि डॉक्टर</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  GEMINI 2.5
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">बोलकर पूछें · क्षेत्रीय भाषा में सटीक समाधान</p>
            </div>
          </div>

          {isPlayingAudio && (
            <button
              onClick={() => {
                stopSpeaking();
                setIsPlayingAudio(false);
              }}
              className="p-2 rounded-2xl bg-white/20 text-white hover:bg-white/30 transition-all flex items-center gap-1 text-xs font-bold"
              title="ऑडियो रोकें"
            >
              <VolumeX className="w-4 h-4 text-red-300" />
              <span>रोकें</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Microphone Hub & Voice Visualizer */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
        
        {/* Animated Radial Waves When Mic Active */}
        <div className="relative mb-3 flex items-center justify-center">
          {isListening && (
            <>
              <div className="absolute w-28 h-28 rounded-full bg-emerald-400/20 animate-ping" />
              <div className="absolute w-24 h-24 rounded-full bg-emerald-500/30 animate-pulse" />
            </>
          )}

          <button
            onClick={toggleMicListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 cursor-pointer relative z-10 ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-300 animate-pulse'
                : 'bg-gradient-to-br from-emerald-600 to-[#132A1C] hover:from-emerald-700 hover:to-[#0B7A3B] text-white ring-4 ring-emerald-100'
            }`}
            aria-label="Toggle voice input"
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        {/* Status Prompt */}
        <div className="space-y-1">
          <div className="text-sm font-black text-gray-900">
            {isListening
              ? 'सुन रहे हैं... कृपया अपनी समस्या बोलें'
              : isAiLoading
              ? 'डॉक्टर सलाह तैयार कर रहे हैं...'
              : 'माइक दबाएं और बोलें (Tap to Speak)'}
          </div>
          <p className="text-xs text-gray-500">
            {isListening
              ? liveTranscript || 'आवाज़ पहचान चालू है...'
              : 'दवा, खाद, बीमारी या सिंचाई संबंधी कोई भी सवाल पूछें'}
          </p>
        </div>

        {/* Mic Error Prompt */}
        {micError && (
          <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{micError}</span>
          </div>
        )}
      </div>

      {/* 1-Tap Quick Question Chips for Easy Demo */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          त्वरित सवाल (1-क्लिक पूछें):
        </span>

        <div className="flex flex-col gap-1.5">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleConsultDoctor(q)}
              disabled={isAiLoading}
              className="p-3 bg-white hover:bg-emerald-50/70 border border-gray-200/90 rounded-2xl text-left text-xs font-bold text-gray-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-between shadow-xs cursor-pointer group"
            >
              <span className="truncate pr-2">{q}</span>
              <Send className="w-3.5 h-3.5 text-emerald-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Conversation Stream */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
          बातचीत का इतिहास (Doctor Consultation)
        </span>

        <div className="space-y-3">
          {messages.map((m) => {
            const isDoctor = m.sender === 'DOCTOR';
            return (
              <div
                key={m.id}
                className={`p-4 rounded-3xl border transition-all ${
                  isDoctor
                    ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-900 ml-6 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isDoctor ? 'text-emerald-800' : 'text-gray-500'
                  }`}>
                    {isDoctor ? <Bot className="w-3.5 h-3.5 text-emerald-600" /> : <MessageSquare className="w-3.5 h-3.5 text-blue-500" />}
                    {isDoctor ? 'एआई कृषि डॉक्टर' : 'आप (किसान)'}
                  </span>

                  {isDoctor && m.speechText && (
                    <button
                      onClick={() => {
                        stopSpeaking();
                        speakText(m.speechText || m.text, lang);
                      }}
                      className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>पुनः सुनें</span>
                    </button>
                  )}
                </div>

                <p className="text-xs leading-relaxed font-medium">
                  {m.text}
                </p>

                <div className="text-[10px] text-gray-400 text-right mt-1">
                  {m.timestamp}
                </div>
              </div>
            );
          })}

          {isAiLoading && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center gap-3 animate-pulse">
              <Bot className="w-5 h-5 text-emerald-600 animate-spin" />
              <span className="text-xs font-bold text-emerald-900">डॉक्टर निदान कर रहे हैं...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Manual Keyboard Input Bar (Fallback) */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-md flex items-center gap-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConsultDoctor(inputQuery);
          }}
          placeholder="या यहाँ लिखकर पूछें (Type question)..."
          className="flex-1 px-3 py-2 text-xs bg-transparent outline-none text-gray-800 font-medium"
        />

        <button
          onClick={() => handleConsultDoctor(inputQuery)}
          disabled={!inputQuery.trim() || isAiLoading}
          className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}


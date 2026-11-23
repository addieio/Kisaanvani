// KisanVaani Indic Speech Engine (TTS & STT with Smart Fallback)
import { LanguageCode } from './types';

export interface SpokenCaptionEvent {
  text: string;
  lang: LanguageCode;
  timestamp: number;
}

type CaptionListener = (event: SpokenCaptionEvent) => void;
const captionListeners: Set<CaptionListener> = new Set();

export function subscribeToCaptions(listener: CaptionListener): () => void {
  captionListeners.add(listener);
  return () => {
    captionListeners.delete(listener);
  };
}

function broadcastCaption(text: string, lang: LanguageCode) {
  captionListeners.forEach((listener) => {
    try {
      listener({ text, lang, timestamp: Date.now() });
    } catch (e) {
      console.error('Caption listener error', e);
    }
  });
}

const LANG_VOICE_MAP: Record<LanguageCode, string[]> = {
  hi: ['hi-IN', 'hi', 'Hindi', 'Google हिन्दी'],
  en: ['en-IN', 'en-GB', 'en-US', 'en'],
  pa: ['pa-IN', 'pa', 'Punjabi', 'pan', 'hi-IN'], // smart fallback to hi-IN
  mr: ['mr-IN', 'mr', 'Marathi', 'mar', 'hi-IN'], // smart fallback to hi-IN
  ta: ['ta-IN', 'ta', 'Tamil', 'Google தமிழ்', 'hi-IN'], // smart fallback to hi-IN
};

/**
 * Text-to-Speech (TTS) synthesizer with smart Indic fallback
 */
export function speakText(text: string, lang: LanguageCode = 'hi'): Promise<void> {
  return new Promise((resolve) => {
    broadcastCaption(text, lang);

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92; // Slightly measured pace for rural comprehension
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferredTags = LANG_VOICE_MAP[lang] || ['hi-IN'];

      // Attempt to find best voice
      let chosenVoice: SpeechSynthesisVoice | undefined;
      for (const tag of preferredTags) {
        chosenVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().includes(tag.toLowerCase()) ||
            v.name.toLowerCase().includes(tag.toLowerCase())
        );
        if (chosenVoice) break;
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      } else {
        utterance.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error', e);
      resolve();
    }
  });
}

/**
 * Stop any active TTS audio
 */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * Speech Recognition (STT) interface
 */
export interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

let activeRecognitionInstance: any = null;

export function stopActiveListening() {
  if (activeRecognitionInstance) {
    try {
      activeRecognitionInstance.abort();
    } catch {
      // ignore
    }
    activeRecognitionInstance = null;
  }
}

export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return true; // Fallback to SpeechRecognition default
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Release tracks immediately
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (err) {
    console.warn('Microphone permission not granted:', err);
    return false;
  }
}

export function startListening(
  lang: LanguageCode,
  onResult: (result: VoiceRecognitionResult) => void,
  onError: (error: string) => void,
  onEnd: () => void
): () => void {
  if (typeof window === 'undefined') {
    onError('Window not available');
    return () => {};
  }

  // Abort any existing instance to avoid InvalidStateError
  stopActiveListening();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Speech recognition not supported in this browser');
    return () => {};
  }

  try {
    const recognition = new SpeechRecognition();
    activeRecognitionInstance = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;

    const bcp47Map: Record<LanguageCode, string> = {
      hi: 'hi-IN',
      en: 'en-IN',
      pa: 'pa-IN',
      mr: 'mr-IN',
      ta: 'ta-IN',
    };
    recognition.lang = bcp47Map[lang] || 'hi-IN';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      const isFinal = event.results[current].isFinal;
      onResult({ transcript, isFinal });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      activeRecognitionInstance = null;
      const errName = event.error || 'speech_error';
      if (errName === 'no-speech') {
        onError('आवाज़ सुनाई नहीं दी। कृपया माइक्रोफोन के पास बोलें।');
      } else if (errName === 'not-allowed') {
        onError('माइक्रोफोन की अनुमति दें। Browser settings में Mic चालू करें।');
      } else {
        onError(`माइक्रोफोन त्रुटि: ${errName}`);
      }
    };

    recognition.onend = () => {
      activeRecognitionInstance = null;
      onEnd();
    };

    recognition.start();

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      activeRecognitionInstance = null;
    };
  } catch (err: unknown) {
    activeRecognitionInstance = null;
    const msg = err instanceof Error ? err.message : 'Error starting speech recognition';
    onError(msg);
    return () => {};
  }
}

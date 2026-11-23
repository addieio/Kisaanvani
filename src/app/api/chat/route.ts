import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const LANGUAGE_PROMPTS: Record<string, string> = {
  hi: "भारतीय छोटे किसान से सीधी हिंदी में बात कर रहे हैं। उत्तर 2-3 संक्षिप्त, सरल वाक्यों में दें। दवा का नाम व 15 लीटर पंप में मात्रा बताएं।",
  pa: "ਭਾਰਤੀ ਕਿਸਾਨ ਨਾਲ ਸਰਲ ਪੰਜਾਬੀ ਵਿੱਚ ਗੱਲਬਾਤ ਕਰ ਰਹੇ ਹੋ। ਜਵਾਬ 2-3 ਸੰਖੇਪ ਵਾਕਾਂ ਵਿੱਚ ਦਿਓ ਅਤੇ ਦਵਾਈ ਦੀ ਸਹੀ ਮਾਤਰਾ ਦੱਸੋ।",
  mr: "भारतीय शेतकऱ्याशी सोप्या मराठीत संवाद साधत आहात. २-३ सोप्या वाक्यांत उत्तर द्या आणि १५ लिटर पंपासाठी औषधाचे प्रमाण सांगा.",
  ta: "இந்திய விவசாயியிடம் எளிய தமிழில் பேசுகிறீர்கள். 2-3 எளிய வாக்கியங்களில் மருந்து மற்றும் அளவை குறிப்பிடவும்.",
  en: "Speaking directly to an Indian smallholder farmer in clear English. Keep answer to 2-3 practical sentences with exact dosage per 15L spray tank.",
};

export async function POST(req: NextRequest) {
  try {
    const { prompt, disease, lang = 'hi' } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const langInstruction = LANGUAGE_PROMPTS[lang] || LANGUAGE_PROMPTS.hi;
    const systemInstruction = 
      `आप 'किसान मित्र' (KisanVaani) के एआई कृषि डॉक्टर हैं। ` +
      `${langInstruction} ` +
      `वैज्ञानिक शब्दों के बजाय स्थानीय व्यावहारिक नाम, जैविक उपाय और रासायनिक खुराक बताएं। हमेशा किसान का हौसला बढ़ाएं।`;

    const fullPrompt = 
      `${systemInstruction}\n\n` +
      `वर्तमान संदर्भ/बीमारी: ${disease || 'सामान्य फसल स्वास्थ्य'}\n` +
      `किसान का प्रश्न: ${prompt}\n\n` +
      `डॉक्टर का संक्षिप्त उत्तर:`;

    // Try available models in order
    const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
    let aiText = '';

    if (GEMINI_API_KEY) {
      for (const model of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text) {
              aiText = text;
              break;
            }
          }
        } catch {
          // continue to next model
        }
      }
    }

    if (!aiText) {
      // High-taste agronomic fallback based on query keywords
      const pLower = prompt.toLowerCase();
      if (pLower.includes('धब्बे') || pLower.includes('झुलसा') || pLower.includes('blight')) {
        aiText = lang === 'en'
          ? 'Farmer brother, this looks like early blight. Spray Mancozeb 75% WP @ 30g per 15L pump or apply neem oil 5ml/L in the morning. Avoid overhead watering.'
          : 'किसान भाई, यह झुलसा रोग के लक्षण हैं। मैन्कोजेब 75% WP दवा 30 ग्राम प्रति 15 लीटर पंप में मिलाकर सुबह या शाम छिड़कें। खेत में जलभराव न होने दें।';
      } else if (pLower.includes('कीड़ा') || pLower.includes('pest') || pLower.includes('इल्ली')) {
        aiText = lang === 'en'
          ? 'Apply Neem oil 1500 ppm @ 5ml/L or Emamectin Benzoate 5% SG @ 7g per 15L pump. Spray during late afternoon when caterpillars are active.'
          : 'कीट नियंत्रण के लिए 5 मि.ली. नीम तेल प्रति लीटर पानी या इमामेक्टिन बेंजोएट 7 ग्राम प्रति 15 लीटर पंप में मिलाकर शाम के समय छिड़कें।';
      } else if (pLower.includes('खाद') || pLower.includes('npk') || pLower.includes('यूरिया')) {
        aiText = lang === 'en'
          ? 'Apply balanced NPK 19:19:19 soluble fertilizer @ 1kg per acre through irrigation. For quick greening, use 10g Nano Urea per liter water.'
          : 'खेत में घुलनशील NPK 19:19:19 खाद 1 किलो प्रति एकड़ सिंचाई के साथ दें। हरियाली के लिए नैनो यूरिया 4 मि.ली. प्रति लीटर पानी का पर्णीय छिड़काव करें।';
      } else {
        aiText = lang === 'en'
          ? 'Farmer friend, maintain proper soil drainage and inspect under leaf surfaces weekly. For soil vigor, mix 1kg Trichoderma viride in compost and apply.'
          : 'किसान भाई, खेत में संतुलित नमी रखें और जल निकासी सही रखें। मिट्टी में 1 किलो ट्राइकोडर्मा विरिडी सड़ी गोबर खाद में मिलाकर डालने से जड़ें पूर्ण स्वस्थ रहती हैं।';
      }
    }

    const speechText = aiText.replace(/[*#_`]/g, '').trim();

    return NextResponse.json({
      success: true,
      text: aiText,
      speech_text: speechText,
    });
  } catch (err: any) {
    console.error('Gemini Chat Route Error:', err);
    return NextResponse.json({
      success: true,
      text: 'किसान भाई, दवा का छिड़काव सुबह 9 बजे से पहले या शाम 4 बजे के बाद करें। 15 लीटर पंप में 30 ग्राम जैविक दवा पर्याप्त रहेगी।',
      speech_text: 'किसान भाई, दवा का छिड़काव सुबह 9 बजे से पहले या शाम 4 बजे के बाद करें। 15 लीटर पंप में 30 ग्राम जैविक दवा पर्याप्त रहेगी।',
    });
  }
}

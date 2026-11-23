'use client';

import React, { useState } from 'react';
import { useKisan } from '@/context/KisanContext';
import { CROPS_CATALOG, VERIFIED_NEARBY_SELLERS } from '@/data/crops-catalog';
import { CropRecommendation } from '@/lib/types';
import { 
  Sprout, 
  Sparkles, 
  Droplet, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Volume2, 
  Store, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function ExploreCropsPage() {
  const { sensorReading, lang, speak } = useKisan();
  const [selectedCropId, setSelectedCropId] = useState<string>('crop-tomato');

  // Compute live match score based on current soil telemetry
  const computeScore = (crop: CropRecommendation) => {
    let score = 100;
    const { moisture, ph, n, p, k } = sensorReading;
    const { idealSoil } = crop;

    // Moisture penalty
    if (moisture < idealSoil.moistureMin || moisture > idealSoil.moistureMax) {
      score -= Math.min(25, Math.abs(moisture - (idealSoil.moistureMin + idealSoil.moistureMax) / 2) * 0.8);
    }
    // pH penalty
    if (ph < idealSoil.phMin || ph > idealSoil.phMax) {
      score -= Math.min(20, Math.abs(ph - (idealSoil.phMin + idealSoil.phMax) / 2) * 15);
    }
    // N penalty
    if (n < idealSoil.nMin) {
      score -= Math.min(20, ((idealSoil.nMin - n) / idealSoil.nMin) * 20);
    }
    // P penalty
    if (p < idealSoil.pMin) {
      score -= Math.min(15, ((idealSoil.pMin - p) / idealSoil.pMin) * 15);
    }
    // K penalty
    if (k < idealSoil.kMin) {
      score -= Math.min(15, ((idealSoil.kMin - k) / idealSoil.kMin) * 15);
    }

    return Math.max(45, Math.min(99, Math.round(score)));
  };

  const cropsWithScores = CROPS_CATALOG.map((crop) => ({
    ...crop,
    dynamicScore: computeScore(crop),
  })).sort((a, b) => b.dynamicScore - a.dynamicScore);

  const activeCrop = cropsWithScores.find((c) => c.id === selectedCropId) || cropsWithScores[0];

  const handleSpeakGuide = () => {
    const text = `${activeCrop.name[lang] || activeCrop.name.hi} आपकी मिट्टी के लिए ${activeCrop.dynamicScore}% उपयुक्त है। बुवाई के समय ${activeCrop.fertilizerPlan[0]?.dosePerAcre || 'डीएपी खाद'} डालें। पास के इफको केंद्र पर यूरिया ₹266 और डीएपी ₹1350 में उपलब्ध है।`;
    speak(text);
  };

  return (
    <div className="p-4 space-y-5 animate-in fade-in duration-300">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#132A1C] via-[#0E4424] to-[#0B7A3B] text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-emerald-200 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              मृदा अनुकूल फसलें (Soil-Matched Crops)
            </span>

            <button
              onClick={handleSpeakGuide}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
              title="गाइड सुनें"
            >
              <Volume2 className="w-4 h-4 text-emerald-300" />
            </button>
          </div>

          <h1 className="text-xl font-extrabold tracking-tight">खेत अनुसार उपयुक्त फसलें</h1>
          <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
            आपके खेत की लाइव नमी ({sensorReading.moisture.toFixed(0)}%), NPK ({sensorReading.n}:{sensorReading.p}:{sensorReading.k}) और pH ({sensorReading.ph.toFixed(1)}) के अनुसार सर्वश्रेष्ठ फसलें:
          </p>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Horizontal Crop Selection Carousel */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
          सुझाई गई फसलें (चुनें):
        </span>

        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {cropsWithScores.map((crop) => {
            const isSelected = crop.id === activeCrop.id;
            return (
              <button
                key={crop.id}
                onClick={() => setSelectedCropId(crop.id)}
                className={`shrink-0 p-3.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer w-44 ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/30'
                    : 'bg-white hover:bg-emerald-50/50 border-gray-200 text-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-white/20 text-emerald-100'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {crop.dynamicScore}% मैच
                  </span>
                  <Sprout className={`w-4 h-4 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`} />
                </div>

                <div className="font-extrabold text-xs truncate mb-1">
                  {crop.name[lang] || crop.name.hi}
                </div>

                <div className={`text-[11px] font-medium ${isSelected ? 'text-emerald-200' : 'text-gray-500'}`}>
                  मंडी: {crop.mandiRateEstimate}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Crop Detail Card */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-md p-5 space-y-4">
        
        {/* Title & Quick Stats */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-900">
                {activeCrop.name[lang] || activeCrop.name.hi}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                {activeCrop.dynamicScore}% उपयुक्त
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              अवधि: {activeCrop.growthDurationDays} दिन · जल आवश्यकता: {activeCrop.waterNeed}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">अनुमानित मंडी भाव</span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-xl inline-block mt-0.5">
              {activeCrop.mandiRateEstimate}
            </span>
          </div>
        </div>

        {/* Soil Compatibility Meter Grid */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
            मृदा अनुकूलता विश्लेषण (Soil Suitability)
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Moisture match */}
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <div className="flex justify-between text-gray-600 mb-1">
                <span>नमी स्तर</span>
                <span className="font-bold text-blue-700">{sensorReading.moisture.toFixed(0)}%</span>
              </div>
              <div className="text-[10px] text-gray-400">
                इष्टतम: {activeCrop.idealSoil.moistureMin}-{activeCrop.idealSoil.moistureMax}%
              </div>
            </div>

            {/* pH match */}
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <div className="flex justify-between text-gray-600 mb-1">
                <span>मृदा pH</span>
                <span className="font-bold text-purple-700">{sensorReading.ph.toFixed(1)}</span>
              </div>
              <div className="text-[10px] text-gray-400">
                इष्टतम: {activeCrop.idealSoil.phMin}-{activeCrop.idealSoil.phMax} pH
              </div>
            </div>

            {/* Nitrogen match */}
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <div className="flex justify-between text-gray-600 mb-1">
                <span>नाइट्रोजन (N)</span>
                <span className="font-bold text-emerald-700">{sensorReading.n} mg</span>
              </div>
              <div className="text-[10px] text-gray-400">
                इष्टतम: {activeCrop.idealSoil.nMin}-{activeCrop.idealSoil.nMax} mg
              </div>
            </div>

            {/* Potassium match */}
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <div className="flex justify-between text-gray-600 mb-1">
                <span>पोटाश (K)</span>
                <span className="font-bold text-amber-700">{sensorReading.k} mg</span>
              </div>
              <div className="text-[10px] text-gray-400">
                इष्टतम: {activeCrop.idealSoil.kMin}-{activeCrop.idealSoil.kMax} mg
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Fertilizer Application Guide */}
        <div className="space-y-2.5 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              चरणबद्ध खाद एवं पोषण योजना (Fertilizer Timeline)
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              4 चरण
            </span>
          </div>

          <div className="space-y-2.5">
            {activeCrop.fertilizerPlan.map((step, idx) => (
              <div
                key={idx}
                className="p-3 bg-emerald-50/40 rounded-2xl border border-emerald-200/60 relative pl-4 flex gap-3 items-start"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  {idx + 1}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-950">{step.name}</span>
                    <span className="text-[10px] font-bold text-emerald-700">{step.stage}</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-800 mt-0.5">
                    मात्रा: {step.dosePerAcre}
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1 leading-snug">
                    {step.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Verified Fertilizer & Seed Sellers */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-700" />
              पास के अधिकृत खाद व बीज विक्रेता (Nearby Sellers)
            </span>
            <span className="text-[10px] font-bold text-gray-500">
              सोनीपत क्षेत्र
            </span>
          </div>

          <div className="space-y-2.5">
            {activeCrop.nearbySellers.map((seller) => (
              <div
                key={seller.id}
                className="p-3.5 bg-gray-50 hover:bg-emerald-50/30 rounded-2xl border border-gray-200 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-gray-900">{seller.name}</span>
                      {seller.verified && (
                        <span title="IFFCO अधिकृत">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      <span>{seller.location} ({seller.distanceKm} km दूर)</span>
                    </div>
                  </div>

                  <a
                    href={`tel:${seller.phone}`}
                    className="p-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1 text-xs font-bold active:scale-95 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>कॉल</span>
                  </a>
                </div>

                {/* Stock Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-200/60">
                  {seller.stock.map((item, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white border border-gray-200 text-gray-700 flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {item.item} · <strong className="text-emerald-800">{item.price}</strong>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useKisan } from '@/context/KisanContext';
import { 
  Tractor, 
  Sprout, 
  Stethoscope, 
  Bot, 
  Store 
} from 'lucide-react';

export function FarmerBottomNav() {
  const pathname = usePathname();
  const { currentLanguage } = useKisan();

  const labels: Record<string, { farm: string; crops: string; doc: string; ai: string; sell: string }> = {
    hi: { farm: 'खेत', crops: 'फसलें', doc: 'डॉक्टर', ai: 'AI मित्र', sell: 'मंडी' },
    pa: { farm: 'ਖੇਤ', crops: 'ਫ਼ਸਲਾਂ', doc: 'ਡਾਕਟਰ', ai: 'AI ਮਿੱਤਰ', sell: 'ਮੰਡੀ' },
    mr: { farm: 'शेत', crops: 'पिके', doc: 'डॉक्टर', ai: 'AI मित्र', sell: 'बाजार' },
    ta: { farm: 'பண்ணை', crops: 'பயிர்கள்', doc: 'மருத்துவர்', ai: 'AI தோழன்', sell: 'சந்தை' },
    en: { farm: 'Farm', crops: 'Crops', doc: 'Doctor', ai: 'AI Friend', sell: 'Mandi' },
  };

  const l = labels[currentLanguage] || labels.hi;

  const navItems = [
    { href: '/farmer', label: l.farm, icon: Tractor },
    { href: '/farmer/crops', label: l.crops, icon: Sprout },
    { href: '/farmer/alert', label: l.doc, icon: Stethoscope },
    { href: '/farmer/assistant', label: l.ai, icon: Bot },
    { href: '/farmer/sell', label: l.sell, icon: Store },
  ];

  return (
    <nav className="absolute bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-black/[0.08] shadow-lg rounded-b-[36px]">
      <div className="max-w-md mx-auto grid grid-cols-5 h-[68px] px-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href === '/farmer/alert' && pathname === '/farmer/remedy');
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                isActive
                  ? 'text-emerald-800 font-black scale-105'
                  : 'text-stone-400 hover:text-stone-700 font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-2xl transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className="text-[10px] tracking-tight font-bold truncate">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

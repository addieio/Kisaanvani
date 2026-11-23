'use client';

import React, { useState } from 'react';
import { DemoControlPanel } from '@/components/DemoControlPanel';
import { FarmerBottomNav } from '@/components/FarmerBottomNav';
import { Sliders, X } from 'lucide-react';

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F2F5F3] py-4 px-2 sm:px-4 flex justify-center items-start">
      {/* Studio Container: Side-by-Side on Desktop */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-8">
        
        {/* Left / Center: The Farmer Mobile App Viewport */}
        <div className="w-full max-w-md bg-white min-h-[840px] shadow-2xl rounded-[36px] overflow-hidden border border-gray-200/80 relative flex flex-col">
          {/* Main App Page Content */}
          <div className="flex-1 overflow-y-auto pb-24">
            {children}
          </div>

          {/* Sticky Bottom Navigation */}
          <FarmerBottomNav />
        </div>

        {/* Right: Docked Demo Control Panel (Desktop View) */}
        <div className="hidden lg:block w-[420px] sticky top-6">
          <DemoControlPanel />
        </div>

      </div>

      {/* Mobile Floating Button for Demo Controls */}
      <div className="lg:hidden fixed bottom-24 right-4 z-40">
        <button
          onClick={() => setIsMobilePanelOpen(true)}
          className="py-2.5 px-4 bg-[#132A1C] hover:bg-[#0B7A3B] text-white text-xs font-black rounded-full shadow-2xl flex items-center gap-2 border border-emerald-400/30 active:scale-95 transition-all"
        >
          <Sliders className="w-4 h-4 text-emerald-300" />
          <span>डेमो कंट्रोल</span>
        </button>
      </div>

      {/* Mobile Drawer Modal for Demo Controls */}
      {isMobilePanelOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-md bg-white h-full overflow-y-auto p-4 flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-3">
              <span className="font-extrabold text-sm text-gray-900">ESP32-C6 डेमो कंट्रोलर</span>
              <button
                onClick={() => setIsMobilePanelOpen(false)}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <DemoControlPanel />
          </div>
        </div>
      )}
    </div>
  );
}


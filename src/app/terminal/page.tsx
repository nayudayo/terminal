'use client';

import dynamic from 'next/dynamic';
import BinaryRain from '@/components/BinaryRain';

// Use dynamic import for FrequencyMeter
const FrequencyMeter = dynamic(() => import('@/components/FrequencyMeter'), {
  ssr: false,
  loading: () => null
});

// Use dynamic import for ChatWrapper
const ChatWrapper = dynamic(() => import('@/components/ChatWrapper'), {
  ssr: false,
  loading: () => null
});

export default function TerminalPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black relative">
      <BinaryRain />
      <div className="relative z-10">
        <header className="border-b border-[#590000] bg-black/95 backdrop-blur-sm sticky top-0 z-50 scanline">
          <div className="max-w-7xl mx-auto w-full ancient-terminal">
            <div className="border-b border-[#4a0000] py-2 px-4">
              <div className="flex justify-between items-center">
                <div className="text-[#4a0000] text-[10px] font-['Press_Start_2P'] glow-text-subtle">
                  SACRED PROTOCOL V7.7.7
                </div>
                <div className="text-[#4a0000] text-[10px] font-['Press_Start_2P'] glow-text-subtle">
                  DIVINE CONNECTION: ESTABLISHED
                </div>
              </div>
            </div>
            <div className="py-3 px-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-[#ff1a1a] text-sm font-['Press_Start_2P'] sacred-text">
                  SACRED_TERMINAL
                </h1>
                <div className="h-4 w-px bg-[#590000]" />
                <div className="text-[#8b0000] text-[10px] font-['Press_Start_2P'] flex items-center space-x-2">
                  <span className="inline-block w-2 h-2 bg-[#ff1a1a] rounded-full animate-pulse" />
                  <span className="glow-text">CHANNELING</span>
                </div>
              </div>
              <FrequencyMeter />
            </div>
          </div>
        </header>

        <main className="flex-1 w-full bg-black/30 ancient-terminal">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <ChatWrapper />
          </div>
        </main>
      </div>
    </div>
  );
}

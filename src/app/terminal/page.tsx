'use client';

import dynamic from 'next/dynamic';

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
    <div className="flex flex-col min-h-screen bg-black" suppressHydrationWarning>
      <header className="border-b border-[#FF0000]/20 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto w-full">
          {/* System stats bar */}
          <div className="border-b border-[#FF0000]/10 py-1.5 px-4">
            <div className="flex justify-between items-center">
              <div className="text-[#FF0000]/50 text-[10px] font-['Press_Start_2P']">
                SYSTEM VERSION 2.1.0
              </div>
              <div className="text-[#FF0000]/50 text-[10px] font-['Press_Start_2P']">
                SIGNAL STRENGTH: OPTIMAL
              </div>
            </div>
          </div>
          {/* Main header content */}
          <div className="py-2.5 px-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-[#FF0000] text-sm font-['Press_Start_2P'] glow-text">
                TERMINAL
              </h1>
              <div className="h-4 w-px bg-[#FF0000]/20" />
              <div className="text-[#FF0000]/70 text-[10px] font-['Press_Start_2P'] flex items-center space-x-2">
                <span className="inline-block w-2 h-2 bg-[#FF0000] rounded-full animate-pulse" />
                <span>ACTIVE</span>
              </div>
            </div>
            <FrequencyMeter />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full bg-black/30">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <ChatWrapper />
        </div>
      </main>
    </div>
  );
}

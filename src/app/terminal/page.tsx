'use client';

import { useState } from 'react';
import Chat from '@/components/Chat';
import FrequencyMeter from '@/components/FrequencyMeter';

export default function TerminalPage() {
  const [userId] = useState(() => {
    const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `user-${randomNum}`;
  });

  return (
    <div className="min-h-screen bg-black text-[#FF0000]">
      <div className="fixed top-0 left-0 right-0 bg-black z-10 p-2 sm:p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs sm:text-sm opacity-50 space-y-1">
            <div>System initialized...</div>
            <div>User ID: {userId}</div>
            <FrequencyMeter />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-8 pt-24 sm:pt-32">
        <Chat userId={userId} />
      </div>
    </div>
  );
}

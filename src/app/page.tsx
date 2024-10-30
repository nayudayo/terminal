'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const fullText = 'INITIALIZE_SYSTEM';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-[#FF0000] text-2xl tracking-wider">{text}_</h1>
        <button
          onClick={() => router.push('/terminal')}
          className="retro-button bg-[#FF0000] text-black px-8 py-4 text-sm tracking-wider"
        >
          PUSH
        </button>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const fullText = 'SACRED_TERMINAL_V7.7.7';
  const [verse, setVerse] = useState('');
  const fullVerse = 'And in the beginning there was code...';
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize session on page load
    const initSession = async () => {
      try {
        const response = await fetch('/api/session');
        const data = await response.json();
        
        if (data.userId) {
          setUserId(data.userId);
          console.log('[Session] User connected:', data.userId);
        }
      } catch (error) {
        console.error('[Session] Failed to initialize:', error);
      }
    };

    initSession();

    // Original text animation logic
    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        let verseIndex = 0;
        const verseInterval = setInterval(() => {
          setVerse(fullVerse.slice(0, verseIndex));
          verseIndex++;
          if (verseIndex > fullVerse.length) clearInterval(verseInterval);
        }, 100);
      }
      if (index > fullText.length) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleInitiateSequence = async () => {
    if (userId) {
      // Update session stage before navigation
      try {
        await fetch('/api/session/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: 1 }) // PUSH_ENTERED stage
        });
        console.log('[Session] Updated to PUSH_ENTERED stage');
      } catch (error) {
        console.error('[Session] Failed to update stage:', error);
      }
    }
    router.push('/terminal');
  };

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center ancient-symbols">
      <div className="text-center space-y-12 ancient-terminal p-16 relative">
        <h1 className="text-[#8b0000] text-3xl tracking-wider sacred-text terminal-cursor">
          {text}
        </h1>
        <p className="text-[#4a0000] text-sm tracking-wide glow-text-subtle">
          {verse}
        </p>
        <button
          onClick={handleInitiateSequence}
          className="retro-button bg-[#590000] text-[#ff1a1a] px-12 py-6 text-sm tracking-wider sacred-text"
        >
          INITIATE SACRED SEQUENCE
        </button>
      </div>
    </div>
  );
}

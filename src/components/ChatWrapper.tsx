'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const LoadingScreen = () => (
  <div className="h-[calc(100vh-10rem)] flex items-center justify-center bg-black/50 rounded-lg border border-[#FF0000]/20">
    <div className="text-white font-['Press_Start_2P'] animate-pulse text-[10px]">
      <div className="flex flex-col items-center space-y-2">
        <span className="inline-block w-3 h-3 border-2 border-[#FF0000] border-t-transparent rounded-full animate-spin" />
        <span>INITIALIZING SYSTEM...</span>
      </div>
    </div>
  </div>
);

const Chat = dynamic(() => import('./Chat'), {
  ssr: false,
  loading: LoadingScreen
});

export default function ChatWrapper() {
  const [isClient, setIsClient] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    setIsClient(true);
    
    const initializeUserId = async () => {
      try {
        const response = await fetch('/api/user/id');
        const data = await response.json();
        
        if (data.userId) {
          setUserId(data.userId);
        } else {
          const newUserId = `user-${Math.random().toString(36).slice(2, 9)}`;
          await fetch('/api/user/id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: newUserId }),
          });
          setUserId(newUserId);
        }
      } catch (error) {
        console.error('Error initializing user ID:', error);
        setUserId(`user-${Math.random().toString(36).slice(2, 9)}`);
      }
    };

    initializeUserId();
  }, []);

  if (!isClient) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-[calc(100vh-16rem)] ancient-terminal border border-[#590000] rounded-sm mb-24 flex flex-col">
      <div className="relative flex-1">
        {/* Top border with ancient symbols */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#590000] opacity-50" />
        
        {/* Left border with ancient symbols */}
        <div className="absolute top-0 left-0 w-1 h-full bg-[#590000] opacity-50" />
        
        {/* Right border with ancient symbols */}
        <div className="absolute top-0 right-0 w-1 h-full bg-[#590000] opacity-50" />
        
        {/* Bottom border with ancient symbols */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-[#590000] opacity-50" />
        
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-2 h-2 bg-[#ff1a1a] opacity-30" />
        <div className="absolute top-0 right-0 w-2 h-2 bg-[#ff1a1a] opacity-30" />
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#ff1a1a] opacity-30" />
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#ff1a1a] opacity-30" />
        
        {/* Main content */}
        <div className="p-6 flex flex-col min-h-full">
          {userId && <Chat userId={userId} />}
        </div>
      </div>
    </div>
  );
} 
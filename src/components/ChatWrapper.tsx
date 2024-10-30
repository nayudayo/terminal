'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const LoadingScreen = () => (
  <div className="h-[calc(100vh-10rem)] flex items-center justify-center bg-black/50 rounded-lg border border-[#FF0000]/20">
    <div className="text-[#FF0000] font-['Press_Start_2P'] animate-pulse text-[10px]">
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
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const initializeUserId = async () => {
      try {
        // Try to get existing userId
        const response = await fetch('/api/user/id');
        const data = await response.json();
        
        if (data.userId) {
          setUserId(data.userId);
        } else {
          // Generate new userId and store it
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
        // Fallback to client-side only ID
        setUserId(`user-${Math.random().toString(36).slice(2, 9)}`);
      } finally {
        setMounted(true);
      }
    };

    initializeUserId();
  }, []);

  // Don't render anything until mounted
  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <div className="w-full">
      <div className="backdrop-blur-sm bg-black/50 rounded-lg border border-[#FF0000]/20 shadow-lg shadow-[#FF0000]/5">
        <Chat userId={userId} />
      </div>
    </div>
  );
} 
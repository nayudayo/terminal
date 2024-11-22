'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface AuthCheckModalProps {
  isOpen: boolean;
  onAuthConfirmed: () => void;
  onRetryAuth: () => void;
}

export default function AuthCheckModal({ isOpen, onAuthConfirmed, onRetryAuth }: AuthCheckModalProps) {
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scanLine, setScanLine] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Start scan line animation
      const interval = setInterval(() => {
        setScanLine(prev => (prev + 1) % 100);
      }, 50);
      return () => clearInterval(interval);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsChecking(true);
    setError(null);

    try {
      if (!session) {
        setError('AUTHENTICATION FAILED: NO SESSION DETECTED');
        return;
      }

      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Authentication verification failed');
      }

      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'connect x account',
          userId: session.user.id
        }),
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to complete authentication flow');
      }

      const data = await chatResponse.json();
      
      window.dispatchEvent(
        new CustomEvent('CHAT_MESSAGE', {
          detail: {
            type: 'AUTHENTICATED',
            message: data.message,
            user: session.user
          }
        })
      );

      onAuthConfirmed();

    } catch (error) {
      setError('AUTHENTICATION ERROR: PLEASE TRY AGAIN');
      console.error('Auth confirmation error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsChecking(false);
    onRetryAuth();
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm
        transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
    >
      <div 
        className={`relative bg-black/95 w-full max-w-md mx-4
          transform transition-all duration-300 
          shadow-[0_0_50px_rgba(153,27,27,0.3)]
          animate-pulse-slow
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        {/* Scan Line Effect */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            background: `linear-gradient(transparent ${scanLine}%, rgba(153,27,27,0.15) ${scanLine + 0.5}%, transparent ${scanLine + 1}%)`
          }}
        />

        {/* Glitch Effect Container */}
        <div className="absolute inset-0 glitch-container">
          <div className="absolute inset-0 border-2 border-red-800/70 
                         shadow-[inset_0_0_20px_rgba(153,27,27,0.4)]
                         animate-glitch-1" />
          <div className="absolute inset-0 border border-red-900/50 m-[2px] 
                         shadow-[0_0_15px_rgba(153,27,27,0.3)]
                         animate-glitch-2" />
          <div className="absolute inset-0 border border-red-950/30 m-[4px]
                         animate-glitch-3" />
        </div>

        {/* Content Container */}
        <div className="relative p-6 space-y-6">
          {/* Header with Flicker Effect */}
          <div className="space-y-2 animate-flicker">
            <h2 className="text-lg font-['IBM_Plex_Mono'] tracking-[0.2em] text-red-800 text-center font-bold uppercase
                         drop-shadow-[0_0_10px_rgba(153,27,27,0.6)]
                         drop-shadow-[0_0_20px_rgba(153,27,27,0.4)]
                         text-shadow-[0_0_10px_rgba(220,38,38,0.8)]
                         hover:animate-glitch-text">
              [AUTHENTICATION SEQUENCE]
            </h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-red-800/80 to-transparent
                          shadow-[0_0_15px_rgba(153,27,27,0.5)]" />
          </div>

          {/* Status Message */}
          <div className="space-y-4 py-4">
            <p className="text-sm font-['IBM_Plex_Mono'] text-red-700 text-center leading-relaxed tracking-wider
                       drop-shadow-[0_0_8px_rgba(153,27,27,0.5)]
                       drop-shadow-[0_0_16px_rgba(153,27,27,0.3)]
                       text-shadow-[0_0_8px_rgba(220,38,38,0.6)]
                       animate-typing">
              AWAITING X NETWORK CONFIRMATION
              <br />
              COMPLETE AUTHENTICATION IN POPUP
            </p>
            
            {error && (
              <div className="mt-4 p-4 border-2 border-red-800/50 bg-red-950/20
                           shadow-[inset_0_0_20px_rgba(153,27,27,0.2)]">
                <p className="text-xs font-['IBM_Plex_Mono'] text-red-600 text-center tracking-wider
                           drop-shadow-[0_0_8px_rgba(153,27,27,0.4)]
                           drop-shadow-[0_0_16px_rgba(153,27,27,0.3)]
                           text-shadow-[0_0_8px_rgba(220,38,38,0.6)]">
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className="mt-3 w-full px-3 py-2 bg-black border-2 border-red-800/70 text-red-800
                           hover:bg-red-950/40 hover:text-red-700 transition-all duration-200 
                           font-['IBM_Plex_Mono'] text-xs tracking-[0.2em]
                           shadow-[0_0_20px_rgba(153,27,27,0.3)]
                           hover:shadow-[0_0_25px_rgba(153,27,27,0.4)]
                           relative overflow-hidden"
                >
                  <span className="relative z-10">[RETRY SEQUENCE]</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-950/0 via-red-950/30 to-red-950/0
                                transform translate-x-[-100%] group-hover:translate-x-[100%]
                                transition-transform duration-1000" />
                </button>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-red-800/50">
            <button
              onClick={handleConfirm}
              disabled={isChecking || !!error}
              className="group w-full px-4 py-3 bg-red-950/40 border-2 border-red-800/70 text-red-800
                       hover:bg-red-900/50 hover:border-red-700/80 hover:text-red-700
                       transition-all duration-200 font-['IBM_Plex_Mono'] text-sm tracking-[0.2em]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-[0_0_20px_rgba(153,27,27,0.3)]
                       hover:shadow-[0_0_25px_rgba(153,27,27,0.4)]
                       relative overflow-hidden"
            >
              <span className="relative z-10">
                {isChecking ? '[VERIFYING...]' : '[CONFIRM AUTH]'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-950/0 via-red-950/30 to-red-950/0
                            transform translate-x-[-100%] group-hover:translate-x-[100%]
                            transition-transform duration-1000" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
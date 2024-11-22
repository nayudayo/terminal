'use client';

import { useEffect, useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  onAuthStart: () => void;
}

export default function AuthModal({ isOpen, onClose, onConnect, onAuthStart }: AuthModalProps) {
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

  const handleAuthStart = () => {
    const width = 600;
    const height = 600;
    const left = Math.max(0, (window.innerWidth - width) / 2 + window.screenX);
    const top = Math.max(0, (window.innerHeight - height) / 2 + window.screenY);

    const popup = window.open(
      '/api/auth/signin/twitter',
      'Twitter Auth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
    );

    if (popup) {
      onAuthStart();
    } else {
      alert('Please enable popups for authentication');
    }
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
        onClick={e => e.stopPropagation()}
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
              [AUTHENTICATION REQUIRED]
            </h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-red-800/80 to-transparent
                          shadow-[0_0_15px_rgba(153,27,27,0.5)]" />
          </div>

          {/* Message with Typing Effect */}
          <div className="space-y-4 py-4">
            <p className="text-sm font-['IBM_Plex_Mono'] text-red-700 text-center leading-relaxed tracking-wider
                       drop-shadow-[0_0_8px_rgba(153,27,27,0.5)]
                       drop-shadow-[0_0_16px_rgba(153,27,27,0.3)]
                       text-shadow-[0_0_8px_rgba(220,38,38,0.6)]
                       animate-typing">
              SECURE X NETWORK CONNECTION REQUIRED
              <br />
              PROCEED WITH AUTHENTICATION PROTOCOL
            </p>
            <div className="text-xs font-['IBM_Plex_Mono'] text-red-600 text-center tracking-[0.15em]
                          drop-shadow-[0_0_6px_rgba(153,27,27,0.4)]
                          drop-shadow-[0_0_12px_rgba(153,27,27,0.3)]
                          text-shadow-[0_0_6px_rgba(220,38,38,0.5)]
                          animate-pulse">
              WARNING: UNAUTHORIZED ACCESS PROHIBITED
            </div>
          </div>

          {/* Actions with Hover Effects */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-red-800/50">
            <button
              onClick={onClose}
              className="group px-4 py-2 bg-black border-2 border-red-800/70 text-red-800 
                       hover:bg-red-950/40 hover:border-red-700/80 hover:text-red-700
                       transition-all duration-200 font-['IBM_Plex_Mono'] text-sm tracking-[0.2em]
                       shadow-[0_0_20px_rgba(153,27,27,0.3)]
                       hover:shadow-[0_0_25px_rgba(153,27,27,0.4)]
                       relative overflow-hidden"
            >
              <span className="relative z-10">[ABORT]</span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-950/0 via-red-950/30 to-red-950/0
                            transform translate-x-[-100%] group-hover:translate-x-[100%]
                            transition-transform duration-1000" />
            </button>
            <button
              onClick={handleAuthStart}
              className="group px-4 py-2 bg-red-950/40 border-2 border-red-800/70 text-red-800
                       hover:bg-red-900/50 hover:border-red-700/80 hover:text-red-700
                       transition-all duration-200 font-['IBM_Plex_Mono'] text-sm tracking-[0.2em]
                       shadow-[0_0_20px_rgba(153,27,27,0.3)]
                       hover:shadow-[0_0_25px_rgba(153,27,27,0.4)]
                       relative overflow-hidden"
            >
              <span className="relative z-10">[PROCEED]</span>
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
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

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleAuthStart = () => {
    // Calculate center position for popup
    const width = 600;
    const height = 600;
    const left = Math.max(0, (window.innerWidth - width) / 2 + window.screenX);
    const top = Math.max(0, (window.innerHeight - height) / 2 + window.screenY);

    // Open popup in center of screen
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
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm
        transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
    >
      <div 
        className={`bg-black border-2 border-[#FF0000] p-4 sm:p-8 rounded-none w-full max-w-[90vw] sm:max-w-md mx-2 sm:mx-4
          transform transition-all duration-300 shadow-[0_0_15px_rgba(255,0,0,0.3)]
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b-2 border-[#FF0000] pb-3 sm:pb-4 mb-4 sm:mb-6">
          <h2 className="text-[#FF0000] text-lg sm:text-2xl font-['Press_Start_2P'] glitch-text text-center">
            [AUTHENTICATION REQUIRED]
          </h2>
        </div>

        {/* Content */}
        <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
          <p className="text-[#FF0000] font-mono text-base sm:text-lg leading-relaxed tracking-wider text-center">
            X NETWORK CONNECTION NEEDED
          </p>
          <p className="text-[#FF0000]/80 font-mono text-sm sm:text-base text-center">
            PROCEED WITH AUTHENTICATION?
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-center space-x-3 sm:space-x-4 pt-3 sm:pt-4 border-t-2 border-[#FF0000]/20">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-[#FF0000] text-[#FF0000] hover:bg-[#FF0000] hover:text-black 
                     transition-all duration-200 font-mono text-sm sm:text-base tracking-wider
                     focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:ring-opacity-50
                     shadow-[0_0_10px_rgba(255,0,0,0.3)]"
          >
            CANCEL
          </button>
          <button
            onClick={handleAuthStart}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-[#FF0000] text-black hover:bg-[#CC0000] 
                     transition-all duration-200 font-mono text-sm sm:text-base tracking-wider
                     focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:ring-opacity-50
                     shadow-[0_0_10px_rgba(255,0,0,0.5)]"
          >
            CONNECT
          </button>
        </div>
      </div>
    </div>
  );
} 
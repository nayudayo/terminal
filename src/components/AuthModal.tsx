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

  const handleConnect = () => {
    // Open Twitter auth in new tab
    onConnect();
    // Show the auth check modal
    onAuthStart();
  };

  const handleClose = () => {
    // Show the auth check modal when closing
    onAuthStart();
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm
        transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        className={`bg-black border border-[#FF0000]/20 p-6 rounded-lg shadow-lg max-w-md w-full
          ancient-terminal transition-all duration-300 
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-[#FF0000] text-lg font-['Press_Start_2P'] mb-6 text-center sacred-text">
          X NETWORK SYNC REQUIRED
        </div>

        {/* Content */}
        <div className="text-[#FF0000] mb-6 font-['Courier_New'] space-y-4">
          <p className="text-center">
            [INITIATING X NETWORK SYNC]
            <br />
            Authorization required to proceed.
          </p>
          <div className="border-t border-[#FF0000]/20 my-4" />
          <p className="text-center text-sm">
            Click below to open X authorization in a new tab.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleConnect}
            className="retro-button bg-[#FF0000] text-black px-6 py-2 text-sm font-['Press_Start_2P']"
          >
            CONNECT X
          </button>
          <button
            onClick={handleClose}
            className="retro-button bg-black text-[#FF0000] border border-[#FF0000] px-6 py-2 text-sm font-['Press_Start_2P']"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
} 
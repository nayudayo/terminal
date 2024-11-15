'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface AuthCheckModalProps {
  isOpen: boolean;
  onAuthConfirmed: () => void;
}

export default function AuthCheckModal({ isOpen, onAuthConfirmed }: AuthCheckModalProps) {
  const { data: session, status } = useSession();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCheck = async () => {
    setIsChecking(true);
    setError(null);

    try {
      if (status === 'authenticated' && session) {
        onAuthConfirmed();
      } else {
        setError('Not authenticated. Please complete the X authentication process.');
      }
    } catch (error) {
      setError('Failed to verify authentication. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm
        transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
    >
      <div 
        className={`bg-black border border-[#FF0000]/20 p-6 rounded-lg shadow-lg max-w-md w-full
          ancient-terminal transition-all duration-300 
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        {/* Header */}
        <div className="text-[#FF0000] text-lg font-['Press_Start_2P'] mb-6 text-center sacred-text">
          AUTHENTICATION CHECK
        </div>

        {/* Content */}
        <div className="text-[#FF0000] mb-6 font-['Courier_New'] space-y-4">
          <p className="text-center">
            [VERIFYING X NETWORK SYNC]
            <br />
            Have you completed the X authentication?
          </p>
          {error && (
            <p className="text-center text-sm text-[#FF0000]/80 bg-[#FF0000]/10 p-2 rounded">
              {error}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleCheck}
            disabled={isChecking}
            className="retro-button bg-[#FF0000] text-black px-6 py-2 text-sm font-['Press_Start_2P']"
          >
            {isChecking ? 'CHECKING...' : 'CHECK AUTH'}
          </button>
        </div>
      </div>
    </div>
  );
} 
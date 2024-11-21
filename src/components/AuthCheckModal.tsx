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

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setError(null);
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

      // Verify the session is valid
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Authentication verification failed');
      }

      // Retrigger connect x account command via API to show AUTHENTICATED message
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

      // Get the authenticated message from the response
      const data = await chatResponse.json();
      
      // Dispatch authenticated message event
      window.dispatchEvent(
        new CustomEvent('CHAT_MESSAGE', {
          detail: {
            type: 'AUTHENTICATED',
            message: data.message,
            user: session.user
          }
        })
      );

      // Close modal
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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm
        transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
    >
      <div 
        className={`bg-black border-2 border-[#FF0000] p-8 rounded-none max-w-md w-full mx-4
          transform transition-all duration-300 shadow-[0_0_15px_rgba(255,0,0,0.3)]
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="border-b-2 border-[#FF0000] pb-4 mb-6">
          <h2 className="text-[#FF0000] text-2xl font-['Press_Start_2P'] glitch-text text-center">
            [AUTHENTICATION IN PROGRESS]
          </h2>
        </div>

        <div className="space-y-6 mb-8">
          <p className="text-[#FF0000] font-mono text-lg leading-relaxed tracking-wider text-center">
            COMPLETE THE AUTHENTICATION IN
            THE POPUP WINDOW
          </p>
          <p className="text-[#FF0000]/80 font-mono text-center">
            CLICK CONFIRM WHEN COMPLETE
          </p>
          
          {error && (
            <div className="bg-[#FF0000]/10 border-2 border-[#FF0000] p-4 mt-4">
              <p className="text-[#FF0000] font-mono text-sm text-center mb-4">
                {error}
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-[#FF0000]/20 text-[#FF0000] hover:bg-[#FF0000]/30 
                           transition-all duration-200 font-mono text-sm tracking-wider
                           focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:ring-opacity-50"
                >
                  RETRY AUTHENTICATION
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center pt-4 border-t-2 border-[#FF0000]/20">
          <button
            onClick={handleConfirm}
            disabled={isChecking || !!error}
            className="px-6 py-3 bg-[#FF0000] text-black hover:bg-[#CC0000] 
                     transition-all duration-200 font-mono tracking-wider
                     focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:ring-opacity-50
                     shadow-[0_0_10px_rgba(255,0,0,0.5)]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     min-w-[150px]"
          >
            {isChecking ? 'CHECKING...' : 'CONFIRM'}
          </button>
        </div>
      </div>
    </div>
  );
} 
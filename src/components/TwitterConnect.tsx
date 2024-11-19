'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import type { ChatCommandEvent } from '@/types/events';
import { v4 as uuidv4 } from 'uuid';
import type { Message } from '@/types/chat';
import AuthModal from '@/components/AuthModal';
import AuthCheckModal from '@/components/AuthCheckModal';

interface TwitterConnectProps {
  onAuthModalChange?: (show: boolean) => void;
}

export default function TwitterConnect({ onAuthModalChange }: TwitterConnectProps) {
  const { data: session } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAuthCheckModal, setShowAuthCheckModal] = useState(false);

  // Modified to show both modals
  const handleShowModals = () => {
    setShowAuthModal(true);
    setShowAuthCheckModal(true);
  };

  // Listen for command trigger
  useEffect(() => {
    const handleCommand = (event: ChatCommandEvent) => {
      if (event.detail === 'CONNECT_TWITTER') {
        console.log('Received CONNECT_TWITTER command');
        handleShowModals();
      }
    };

    window.addEventListener('CHAT_COMMAND', handleCommand as EventListener);
    return () => {
      window.removeEventListener('CHAT_COMMAND', handleCommand as EventListener);
    };
  }, []);

  return (
    <>
      {/* Auth Modal - Higher z-index */}
      {showAuthModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <AuthModal 
            onClose={() => setShowAuthModal(false)}
            onAuthComplete={() => {
              setShowAuthCheckModal(true);
              if (onAuthModalChange) onAuthModalChange(true);
            }}
          />
        </div>
      )}

      {/* Auth Check Modal - Lower z-index */}
      {showAuthCheckModal && (
        <div className="fixed inset-0 flex items-center justify-center z-40">
          <AuthCheckModal
            onClose={() => setShowAuthCheckModal(false)}
            onConfirm={handleAuthConfirmed}
          />
        </div>
      )}
    </>
  );
} 
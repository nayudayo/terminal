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
  dispatchEvent?: string;
  action?: string;
}

export default function TwitterConnect({ 
  onAuthModalChange, 
  dispatchEvent, 
  action 
}: TwitterConnectProps) {
  const { data: session, status, update } = useSession();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAuthCheckModal, setShowAuthCheckModal] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (!session) {
        // Open in a new tab
        window.location.href = '/api/auth/signin/twitter';

        // Show the auth check modal
        setShowAuthModal(false);
        setShowAuthCheckModal(true);
      } else {
        const response = await fetch('/api/twitter/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'Failed to connect Twitter account');
        }

        const data = await response.json();
        if (data.success) {
          console.log('Twitter account connected successfully');
        }
      }
    } catch (error) {
      console.error('Error connecting Twitter:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAuthConfirmed = async () => {
    if (session) {
      try {
        const response = await fetch('/api/twitter/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to complete authentication');
        }

        const data = await response.json();
        if (data.success) {
          setShowAuthCheckModal(false);
          if (onAuthModalChange) {
            onAuthModalChange(false);
          }
        }
      } catch (error) {
        console.error('Error completing authentication:', error);
      }
    }
  };

  // Listen for command trigger from both event and props
  useEffect(() => {
    const handleCommand = (event: ChatCommandEvent) => {
      if (event.detail === 'CONNECT_TWITTER') {
        console.log('Received CONNECT_TWITTER command');
        setShowAuthModal(true);
      }
    };

    window.addEventListener('CHAT_COMMAND', handleCommand as EventListener);
    
    // Also check props for direct triggers
    if (dispatchEvent === 'CONNECT_TWITTER' || action === 'CONNECT_TWITTER') {
      console.log('Received CONNECT_TWITTER via props');
      setShowAuthModal(true);
    }
    
    return () => {
      window.removeEventListener('CHAT_COMMAND', handleCommand as EventListener);
    };
  }, [dispatchEvent, action]);

  // Listen for auth completion
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'TWITTER_AUTH_COMPLETE') {
        await update();
        // Add the authenticated message to the chat
        if (event.data.message) {
          setMessages(prev => [...prev, {
            id: uuidv4(),
            content: event.data.message,
            role: 'assistant',
            timestamp: Date.now(),
            isAuthenticated: true,
            user: event.data.user
          }]);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [update, setMessages]);

  if (status === "loading") {
    return <div className="text-[#FF0000]">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-[#FF0000] text-sm">
          Error: {error}
        </div>
      )}
      {session ? (
        <>
          <div className="text-[#FF0000]">
            Connected as {session.user?.name}
          </div>
          <button
            onClick={() => signOut()}
            className="retro-button bg-[#FF0000] text-black px-4 py-2"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="retro-button bg-[#FF0000] text-black px-4 py-2 disabled:opacity-50"
        >
          {isConnecting ? 'Connecting...' : 'Connect Twitter'}
        </button>
      )}
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onConnect={handleConnect}
        onAuthStart={() => {
          handleConnect();
        }}
      />
      
      <AuthCheckModal
        isOpen={showAuthCheckModal}
        onAuthConfirmed={handleAuthConfirmed}
        onRetryAuth={handleConnect}
      />
    </div>
  );
} 
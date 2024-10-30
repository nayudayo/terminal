'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useState } from 'react';

export default function TwitterConnect() {
  const { data: session, status } = useSession();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      if (session) {
        const response = await fetch('/api/twitter/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to connect Twitter account');
        }

        const data = await response.json();
        if (data.success) {
          // Handle successful connection
          console.log('Twitter account connected successfully');
        }
      } else {
        await signIn('twitter');
      }
    } catch (error) {
      console.error('Error connecting Twitter:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (status === "loading") {
    return <div className="text-[#FF0000]">Loading...</div>;
  }

  return (
    <div className="space-y-4">
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
    </div>
  );
} 
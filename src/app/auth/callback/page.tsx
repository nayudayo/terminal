'use client';

import React from 'react';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

export default function AuthCallback() {
    const { data: session, status } = useSession() as {
        data: Session & {
            user: {
                id: string;
                name: string;
                email: string;
                image: string;
                userId?: string;
            }
        } | null;
        status: "loading" | "authenticated" | "unauthenticated";
    };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      try {
        const originalUserId = localStorage.getItem('originalUserId');

        if (originalUserId) {
          fetch('/api/twitter/connect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ originalUserId })
          }).then(async response => {
            if (response.ok) {
              const data = await response.json();
              
              if (window.opener) {
                window.opener.postMessage({
                  type: 'TWITTER_AUTH_COMPLETE',
                  message: data.message,
                  user: session.user,
                  session: data.session
                }, '*');
              }

              localStorage.removeItem('originalUserId');
              window.close();
            }
          }).catch(error => {
            console.error('Error connecting accounts:', error);
          });
        }
      } catch (error) {
        console.error('Error in callback:', error);
      }
    }
  }, [status, session]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-[#FF0000] text-sm font-['Courier_New'] space-y-4">
        <div className="text-center">
          {status === 'loading' ? (
            <>
              <div className="animate-pulse">AUTHENTICATING...</div>
              <div className="mt-2 text-xs opacity-70">Please wait</div>
            </>
          ) : status === 'authenticated' ? (
            <>
              <div>AUTHENTICATION COMPLETE</div>
              <div className="mt-2 text-xs opacity-70">You can close this window</div>
            </>
          ) : (
            <>
              <div className="text-[#FF0000]/70">AUTHENTICATION FAILED</div>
              <div className="mt-2 text-xs opacity-70">Please try again</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
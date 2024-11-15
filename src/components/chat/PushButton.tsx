import { useState, useCallback } from 'react';
import { UP_PUSH_RESPONSE_ART, DOWN_PUSH_RESPONSE_ART } from '@/constants/messages';
import { Typewriter } from './Typewriter';
import { useSession } from 'next-auth/react';

interface PushButtonProps {
  onPushComplete: () => void;
}

export function PushButton({ onPushComplete }: PushButtonProps) {
  const { data: session } = useSession();
  const [isPushed, setIsPushed] = useState(false);
  const [currentArt, setCurrentArt] = useState(UP_PUSH_RESPONSE_ART);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const markMessagesAsShown = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      // Mark post_push_message as shown
      const response = await fetch('/api/messages/mark-shown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: session.user.id, 
          messageType: 'post_push_message' 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark message as shown');
      }
  
      console.log('Post push message marked as shown');
    } catch (error) {
      console.error('Error marking message as shown:', error);
    }
  }, [session?.user?.id]);

  const handlePush = useCallback(() => {
    if (isPushed || isDisabled || isTyping || isAnimating) return;
    
    setIsAnimating(true);
    
    // Push down animation
    const pushDown = async () => {
      setCurrentArt(DOWN_PUSH_RESPONSE_ART);
      setIsPushed(true);

      // Mark message as shown before triggering events
      await markMessagesAsShown();

      // Trigger frequency meter event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('push-meter'));
        window.dispatchEvent(new CustomEvent('show-post-push-message'));
      }
    };

    // Return to up position
    const pushUp = () => {
      setCurrentArt(UP_PUSH_RESPONSE_ART);
      setTimeout(() => {
        setIsPushed(false);
        setIsDisabled(true);
        setIsAnimating(false);
        onPushComplete();
      }, 300);
    };

    // Execute animation sequence
    pushDown();
    setTimeout(pushUp, 1000);
    
  }, [isPushed, isDisabled, isTyping, isAnimating, onPushComplete, markMessagesAsShown]);

  return (
    <div 
      className={`max-w-[400px] ${!isPushed && !isDisabled && !isTyping && !isAnimating ? 'cursor-pointer' : 'cursor-default'} 
                 transition-all duration-300`}
      onClick={handlePush}
    >
      {isTyping ? (
        <Typewriter 
          text={UP_PUSH_RESPONSE_ART}
          onComplete={() => setIsTyping(false)}
          delay={1}
        />
      ) : (
        <pre 
          className={`whitespace-pre font-mono text-sm leading-[1.2] glow-text
                     transition-all duration-300 ${isPushed ? 'transform translate-y-1' : ''}`}
        >
          {currentArt}
        </pre>
      )}
    </div>
  );
} 
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ChatState, CompletionStatus, Message, ChatResponse } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';
import { signIn } from 'next-auth/react';
import {
  AUTHENTICATED_MESSAGE,
  INTRO_MESSAGE,
  TELEGRAM_REDIRECT_MESSAGE,
  UP_PUSH_RESPONSE_ART,
  POST_PUSH_MESSAGE,
  WALLET_ERROR_MESSAGES,
} from '@/constants/messages';
import { validateWalletAddress } from '@/utils/walletValidation';
import { verifyWalletTransactions } from '@/utils/transactionVerification';

export function useChat(userId: string) {
  const CACHE_DURATION = 30 * 60 * 1000;
  const { data: session } = useSession();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [canType, setCanType] = useState(false);
  const [showTelegramFallback, setShowTelegramFallback] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({
    mandatesComplete: false,
    followComplete: false,
    likeComplete: false,
    telegramComplete: false,
    verificationComplete: false,
    walletComplete: false,
    referenceComplete: false,
    currentStep: 1,
    lastUpdated: Date.now()
  });

  // Cache utilities
  const getCachedState = useCallback(async (userId: string): Promise<ChatState | null> => {
    try {
      const response = await fetch(`/api/chat/state?userId=${userId}`);
      if (!response.ok) return null;
      
      const { state } = await response.json();
      return state;
    } catch (error) {
      console.error('Error getting cached state:', error);
      return null;
    }
  }, []);

  const setCachedState = useCallback(async (state: ChatState) => {
    try {
      await fetch('/api/chat/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, state }),
      });
    } catch (error) {
      console.error('Error setting cached state:', error);
    }
  }, [userId]);

  // Handle command completion
  const handleCommandComplete = useCallback((command: string) => {
    const now = Date.now();
    setCompletionStatus(prev => {
      const newStatus = { ...prev, lastUpdated: now };
      
      switch (command) {
        case 'follow ptb':
          newStatus.followComplete = true;
          break;
        case 'like ptb':
          newStatus.likeComplete = true;
          break;
        case 'skip mandates':
          newStatus.mandatesComplete = true;
          newStatus.currentStep = 2;
          break;
        case 'join telegram':
          newStatus.telegramComplete = true;
          newStatus.currentStep = 3;
          break;
        case 'verify':
          newStatus.verificationComplete = true;
          newStatus.currentStep = 4;
          break;
        case 'submit wallet':
          newStatus.walletComplete = true;
          newStatus.currentStep = 5;
          break;
        case 'reference':
          newStatus.referenceComplete = true;
          break;
      }
      
      return newStatus;
    });
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    if (input.toLowerCase().includes('push')) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'assistant',
          content: UP_PUSH_RESPONSE_ART,
          timestamp: Date.now(),
          isIntro: true,
          showButton: true
        }]);
        setIsLoading(false);
        setIsTyping(false);
      }, 1000);
      return;
    }

    if (input.toLowerCase() === 'join telegram') {
      handleCommandComplete('join telegram');
      window.location.href = 'tg://resolve?domain=PTB_Auth_Bot';
      
      setTimeout(() => {
        setShowTelegramFallback(true);
      }, 5000);

      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: TELEGRAM_REDIRECT_MESSAGE,
        timestamp: Date.now(),
      }]);

      setIsLoading(false);
      setIsTyping(false);
      return;
    }

    if (input.toLowerCase().startsWith('wallet ')) {
      const walletAddress = input.slice(7).trim();
      const validation = validateWalletAddress(walletAddress);
      
      if (!validation.isValid) {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'assistant',
          content: `[WALLET VALIDATION ERROR]
${validation.error}

SUPPORTED FORMATS:
---------------
1. SOLANA:
   ${WALLET_ERROR_MESSAGES.SOLANA.FORMAT}

2. NEAR:
   ${WALLET_ERROR_MESSAGES.NEAR.FORMAT}

Please try again with a valid wallet address.`,
          timestamp: Date.now(),
        }]);
        setIsLoading(false);
        setIsTyping(false);
        return;
      }

      // Verify transactions
      const transactionVerification = await verifyWalletTransactions(
        validation.solanaWallet!,
        validation.nearWallet!,
        process.env.NEXT_PUBLIC_SOLANA_DESTINATION!,
        process.env.NEXT_PUBLIC_NEAR_DESTINATION!
      );

      if (!transactionVerification.isVerified) {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'assistant',
          content: `[TRANSACTION VERIFICATION FAILED]
${transactionVerification.error}

Required:
1. Transfer from Solana wallet to ${process.env.NEXT_PUBLIC_SOLANA_DESTINATION}
2. Transfer from NEAR wallet to ${process.env.NEXT_PUBLIC_NEAR_DESTINATION}

Please complete the transfers and try again.`,
          timestamp: Date.now(),
        }]);
        setIsLoading(false);
        setIsTyping(false);
        return;
      }

      // If valid and verified, proceed with submission
      handleCommandComplete('submit wallet');
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: `[WALLET VERIFICATION COMPLETE]
============================
SOLANA WALLET: ${validation.solanaWallet}
NEAR WALLET: ${validation.nearWallet}
STATUS: VERIFIED ✓

[PROCEEDING TO NEXT STEP]
>Type "help" to see available commands`,
        timestamp: Date.now(),
      }]);
      setIsLoading(false);
      setIsTyping(false);
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input.trim(),
          completionStatus 
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data: ChatResponse = await response.json();
      
      if (data.action === 'CONNECT_TWITTER') {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          content: data.message,
          role: 'assistant',
          timestamp: Date.now(),
        }]);
        
        setTimeout(() => {
          signIn('twitter', { callbackUrl: '/terminal' });
        }, 2000);
        return;
      }

      if (data.commandComplete) {
        handleCommandComplete(input.trim().toLowerCase());
      }

      const newMessage: Message = {
        id: uuidv4(),
        content: data.message,
        role: 'assistant',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [input, isLoading, handleCommandComplete, completionStatus]);

  // Initialize messages
  useEffect(() => {
    const initializeChat = async () => {
      const cachedState = await getCachedState(userId);
      const now = Date.now();

      if (cachedState && now - cachedState.timestamp < CACHE_DURATION) {
        setMessages(cachedState.messages);
        setCompletionStatus(cachedState.completionStatus);
        setCanType(true);
        return;
      }

      const initialMessage: Message = session?.user 
        ? {
            id: uuidv4(),
            role: 'assistant',
            content: AUTHENTICATED_MESSAGE,
            timestamp: Date.now(),
            isIntro: true,
            isAuthenticated: true
          }
        : {
            id: uuidv4(),
            role: 'assistant',
            content: INTRO_MESSAGE,
            timestamp: Date.now(),
            isIntro: true
          };

      setMessages([initialMessage]);
      setCanType(true);
    };

    initializeChat();
  }, [session, userId, getCachedState, CACHE_DURATION]);

  // Cache state updates
  useEffect(() => {
    if (messages.length > 0) {
      setCachedState({
        messages,
        completionStatus,
        timestamp: Date.now(),
      });
    }
  }, [messages, completionStatus, setCachedState]);

  const handleTypewriterComplete = useCallback(() => {
    setCanType(true);
    setIsTyping(false);
  }, []);

  useEffect(() => {
    const handlePostPushMessage = () => {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: POST_PUSH_MESSAGE,
        timestamp: Date.now(),
      }]);
    };

    window.addEventListener('show-post-push-message', handlePostPushMessage);
    return () => window.removeEventListener('show-post-push-message', handlePostPushMessage);
  }, []);

  return {
    messages,
    input,
    isLoading,
    isTyping,
    canType,
    showTelegramFallback,
    completionStatus,
    setInput,
    setMessages,
    setShowTelegramFallback,
    handleSubmit,
    handleTypewriterComplete,
  };
} 
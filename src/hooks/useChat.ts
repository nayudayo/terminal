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
  MANDATES_MESSAGE,
  TELEGRAM_MESSAGE,
  PROTOCOL_COMPLETE_MESSAGE,
  VERIFICATION_MESSAGE,
  WALLET_MESSAGE,
  REFERENCE_MESSAGE,
} from '@/constants/messages';
import { validateWalletAddress } from '@/utils/walletValidation';
import { verifyWalletTransactions } from '@/utils/transactionVerification';
import { SessionStage } from '@/types/session';




export function useChat(userId: string) {
  const CACHE_DURATION = 30 * 60 * 1000;
  const { data: session } = useSession();
  const [sessionStage, setSessionStage] = useState<SessionStage>(SessionStage.INTRO_MESSAGE);
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
  const [showAuthModal, setShowAuthModal] = useState(false);


useEffect(() => {
  const fetchInitialSession = async () => {
    try {
      const response = await fetch('/api/session');
      const data = await response.json();
      if (data.session?.stage) {
        setSessionStage(data.session.stage);
      }
    } catch (error) {
      console.error('Error fetching initial session:', error);
    }
  };

  fetchInitialSession();
}, []);

  const updateSessionStage = useCallback(async (newStage: SessionStage) => {
    try {
      console.log('Updating session stage to:', newStage);
      
      const response = await fetch('/api/session/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          stage: newStage 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update session stage');
      }

      const data = await response.json();
      console.log('Session update response:', data);

      if (data.success && data.session?.stage !== undefined) {
        setSessionStage(data.session.stage);
        console.log('Session stage updated successfully to:', data.session.stage);
      } else {
        console.error('Invalid session update response:', data);
      }
    } catch (error) {
      console.error('Error updating session stage:', error);
    }
  }, [userId]);

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

  const handleWalletSubmit = useCallback(async () => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: WALLET_MESSAGE,
      timestamp: Date.now(),
    }]);
    await markMessageAsShown(userId, 'wallet_submit_message');
    await updateSessionStage(SessionStage.WALLET_SUBMIT);
  }, [userId, updateSessionStage]);

  const handleTelegramRedirect = useCallback(async () => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: TELEGRAM_MESSAGE,
      timestamp: Date.now(),
    }]);
    await markMessageAsShown(userId, 'telegram_redir_message');
    await updateSessionStage(SessionStage.TELEGRAM_REDIRECT);
  }, [userId, updateSessionStage]);

  const handleConnectXMessage = useCallback(async () => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: POST_PUSH_MESSAGE,
      timestamp: Date.now(),
    }]);
    await markMessageAsShown(userId, 'connect_x_message');
    
    // Ensure we're updating to the correct stage
    await updateSessionStage(SessionStage.CONNECT_TWITTER);
  }, [userId, updateSessionStage]);

  const handleAuthenticatedMessage = useCallback(async () => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: MANDATES_MESSAGE,
      timestamp: Date.now(),
    }]);
      await markMessageAsShown(userId, 'mandates_message_shown');
    
    // Create initial session
    const response = await fetch('/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId,
        stage: SessionStage.AUTHENTICATED 
      })
    });
    
    if (response.ok) {
      await updateSessionStage(SessionStage.MANDATES);
    }
  }, [userId, updateSessionStage]);


  const handleTelegramCode = useCallback(async () => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: VERIFICATION_MESSAGE,
      timestamp: Date.now(),
    }]);
    await markMessageAsShown(userId, 'telegram_code_message');
    await updateSessionStage(SessionStage.TELEGRAM_CODE);
  }, [userId, updateSessionStage]);
  

  const handleReferenceCode = useCallback(async () => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: REFERENCE_MESSAGE,
      timestamp: Date.now(),
    }]);
    await markMessageAsShown(userId, 'reference_code_message');
    await updateSessionStage(SessionStage.REFERENCE_CODE);
  }, [userId, updateSessionStage]);
  
  const handleProtocolComplete = useCallback(async () => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: PROTOCOL_COMPLETE_MESSAGE,
      timestamp: Date.now(),
    }]);
    await markMessageAsShown(userId, 'protocol_complete_message');
    await updateSessionStage(SessionStage.PROTOCOL_COMPLETE);
  }, [userId, updateSessionStage]);

  // Handle command completion
  const handleCommandComplete = useCallback(async (command: string) => {
    const now = Date.now();
    
    // First update completion status synchronously
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
  
    // Then update session stage based on command
    switch (command) {
      case 'skip mandates':
        await updateSessionStage(SessionStage.MANDATES);
        break;
      case 'join telegram':
        await updateSessionStage(SessionStage.TELEGRAM_REDIRECT);
        break;
      case 'verify':
        await updateSessionStage(SessionStage.TELEGRAM_CODE);
        break;
      case 'submit wallet':
        await updateSessionStage(SessionStage.WALLET_SUBMIT);
        break;
      case 'reference':
        await updateSessionStage(SessionStage.REFERENCE_CODE);
        break;
    }
  }, [updateSessionStage]);

    // add a session stage fetch effect
    useEffect(() => {
      const fetchSessionStage = async () => {
        try {
          if (!userId) return;

          const response = await fetch(`/api/session?userId=${userId}`);
          const data = await response.json();
          
          if (data.success && data.session) {
            console.log('Fetched session:', data.session);
            
            // Check if stage exists and is a number
            if (typeof data.session.stage === 'number') {
              console.log('Setting session stage to:', data.session.stage);
              setSessionStage(data.session.stage);
            } else {
              console.warn('Session stage is invalid:', data.session.stage);
              // Set default stage if invalid
              setSessionStage(SessionStage.INTRO_MESSAGE);
            }
          } else {
            console.warn('Creating new session for user:', userId);
            // Create new session if none exists
            const createResponse = await fetch('/api/session/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId })
            });
            
            if (createResponse.ok) {
              const createData = await createResponse.json();
              if (createData.success && createData.session?.stage) {
                setSessionStage(createData.session.stage);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching/creating session:', error);
          // Set default stage on error
          setSessionStage(SessionStage.INTRO_MESSAGE);
        }
      };
    
      fetchSessionStage();
    }, [userId]);


  // mark messages as shown in the db
  const markMessageAsShown = async (userId: string, messageType: string) => {
    try {
      await fetch('/api/messages/mark-shown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, messageType }),
      });
    } catch (error) {
      console.error('Error marking message as shown:', error);
    }
  }

  // Handle submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !canType) return;

    setCanType(false);
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
        markMessageAsShown(userId, 'post_push_message');
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
      markMessageAsShown(userId, 'telegram_redir_message');
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
      markMessageAsShown(userId, 'wallet_submit_shown');
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
          completionStatus,
          sessionStage
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data: ChatResponse = await response.json();

      
      if (data.dispatchEvent === 'CONNECT_TWITTER') {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          content: data.message,
          role: 'assistant',
          timestamp: Date.now(),
        }]);
        
        // Show the modal
        setShowAuthModal(true);
        setIsLoading(false);
        setIsTyping(false);
        return;
      }


      if (data.commandComplete) {
        await handleCommandComplete(input.trim().toLowerCase());
      }

        // Progress session stage based on completion
        switch (sessionStage) {
          case SessionStage.MANDATES:
            if (completionStatus.mandatesComplete) {
              await handleTelegramRedirect();
              await updateSessionStage(SessionStage.TELEGRAM_REDIRECT);
            }
            break;
          case SessionStage.TELEGRAM_REDIRECT:
            if (completionStatus.telegramComplete) {
              await handleTelegramCode();
              await updateSessionStage(SessionStage.TELEGRAM_CODE);
            }
            break;
          case SessionStage.TELEGRAM_CODE:
            if (completionStatus.verificationComplete) {
              await handleWalletSubmit();
              await updateSessionStage(SessionStage.WALLET_SUBMIT);
            }
            break;
          case SessionStage.WALLET_SUBMIT:
            if (completionStatus.walletComplete) {
              await handleReferenceCode();
              await updateSessionStage(SessionStage.REFERENCE_CODE);
            }
            break;
          case SessionStage.REFERENCE_CODE:
            if (completionStatus.referenceComplete) {
              await handleProtocolComplete();
              await updateSessionStage(SessionStage.PROTOCOL_COMPLETE);
            }
            break;
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
  }, [userId, input, isLoading, canType, handleCommandComplete, completionStatus, sessionStage, updateSessionStage, handleTelegramRedirect, handleTelegramCode, handleWalletSubmit, handleReferenceCode, handleProtocolComplete]);



  // Initialize messages
  useEffect(() => {
    const initializeChat = async () => {
      setCanType(false);
      const cachedState = await getCachedState(userId);
      const now = Date.now();
      if (cachedState && now - cachedState.timestamp < CACHE_DURATION) {
        setMessages(cachedState.messages);
        setCompletionStatus(cachedState.completionStatus);
        if (cachedState.sessionStage !== undefined) {
          setSessionStage(cachedState.sessionStage);
        }
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
    // Don't enable typing here - let the typewriter effect control it

    await markMessageAsShown(userId, 'intro_message');
    await updateSessionStage(SessionStage.INTRO_MESSAGE);
  };
  initializeChat();
}, [session, userId, getCachedState, CACHE_DURATION, updateSessionStage]);

  // Cache state updates
  useEffect(() => {
    if (messages.length > 0) {
      setCachedState({
        messages,
        completionStatus,
        sessionStage,
        timestamp: Date.now(),
      });
    }
  }, [messages, completionStatus, sessionStage,setCachedState]);



  const handleTypewriterComplete = useCallback(() => {
    setCanType(true);
    setIsTyping(false);
  }, []);

  useEffect(() => {
    const handlePushCommand = async () => {
      if (!userId || !sessionStage) return;
      if (sessionStage === SessionStage.POST_PUSH_MESSAGE) {
        try {
          // Check if user is already authenticated
          const response = await fetch('/api/session');
          const data = await response.json();
          const isAuthenticated = data.session?.stage >= SessionStage.AUTHENTICATED;

          if (isAuthenticated) {
            // If authenticated, show a different message
            setMessages(prev => [...prev, {
              id: uuidv4(),
              role: 'assistant',
              content: '[SYSTEM STATUS: ALREADY AUTHENTICATED]\n=============================\nX NETWORK CONNECTION ALREADY ESTABLISHED\n\n>TYPE "help" TO SEE AVAILABLE COMMANDS',
              timestamp: Date.now()
            }]);
            return;
          }

          // If not authenticated, proceed with normal flow
          await updateSessionStage(SessionStage.CONNECT_TWITTER);
          
          // Add delay before showing message
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Show connect X message
          setMessages(prev => [...prev, {
            id: uuidv4(),
            role: 'assistant',
            content: '[SIGNAL DETECTED]\nFREQUENCY ANOMALY FOUND\nINITIATING DIGITAL BRIDGE PROTOCOL...\n\n>AWAITING X NETWORK SYNCHRONIZATION\n>TYPE "connect x account" TO PROCEED\n>WARNING: EXACT SYNTAX REQUIRED\n\nCONNECTION STATUS: PENDING...',
            timestamp: Date.now()
          }]);
          
          // Mark messages as shown
          await fetch('/api/messages/mark-shown', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId, 
              messageType: 'connect_x_message' 
            })
          });

          await fetch('/api/messages/mark-shown', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId, 
              messageType: 'post_push_message' 
            })
          });

          console.log('Marked connect_x_message and post_push_message as shown');
        } catch (error) {
          console.error('Error in handlePushCommand:', error);
        }
      }
    };
  
    handlePushCommand();
  }, [sessionStage, updateSessionStage, userId]);

  useEffect(() => {
    const handleResponse = async (data: ChatResponse) => {
      if (data.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('CHAT_COMMAND', { 
          detail: data.dispatchEvent 
        }));
      }
    };

    const fetchResponse = async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: input.trim(),
            completionStatus,
            sessionStage
          }),
        });

        if (response.ok) {
          const data = await response.json();
          await handleResponse(data);
        }
      } catch (error) {
        console.error('Error in chat response:', error);
      }
    };

    fetchResponse();
  }, [input, completionStatus, sessionStage]);

  // Add handleAuthConnect function
  const handleAuthConnect = useCallback(() => {
    window.open('/api/auth/signin/twitter', '_blank');
    setShowAuthModal(false);
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
    sessionStage,
    updateSessionStage,
    handleConnectXMessage,
    handleAuthenticatedMessage,
    handleTelegramRedirect,
    handleTelegramCode,
    handleWalletSubmit,
    handleReferenceCode,
    handleProtocolComplete,
    showAuthModal,
    setShowAuthModal,
    handleAuthConnect,
  };
}
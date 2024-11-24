import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ChatState, CompletionStatus, Message, ChatResponse } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';
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
import { SessionStage } from '@/types/session';
import { 
  validateSolanaAddress, 
  validateNearAddress, 
  parseWalletCommand, 
  verifyWalletTransaction 
} from '@/lib/walletValidator';




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
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);


useEffect(() => {
  const fetchInitialSession = async () => {
    try {
      const response = await fetch('/api/session');
      const data = await response.json();
      
      if (data.session?.stage) {
        setSessionStage(data.session.stage);
        
        const stageMessage = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: 'LOAD_CURRENT_STAGE',
            userId 
          }),
        });
        
        if (stageMessage.ok) {
          const messageData = await stageMessage.json();
          addMessage({
            id: uuidv4(),
            role: 'assistant',
            content: messageData.message,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching initial session:', error);
    }
  };

  fetchInitialSession();
}, [userId]);

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
    await updateSessionStage(SessionStage.WALLET_SUBMIT);
  }, [userId, updateSessionStage]);

  const handleTelegramRedirect = useCallback(async () => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: TELEGRAM_MESSAGE,
      timestamp: Date.now(),
    }]);
    await updateSessionStage(SessionStage.TELEGRAM_REDIRECT);
  }, [userId, updateSessionStage]);

  const handleConnectXMessage = useCallback(async () => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: POST_PUSH_MESSAGE,
      timestamp: Date.now(),
    }]);
    await updateSessionStage(SessionStage.CONNECT_TWITTER);
  }, [userId, updateSessionStage]);

  const handleAuthenticatedMessage = useCallback(async () => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: MANDATES_MESSAGE,
      timestamp: Date.now(),
    }]);
    
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
    await updateSessionStage(SessionStage.TELEGRAM_CODE);
  }, [userId, updateSessionStage]);
  

  const handleReferenceCode = useCallback(async () => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: REFERENCE_MESSAGE,
      timestamp: Date.now(),
    }]);
    await updateSessionStage(SessionStage.REFERENCE_CODE);
  }, [userId, updateSessionStage]);
  
  const handleProtocolComplete = useCallback(async () => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: PROTOCOL_COMPLETE_MESSAGE,
      timestamp: Date.now(),
    }]);
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
        case 'join telegram':
          newStatus.telegramComplete = true;
          newStatus.currentStep = 2;
          break;
        case 'verify':
          newStatus.verificationComplete = true;
          newStatus.currentStep = 3;
          break;
        case 'submit wallet':
          newStatus.walletComplete = true;
          newStatus.currentStep = 4;
          break;
        case 'reference':
          newStatus.referenceComplete = true;
          newStatus.currentStep = 5;
          break;
      }
      
      return newStatus;
    });
  
    // Then update session stage based on command
    switch (command) {
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


  // Add a message deduplication check
  const addMessage = useCallback((newMessage: Message) => {
    setMessages(prev => {
      // Check if this message already exists (within last 2 seconds)
      const isDuplicate = prev.some(msg => 
        msg.content === newMessage.content && 
        Math.abs(msg.timestamp - newMessage.timestamp) < 2000
      );
      
      if (isDuplicate) {
        return prev;
      }
      return [...prev, newMessage];
    });
  }, []);

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

    addMessage(userMessage);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    if (input.toLowerCase() === 'generate code') {
      try {
        // First add the system message about generating code
        addMessage({
          id: uuidv4(),
          content: '[GENERATING REFERENCE CODE]\n=============================\nINITIATING CODE GENERATION PROTOCOL...',
          role: 'assistant',
          timestamp: Date.now(),
        });

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: input.trim(),
            completionStatus,
            sessionStage
          }),
        });

        if (!response.ok) throw new Error('Failed to generate code');

        const data = await response.json();
        
        // Add a small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (data.code) {
          // Show the code generation success message
          addMessage({
            id: uuidv4(),
            content: `[CODE GENERATED SUCCESSFULLY]\n=============================\nYOUR REFERENCE CODE: ${data.code}\n\nThis code has been saved and can be shared with others.`,
            role: 'assistant',
            timestamp: Date.now(),
          });

          // Trigger the modal to show the code
          window.dispatchEvent(
            new CustomEvent('CHAT_MESSAGE', { 
              detail: {
                type: 'CODE_GENERATED',
                code: data.code
              }
            })
          );

          // Add a delay before showing completion message and updating stage
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Show the protocol complete message
          addMessage({
            id: uuidv4(),
            content: PROTOCOL_COMPLETE_MESSAGE,
            role: 'assistant',
            timestamp: Date.now(),
          });

          // Only update the stage after showing all messages
          if (data.newStage) {
            await updateSessionStage(data.newStage);
          }
        } else {
          addMessage({
            id: uuidv4(),
            content: 'ERROR: Failed to generate reference code. Please try again.',
            role: 'assistant',
            timestamp: Date.now(),
          });
        }
        
        setIsLoading(false);
        setIsTyping(false);
        setCanType(true);
        return;
      } catch (error) {
        console.error('Error generating code:', error);
        addMessage({
          id: uuidv4(),
          content: 'ERROR: Failed to generate reference code. Please try again.',
          role: 'assistant',
          timestamp: Date.now(),
        });
        setIsLoading(false);
        setIsTyping(false);
        setCanType(true);
        return;
      }
    }

    if (input.toLowerCase().includes('push')) {
      setTimeout(() => {
        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: UP_PUSH_RESPONSE_ART,
          timestamp: Date.now(),
          isIntro: true,
          showButton: true
        });
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

      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: TELEGRAM_REDIRECT_MESSAGE,
        timestamp: Date.now(),
      });
      setIsLoading(false);
      setIsTyping(false);
      return;
    }

    if (input.toLowerCase().startsWith('wallet ')) {
      const parsedWallets = parseWalletCommand(input);
      if (!parsedWallets) {
        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: WALLET_ERROR_MESSAGES.GENERAL.INVALID,
          timestamp: Date.now(),
        });
        setIsLoading(false);
        setIsTyping(false);
        return;
      }

      try {
        // Validate both addresses concurrently
        const [solanaValidation, nearValidation] = await Promise.all([
          validateSolanaAddress(parsedWallets.solanaAddress),
          validateNearAddress(parsedWallets.nearAddress)
        ]);

        // Check Solana validation
        if (!solanaValidation.isValid) {
          addMessage({
            id: uuidv4(),
            role: 'assistant',
            content: solanaValidation.error || WALLET_ERROR_MESSAGES.SOLANA.FORMAT,
            timestamp: Date.now(),
          });
          setIsLoading(false);
          setIsTyping(false);
          return;
        }

        // Check NEAR validation
        if (!nearValidation.isValid) {
          addMessage({
            id: uuidv4(),
            role: 'assistant',
            content: nearValidation.error || WALLET_ERROR_MESSAGES.NEAR.FORMAT,
            timestamp: Date.now(),
          });
          setIsLoading(false);
          setIsTyping(false);
          return;
        }

        // Verify transactions if needed
        const [solanaVerified, nearVerified] = await Promise.all([
          verifyWalletTransaction(parsedWallets.solanaAddress, 'solana'),
          verifyWalletTransaction(parsedWallets.nearAddress, 'near')
        ]);

        if (!solanaVerified || !nearVerified) {
          addMessage({
            id: uuidv4(),
            role: 'assistant',
            content: `[TRANSACTION VERIFICATION FAILED]
=============================
${WALLET_ERROR_MESSAGES.GENERAL.VERIFICATION_FAILED}

Required:
1. Solana wallet must have transaction history
2. NEAR wallet must have transaction history

Please ensure both wallets are active and try again.`,
            timestamp: Date.now(),
          });
          setIsLoading(false);
          setIsTyping(false);
          return;
        }

        // If valid and verified, proceed with submission
        handleCommandComplete('submit wallet');
        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: `[WALLET VERIFICATION COMPLETE]
============================
SOLANA WALLET: ${parsedWallets.solanaAddress}
NEAR WALLET: ${parsedWallets.nearAddress}
STATUS: VERIFIED ✓

[PROCEEDING TO NEXT STEP]
>Type "help" to see available commands`,
          timestamp: Date.now(),
        });
        setIsLoading(false);
        setIsTyping(false);
        return;
      } catch (error) {
        console.error('Wallet verification error:', error);
        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: WALLET_ERROR_MESSAGES.GENERAL.NETWORK_ERROR,
          timestamp: Date.now(),
        });
        setIsLoading(false);
        setIsTyping(false);
        return;
      }
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
        // Dispatch the event immediately
        window.dispatchEvent(
          new CustomEvent('CHAT_COMMAND', { 
            detail: 'CONNECT_TWITTER'
          })
        );
        
        addMessage({
          id: uuidv4(),
          content: data.message,
          role: 'assistant',
          timestamp: Date.now(),
        });
        
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

      addMessage(newMessage);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [input, isLoading, canType, addMessage, completionStatus, sessionStage, updateSessionStage, handleTelegramRedirect, handleTelegramCode, handleWalletSubmit, handleReferenceCode, handleProtocolComplete, handleCommandComplete]);



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

      // Get current session stage first
      const response = await fetch(`/api/session?userId=${userId}`);
      const data = await response.json();
      const currentStage = data.session?.stage || SessionStage.INTRO_MESSAGE;

      // Set initial message based on stage
      let initialMessage: Message;
      
      if (session?.user) {
        // Handle specific stages
        switch (currentStage) {
          case SessionStage.PROTOCOL_COMPLETE:
            initialMessage = {
              id: uuidv4(),
              role: 'assistant',
              content: PROTOCOL_COMPLETE_MESSAGE,
              timestamp: Date.now(),
              isIntro: true,
            };
            break;
            
          case SessionStage.MANDATES:
            initialMessage = {
              id: uuidv4(),
              role: 'assistant',
              content: MANDATES_MESSAGE,
              timestamp: Date.now(),
              isIntro: true,
            };
            break;
            
          case SessionStage.TELEGRAM_REDIRECT:
            initialMessage = {
              id: uuidv4(),
              role: 'assistant',
              content: TELEGRAM_MESSAGE,
              timestamp: Date.now(),
              isIntro: true,
            };
            break;
            
          case SessionStage.TELEGRAM_CODE:
            initialMessage = {
              id: uuidv4(),
              role: 'assistant',
              content: VERIFICATION_MESSAGE,
              timestamp: Date.now(),
              isIntro: true,
            };
            break;
            
          case SessionStage.WALLET_SUBMIT:
            initialMessage = {
              id: uuidv4(),
              role: 'assistant',
              content: WALLET_MESSAGE,
              timestamp: Date.now(),
              isIntro: true,
            };
            break;
            
          case SessionStage.REFERENCE_CODE:
            initialMessage = {
              id: uuidv4(),
              role: 'assistant',
              content: REFERENCE_MESSAGE,
              timestamp: Date.now(),
              isIntro: true,
            };
            break;
            
          default:
            // For other stages, get the appropriate stage message
            const stageResponse = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                message: 'LOAD_CURRENT_STAGE',
                userId 
              }),
            });
            
            const stageData = await stageResponse.json();
            
            initialMessage = {
              id: uuidv4(),
              role: 'assistant',
              content: stageData.message,
              timestamp: Date.now(),
              isIntro: true,
              isAuthenticated: true
            };
        }
      } else {
        initialMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: INTRO_MESSAGE,
          timestamp: Date.now(),
          isIntro: true
        };
      }

      setMessages([initialMessage]);
      setSessionStage(currentStage);
      await updateSessionStage(currentStage);
      setCanType(true);
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
            addMessage({
              id: uuidv4(),
              role: 'assistant',
              content: '[SYSTEM STATUS: ALREADY AUTHENTICATED]\n=============================\nX NETWORK CONNECTION ALREADY ESTABLISHED\n\n>TYPE "help" TO SEE AVAILABLE COMMANDS',
              timestamp: Date.now()
            });
            return;
          }

          // If not authenticated, proceed with normal flow
          await updateSessionStage(SessionStage.CONNECT_TWITTER);
          
          // Add delay before showing message
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Show connect X message
          addMessage({
            id: uuidv4(),
            role: 'assistant',
            content: '[SIGNAL DETECTED]\nFREQUENCY ANOMALY FOUND\nINITIATING DIGITAL BRIDGE PROTOCOL...\n\n>AWAITING X NETWORK SYNCHRONIZATION\n>TYPE "connect x account" TO PROCEED\n>WARNING: EXACT SYNTAX REQUIRED\n\nCONNECTION STATUS: PENDING...',
            timestamp: Date.now()
          });
          
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

  const generateReferralCode = async (twitterId: string) => {
    try {
      setIsLoading(true);
      console.log('[Generating Code] Attempting for Twitter ID:', twitterId);
      
      // Forward to dedicated generation endpoint instead of chat route
      const response = await fetch('/api/referral/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: twitterId,
          userName: session?.user?.name || 'USER'
        }),
      });
       const data = await response.json();
      console.log('[Generate Code Response]', data);
       if (!response.ok) {
        throw new Error(data.error || 'Failed to generate code');
      }
       // Add the response message to chat
      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
      });
       if (data.code) {
        console.log('[Code received]:', data.code);
        setReferralCode(data.code);
        
        // Update session stage if provided
        if (data.newStage) {
          await updateSessionStage(data.newStage);
        }
         // Trigger modal display
        window.dispatchEvent(
          new CustomEvent('CHAT_MESSAGE', {
            detail: {
              type: 'CODE_GENERATED',
              code: data.code
            }
          })
        );
      } else {
        throw new Error('No code in response');
      }
     } catch (error) {
      console.error('[Generate Code Error]:', error);
      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: `[SYSTEM DIAGNOSTIC]
   ============================
   EFERENCE CODE GENERATION FAILED
   IAGNOSTIC REPORT:
    ERROR TYPE: ${error instanceof Error ? error.name : 'Unknown'}
    ERROR CODE: ${error instanceof Error ? error.message : 'Unspecified'}
    TIMESTAMP: ${new Date().toISOString()}
   RECOMMENDED ACTION:
   TYPE "generate code" TO RETRY
   CONTACT SUPPORT IF ERROR PERSISTS`,
        timestamp: Date.now(),
      });
      setError('Failed to generate referral code');
    } finally {
      setIsLoading(false);
    }
  };
   // Update the checkExistingCode function to use the referral endpoint
   const checkExistingCode = async (twitterId: string) => {
    try {
      const response = await fetch('/api/referral/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: twitterId }),
      });
       if (!response.ok) {
        throw new Error('Failed to retrieve code');
      }
       const data = await response.json();
      
      if (data.code) {
        setReferralCode(data.code);
        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: data.message,
          timestamp: Date.now(),
        });
        
        if (data.newStage) {
          await updateSessionStage(data.newStage);
        }
      }
    } catch (error) {
      console.error('[Check Existing Code Error]:', error);
      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: `[SYSTEM DIAGNOSTIC]
   ============================
   EFERENCE CODE RETRIEVAL FAILED
   IAGNOSTIC REPORT:
    ERROR TYPE: ${error instanceof Error ? error.name : 'Unknown'}
    ERROR CODE: ${error instanceof Error ? error.message : 'Unspecified'}
    TIMESTAMP: ${new Date().toISOString()}
   RECOMMENDED ACTION:
   TYPE "show referral code" TO RETRY
   CONTACT SUPPORT IF ERROR PERSISTS`,
        timestamp: Date.now(),
      });
    }
  };

  // Add effect to check for existing code when reaching stage 9
  useEffect(() => {
    if (sessionStage === SessionStage.REFERENCE_CODE && session?.user?.id) {
      checkExistingCode(session.user.id);
    }
  }, [sessionStage, session?.user?.id,]);

  return {
    messages,
    input,
    isLoading,
    isTyping,
    canType,
    showTelegramFallback,
    completionStatus,
    setInput,
    addMessage,
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
    generateReferralCode,
    error,
    referralCode,
  };
} 
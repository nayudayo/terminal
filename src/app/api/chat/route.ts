import { Session } from 'next-auth';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { initDb } from '@/lib/db';
import Database from 'better-sqlite3';
import { 
  HELP_MESSAGE, 
  MANDATES_MESSAGE,
  TELEGRAM_MESSAGE,
  VERIFICATION_MESSAGE,
  WALLET_MESSAGE,
  REFERENCE_MESSAGE,
  AUTHENTICATED_MESSAGE,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PROTOCOL_MESSAGES,
  RESPONSE_MESSAGES,
  WALLET_ERROR_MESSAGES,
  PROTOCOL_COMPLETE_MESSAGE,
} from '@/constants/messages';
import { SessionManager } from '@/lib/sessionManager';
import { SessionStage } from '@/types/session';
import { generateResponse, handleAIChat, isCommand } from '@/lib/gptHandler';
import { AIResponse, ChatResponse } from '@/types/chat';
import { 
  validateSolanaAddress, 
  validateNearAddress, 
  parseWalletCommand, 
  verifyWalletTransaction,
  verifyTransactionHash
} from '@/lib/walletValidator';
import { STAGE_PROMPTS } from '@/constants/prompts';
import { Redis } from 'ioredis';  
import { logStageTransition } from '../../../lib/logger';
import { INTRO_MESSAGE } from '@/constants/messages';

interface ReferralCode {
  code: string;
  twitter_id: string;
  twitter_name: string;
  used_count: number;
  created_at: string;
}

interface StructuredMessage {
  prefix?: string;
  command?: string;
  middle?: string;
  command2?: string;
  suffix?: string;
}

function getStageMessage(stage: SessionStage): string | StructuredMessage {
  switch (stage) {
    case SessionStage.POST_PUSH_MESSAGE:
      return STAGE_PROMPTS[SessionStage.POST_PUSH_MESSAGE].example_responses[0];
    
    case SessionStage.INTRO_MESSAGE:
      return STAGE_PROMPTS[SessionStage.INTRO_MESSAGE].example_responses[0];
    
    case SessionStage.CONNECT_TWITTER:
      return STAGE_PROMPTS[SessionStage.CONNECT_TWITTER].example_responses[0];
    
    case SessionStage.AUTHENTICATED:
      return AUTHENTICATED_MESSAGE;
    
    case SessionStage.MANDATES:
      return MANDATES_MESSAGE;
    
    case SessionStage.TELEGRAM_REDIRECT:
      return TELEGRAM_MESSAGE;
    
    case SessionStage.TELEGRAM_CODE:
      return VERIFICATION_MESSAGE;
    
    case SessionStage.WALLET_SUBMIT:
      return WALLET_MESSAGE;
    
    case SessionStage.REFERENCE_CODE:
      return REFERENCE_MESSAGE;
    
    case SessionStage.PROTOCOL_COMPLETE:
      return PROTOCOL_COMPLETE_MESSAGE;
    
    default:
      return HELP_MESSAGE;
  }
}

async function resetSession(userId: string, reason: string): Promise<void> {
  console.log(`[Session Reset] User: ${userId}, Reason: ${reason}`);
  await SessionManager.createSession(userId, SessionStage.INTRO_MESSAGE);
  await logStageTransition(userId, 'RESET', SessionStage.INTRO_MESSAGE);
}

// Add interface for Telegram user record
interface TelegramUser {
  user_id: number;
  username: string;
  joined_group: boolean;
  joined_channel: boolean;
  encrypted_code: string;
  decrypted_code: string;
}

// Update the verification function with proper typing
async function verifyTelegramCode(encryptedCode: string, userId: string): Promise<boolean> {
  console.log('[Telegram Code Verification] Starting verification process');
  
  try {
    console.log('[Telegram DB] Connecting to database at /var/www/tg-bot/tg-auth/bot_database.sqlite');
    const db = new Database('/var/www/tg-bot/tg-auth/bot_database.sqlite', { readonly: true });
    
    console.log(`[Telegram Code] Checking encrypted code for user: ${userId}`);
    const result = db.prepare(
      'SELECT * FROM users WHERE encrypted_code = ?'
    ).get(encryptedCode) as TelegramUser | undefined;

    db.close();
    console.log('[Telegram DB] Database connection closed');
    
    if (result) {
      if (result.joined_channel) {
        console.log('[Telegram Code] Valid encrypted code found and user has joined channel');
        return true;
      } else {
        console.log('[Telegram Code] Valid code but user has not joined channel');
        return false;
      }
    } else {
      console.log('[Telegram Code] Invalid encrypted code');
      return false;
    }
  } catch (error) {
    console.error('[Telegram Verification Error]', {
      error,
      userId,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

export async function POST(request: Request) {
  // Declare these at the top of the function to make them available in catch block
  let session: (Session & { user: { id: string; name: string; email: string; }; accessToken: string; }) | null = null;
  let requestMessage = '';

  try {
    session = await getServerSession(authOptions) as Session & {
      user: {
        id: string;
        name: string;
        email: string;
      };
      accessToken: string;
    };
    const { message, userId } = await request.json();
    requestMessage = message; // Store message for error handler

    if (message === 'LOAD_CURRENT_STAGE') {
      if (!session?.user?.id) {
        return NextResponse.json({
          message: STAGE_PROMPTS[SessionStage.INTRO_MESSAGE].example_responses[0]
        });
      }

      try {
        const currentSession = await SessionManager.getSession(session.user.id);
        
        if (!currentSession) {
          await resetSession(session.user.id, 'No session found during load');
          return NextResponse.json({
            message: INTRO_MESSAGE,
            newStage: SessionStage.INTRO_MESSAGE
          });
        }

        // Validate session state
        if (!SessionStage[currentSession.stage]) {
          await resetSession(session.user.id, 'Invalid stage detected');
          return NextResponse.json({
            message: INTRO_MESSAGE,
            newStage: SessionStage.INTRO_MESSAGE
          });
        }

        console.log(`[Loading Stage] User: ${session.user.id}, Stage: ${currentSession.stage}`);
        return NextResponse.json({
          message: getStageMessage(currentSession.stage)
        });
      } catch (error) {
        console.error('[Session Load Error]', error);
        await resetSession(session.user.id, 'Error during stage load');
        return NextResponse.json({
          message: INTRO_MESSAGE,
          newStage: SessionStage.INTRO_MESSAGE
        });
      }
    }

    if (message.toLowerCase() === 'connect x account') {
      console.log('[API] Handling connect x account command');
      if (session) {
        console.log('[API] User already authenticated');
        await SessionManager.updateSessionStage(session.user.id, SessionStage.AUTHENTICATED);
        
        return NextResponse.json({
          message: AUTHENTICATED_MESSAGE.replace('ACCESS: GRANTED', `ACCESS: GRANTED\nUSER: ${session.user.name}`),
          shouldAutoScroll: true,
          dispatchEvent: 'AUTH_COMPLETE'
        });
      } else {
        console.log('[API] Initiating Twitter auth');
        return NextResponse.json({
          message: PROTOCOL_MESSAGES.TWITTER_AUTH.INITIATING,
          dispatchEvent: 'CONNECT_TWITTER',
          shouldAutoScroll: true,
          isTyping: true,
          action: 'CONNECT_TWITTER'
        });
      }
    }

    if (message.toLowerCase() === 'up_push_button' || message.toLowerCase() === 'down_push_button') {
      if (message.toLowerCase() === 'up_push_button') {
        return NextResponse.json({
          message: PROTOCOL_MESSAGES.BUTTON_SEQUENCE.ENGAGED,
          shouldAutoScroll: true
        });
      }
      
      if (message.toLowerCase() === 'down_push_button') {
        const currentSession = await SessionManager.getSession(userId);
        const currentStage = currentSession?.stage || SessionStage.INTRO_MESSAGE;
        await logStageTransition(userId, currentStage, SessionStage.POST_PUSH_MESSAGE);
        await SessionManager.updateSessionStage(userId, SessionStage.POST_PUSH_MESSAGE);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        return NextResponse.json({
          message: PROTOCOL_MESSAGES.BUTTON_SEQUENCE.SIGNAL_DETECTED,
          shouldAutoScroll: true,
          newStage: SessionStage.POST_PUSH_MESSAGE
        });
      }
    }

    if (session) {
      try {
        const currentSession = await SessionManager.getSession(session.user.id);
        
        if (!currentSession) {
          await resetSession(session.user.id, 'No session found for authenticated user');
          return NextResponse.json({
            message: INTRO_MESSAGE,
            newStage: SessionStage.INTRO_MESSAGE
          });
        }

        // Validate session state
        if (!SessionStage[currentSession.stage]) {
          await resetSession(session.user.id, 'Invalid stage for authenticated user');
          return NextResponse.json({
            message: INTRO_MESSAGE,
            newStage: SessionStage.INTRO_MESSAGE
          });
        }

        if (currentSession.stage === SessionStage.PROTOCOL_COMPLETE) {
          const aiResponse = await generateResponse(message, SessionStage.PROTOCOL_COMPLETE);
          return NextResponse.json({
            message: aiResponse,
            shouldAutoScroll: true
          });
        }

        const allowedGPTStages = [
          SessionStage.INTRO_MESSAGE,
          SessionStage.POST_PUSH_MESSAGE,
          SessionStage.CONNECT_TWITTER,
          SessionStage.PROTOCOL_COMPLETE
        ];

        if (allowedGPTStages.includes(currentSession.stage)) {
          if (!isCommand(message)) {
            const aiResponse = await generateResponse(message, currentSession.stage);
            
            const transition = await SessionManager.handleStageTransition(
              session.user.id,
              currentSession.stage,
              message
            );

            if (transition.newStage) {
              await SessionManager.updateSessionStage(session.user.id, transition.newStage);
              return NextResponse.json({
                message: transition.response,
                shouldAutoScroll: true,
                newStage: transition.newStage
              });
            }

            return NextResponse.json({
              message: aiResponse,
              shouldAutoScroll: true
            });
          }
        } else if (!isCommand(message)) {
          const stagePrompt = STAGE_PROMPTS[currentSession.stage];
          return NextResponse.json({
            message: stagePrompt.example_responses[
              Math.floor(Math.random() * stagePrompt.example_responses.length)
            ],
            shouldAutoScroll: true
          });
        }
      } catch (error) {
        console.error('[Authenticated Session Error]', error);
        await resetSession(session.user.id, 'Error in authenticated block');
        return NextResponse.json({
          message: INTRO_MESSAGE,
          newStage: SessionStage.INTRO_MESSAGE
        });
      }
    } else {
      if (!isCommand(message)) {
        const aiResponse = await generateResponse(message, SessionStage.INTRO_MESSAGE);
        return NextResponse.json({
          message: aiResponse,
          shouldAutoScroll: true
        });
      }
    }

    // Handle skip mandates command
    if (message.toLowerCase() === 'skip mandates') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      if (currentSession && currentSession.stage > SessionStage.MANDATES) {
        const currentStageMessage = getStageMessage(currentSession.stage);
        return NextResponse.json({
          message: `[CURRENT PROTOCOL STAGE]
=============================
${currentStageMessage}`,
          shouldAutoScroll: true
        });
      }

      if (!currentSession || currentSession.stage < SessionStage.MANDATES) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS
        });
      }

      await SessionManager.updateSessionStage(session.user.id, SessionStage.TELEGRAM_REDIRECT);
      return NextResponse.json({
        message: SUCCESS_MESSAGES.MANDATES_BYPASSED,
        commandComplete: true,
        shouldAutoScroll: true,
        newStage: SessionStage.TELEGRAM_REDIRECT
      });
    }

    // Handle skip telegram command
    if (message.toLowerCase() === 'skip telegram') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }
      
      await SessionManager.updateSessionStage(session.user.id, SessionStage.TELEGRAM_CODE);
      
      return NextResponse.json({
        message: SUCCESS_MESSAGES.TELEGRAM_BYPASSED,
        commandComplete: true,
        shouldAutoScroll: true
      });
    }

    // Handle skip verify command
    if (message.toLowerCase() === 'skip verify') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      if (!currentSession || currentSession.stage < SessionStage.TELEGRAM_CODE) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS
        });
      }

      // Update to WALLET_SUBMIT stage
      await SessionManager.updateSessionStage(session.user.id, SessionStage.WALLET_SUBMIT);
      
      return NextResponse.json({
        message: SUCCESS_MESSAGES.VERIFICATION_BYPASSED,
        commandComplete: true,
        shouldAutoScroll: true,
        newStage: SessionStage.WALLET_SUBMIT
      });
    }

    // Handle skip wallet command
    if (message.toLowerCase() === 'skip wallet') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      if (!currentSession || currentSession.stage < SessionStage.WALLET_SUBMIT) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS
        });
      }

      if (currentSession && currentSession.stage > SessionStage.WALLET_SUBMIT) {
        const currentStageMessage = getStageMessage(currentSession.stage);
        return NextResponse.json({
          message: `[CURRENT PROTOCOL STAGE]
=============================
${currentStageMessage}`,
          shouldAutoScroll: true
        });
      }

      await SessionManager.updateSessionStage(session.user.id, SessionStage.REFERENCE_CODE);
      return NextResponse.json({
        message: SUCCESS_MESSAGES.WALLET_BYPASSED,
        commandComplete: true,
        shouldAutoScroll: true,
        newStage: SessionStage.REFERENCE_CODE
      });
    }

    // Handle skip reference command
    if (message.toLowerCase() === 'skip reference') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      if (!currentSession || currentSession.stage < SessionStage.REFERENCE_CODE) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS
        });
      }

      if (currentSession && currentSession.stage > SessionStage.REFERENCE_CODE) {
        const currentStageMessage = getStageMessage(currentSession.stage);
        return NextResponse.json({
          message: `[CURRENT PROTOCOL STAGE]
=============================
${currentStageMessage}`,
          shouldAutoScroll: true
        });
      }

      await SessionManager.updateSessionStage(session.user.id, SessionStage.PROTOCOL_COMPLETE);
      return NextResponse.json({
        message: SUCCESS_MESSAGES.REFERENCE_BYPASSED,
        commandComplete: true,
        shouldAutoScroll: true,
        newStage: SessionStage.PROTOCOL_COMPLETE
      });
    }

    // Handle follow/like commands
    if (message.toLowerCase() === 'follow ptb') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      if (currentSession && currentSession.stage > SessionStage.MANDATES) {
        const currentStageMessage = getStageMessage(currentSession.stage);
        return NextResponse.json({
          message: `[CURRENT PROTOCOL STAGE]
=============================
${currentStageMessage}`,
          shouldAutoScroll: true
        });
      }

      try {
        const response = await fetch(new URL('/api/twitter/follow', request.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ userId: '1544715379855036418' }),
        });
        
        if (response.ok) {
          return NextResponse.json({
            message: SUCCESS_MESSAGES.FOLLOW_COMPLETE,
            commandComplete: true,
            shouldAutoScroll: true
          });
        } else {
          return NextResponse.json({
            message: ERROR_MESSAGES.FOLLOW_FAILED
          });
        }
      } catch (error) {
        console.error(error);
        return NextResponse.json({
          message: ERROR_MESSAGES.FOLLOW_FAILED
        });
      }
    }

    // Handle wallet command (without parameters)
    if (message.toLowerCase() === 'wallet') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      // Check if they're at a later stage
      if (currentSession && currentSession.stage > SessionStage.WALLET_SUBMIT) {
        const currentStageMessage = getStageMessage(currentSession.stage);
        return NextResponse.json({
          message: `[CURRENT PROTOCOL STAGE]
=============================
${currentStageMessage}`,
          shouldAutoScroll: true
        });
      }

      // Check if they're at an earlier stage
      if (!currentSession || currentSession.stage < SessionStage.WALLET_SUBMIT) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS
        });
      }

      return NextResponse.json({
        message: WALLET_MESSAGE
      });
    }

    // Handle wallet submission
    if (message.toLowerCase().startsWith('wallet ')) {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      // Check if they're at a later stage
      if (currentSession && currentSession.stage > SessionStage.WALLET_SUBMIT) {
        const currentStageMessage = getStageMessage(currentSession.stage);
        return NextResponse.json({
          message: `[CURRENT PROTOCOL STAGE]
=============================
${currentStageMessage}`,
          shouldAutoScroll: true
        });
      }

      // Check if they're at an earlier stage
      if (!currentSession || currentSession.stage < SessionStage.WALLET_SUBMIT) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS
        });
      }

      // Parse wallet addresses
      const parsedWallets = parseWalletCommand(message);
      if (!parsedWallets) {
        return NextResponse.json({
          message: `[WALLET FORMAT ERROR]
=============================
${WALLET_ERROR_MESSAGES.GENERAL.INVALID}

CORRECT FORMAT:
wallet <solana-address> <near-address>

EXAMPLES:
1. Solana: 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q
2. NEAR: username.near or username.testnet

Please try again with valid addresses.`
        });
      }

      try {
        // Validate both addresses concurrently
        const [solanaValidation, nearValidation] = await Promise.all([
          validateSolanaAddress(parsedWallets.solanaAddress),
          validateNearAddress(parsedWallets.nearAddress)
        ]);

        // Check Solana validation
        if (!solanaValidation.isValid) {
          return NextResponse.json({
            message: `[SOLANA VALIDATION ERROR]
=============================
${solanaValidation.error}

Please provide a valid Solana address.`
          });
        }

        // Check NEAR validation
        if (!nearValidation.isValid) {
          return NextResponse.json({
            message: `[NEAR VALIDATION ERROR]
=============================
${nearValidation.error}

Please provide a valid NEAR address.`
          });
        }

        // Add hash verification
        const [solanaHashVerification, nearHashVerification] = await Promise.all([
          verifyTransactionHash(parsedWallets.solanaAddress, parsedWallets.solanaHash, 'solana'),
          verifyTransactionHash(parsedWallets.nearAddress, parsedWallets.nearHash, 'near')
        ]);

        if (!solanaHashVerification.isValid) {
          return NextResponse.json({
            message: `[SOLANA HASH VERIFICATION ERROR]
=============================
${solanaHashVerification.error}

Please ensure your Solana wallet has valid transactions.`
          });
        }

        if (!nearHashVerification.isValid) {
          return NextResponse.json({
            message: `[NEAR HASH VERIFICATION ERROR]
=============================
${nearHashVerification.error}

Please ensure your NEAR wallet has valid transactions.`
          });
        }

        // Store wallet addresses, hashes, and update stage
        await SessionManager.updateSessionStage(
          session.user.id, 
          SessionStage.REFERENCE_CODE,
          {
            solanaWallet: parsedWallets.solanaAddress,
            nearWallet: parsedWallets.nearAddress,
            solanaHash: solanaHashVerification.hash,
            nearHash: nearHashVerification.hash
          }
        );

        return NextResponse.json({
          message: PROTOCOL_MESSAGES.WALLET_VALIDATION.COMPLETE,
          commandComplete: true,
          shouldAutoScroll: true,
          newStage: SessionStage.REFERENCE_CODE
        });
      } catch (error) {
        console.error('Wallet verification error:', error);
        return NextResponse.json({
          message: `[WALLET VERIFICATION ERROR]
=============================
${WALLET_ERROR_MESSAGES.GENERAL.NETWORK_ERROR}

Please try again later.`
        });
      }
    }

    // Handle reference code commands
    if (message.toLowerCase() === 'generate code') {
      console.log('[Reference Code] Starting code generation process');
      
      if (!session?.user) {
        console.log('[Reference Code] No authenticated user found');
        return NextResponse.json({ 
          message: PROTOCOL_MESSAGES.TWITTER_AUTH.MUST_AUTH 
        });
      }

      try {
        // Check stage first
        console.log(`[Reference Code] Checking stage for user: ${session.user.id}`);
        const currentSession = await SessionManager.getSession(session.user.id);
        
        if (!currentSession || currentSession.stage < SessionStage.REFERENCE_CODE) {
          console.log('[Reference Code] User not at correct stage:', currentSession?.stage);
          return NextResponse.json({
            message: ERROR_MESSAGES.PREVIOUS_STEPS
          });
        }

        console.log('[Reference Code] Stage validation passed, forwarding to generation endpoint');
        // Forward to dedicated generation endpoint
        const response = await fetch(new URL('/api/referral/generate', request.url), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            cookie: request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            userId: session.user.id,
            userName: session.user.name
          })
        });

        if (!response.ok) {
          console.error('[Reference Code] Generation endpoint failed:', response.statusText);
          throw new Error(`Generation failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[Reference Code] Code generated successfully:', {
          userId: session.user.id,
          isExisting: data.isExisting,
          code: data.code?.substring(0, 3) + '...' // Log partial code for security
        });
        
        return NextResponse.json({
          message: data.message,
          commandComplete: true,
          shouldAutoScroll: true,
          newStage: data.newStage,
          dispatchEvent: 'CODE_GENERATED',
          code: data.code,
          isExisting: data.isExisting
        });

      } catch (error) {
        console.error('[Reference Code] Generation process failed:', {
          error,
          userId: session.user.id,
          timestamp: new Date().toISOString(),
          stage: 'generation'
        });
        
        return NextResponse.json({
          message: ERROR_MESSAGES.REFERENCE_FAILED,
          error: true
        });
      }
    }

    // Handle like command
    if (message.toLowerCase() === 'like ptb') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      if (currentSession && currentSession.stage > SessionStage.MANDATES) {
        const currentStageMessage = getStageMessage(currentSession.stage);
        return NextResponse.json({
          message: `[CURRENT PROTOCOL STAGE]
=============================
${currentStageMessage}`,
          shouldAutoScroll: true
        });
      }

      try {
        const response = await fetch(new URL('/api/twitter/like', request.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ tweetId: 'target-tweet-id' }),
        });
        
        if (response.ok) {
          await SessionManager.updateSessionStage(session.user.id, SessionStage.TELEGRAM_REDIRECT);
          
          return NextResponse.json({
            message: SUCCESS_MESSAGES.LIKE_COMPLETE,
            commandComplete: true,
            shouldAutoScroll: true,
            newStage: SessionStage.TELEGRAM_REDIRECT
          });
        } else {
          return NextResponse.json({
            message: ERROR_MESSAGES.LIKE_FAILED
          });
        }
      } catch (error) {
        console.error(error);
        return NextResponse.json({
          message: ERROR_MESSAGES.LIKE_FAILED
        });
      }
    }

    // Handle telegram command
    if (message.toLowerCase() === 'telegram') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      if (!currentSession) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_NOT_FOUND
        });
      }

      // If they're at an earlier stage
      if (currentSession.stage < SessionStage.TELEGRAM_REDIRECT) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS
        });
      }

      // If they're at a later stage, show current stage
      if (currentSession.stage > SessionStage.TELEGRAM_REDIRECT) {
        const currentStageMessage = getStageMessage(currentSession.stage);
        return NextResponse.json({
          message: `[CURRENT PROTOCOL STAGE]
=============================
${currentStageMessage}`,
          shouldAutoScroll: true
        });
      }

      // If they're at the correct stage
      return NextResponse.json({
        message: TELEGRAM_MESSAGE
      });
    }

    // Handle verify command
    if (message.toLowerCase().startsWith('verify ')) {
      console.log('[Verify Command] Processing verification request');
      
      if (!session) {
        console.log('[Verify Command] No session found, rejecting request');
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      console.log('[Verify Command] Current session stage:', currentSession?.stage);
      
      if (!currentSession || currentSession.stage < SessionStage.TELEGRAM_CODE) {
        console.log('[Verify Command] Invalid stage, previous steps required');
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS
        });
      }

      if (currentSession.stage > SessionStage.TELEGRAM_CODE) {
        console.log('[Verify Command] Verification already completed');
        return NextResponse.json({
          message: ERROR_MESSAGES.VERIFICATION_PHASE_ALREADY_COMPLETED
        });
      }

      const code = message.split(' ')[1];
      console.log('[Verify Command] Extracted code:', code?.substring(0, 3) + '...');
      
      if (!code) {
        console.log('[Verify Command] No code provided');
        return NextResponse.json({
          message: ERROR_MESSAGES.INVALID_CODE_FORMAT
        });
      }

      try {
        console.log('[Verify Command] Starting code validation');
        const isValid = await verifyTelegramCode(code, session.user.id);
        
        if (!isValid) {
          console.log('[Verify Command] Code validation failed');
          return NextResponse.json({
            message: ERROR_MESSAGES.INVALID_CODE
          });
        }

        console.log('[Verify Command] Code validated successfully');
        console.log('[Verify Command] Updating session stage to WALLET_SUBMIT');
        
        // Update to WALLET_SUBMIT stage
        await SessionManager.updateSessionStage(session.user.id, SessionStage.WALLET_SUBMIT);
        
        console.log('[Verify Command] Verification process complete');
        return NextResponse.json({
          message: PROTOCOL_MESSAGES.VERIFICATION.COMPLETE,
          commandComplete: true,
          shouldAutoScroll: true,
          newStage: SessionStage.WALLET_SUBMIT
        });

      } catch (error) {
        console.error('[Verify Command] Verification process failed', {
          error,
          userId: session.user.id,
          code: code.substring(0, 3) + '...',
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({
          message: ERROR_MESSAGES.CODE_SUBMISSION_FAILED
        });
      }
    }

    // Handle show referral code command
    if (message.toLowerCase() === 'show referral code') {
      if (!session?.user) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }
       try {
        // Forward to dedicated get endpoint
        const response = await fetch(new URL('/api/referral/get', request.url), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            cookie: request.headers.get('cookie') || ''
          },
          body: JSON.stringify({ userId: session.user.id })
        });
         if (!response.ok) {
          throw new Error('Failed to retrieve code');
        }
         const data = await response.json();
        
        return NextResponse.json({
          message: data.message,
          code: data.code,
          newStage: data.newStage,
          commandComplete: true,
          shouldAutoScroll: true
        });
       } catch (error) {
        console.error('[API] Error retrieving code:', error);
        return NextResponse.json({
          message: ERROR_MESSAGES.REFERENCE_FAILED,
          error: true
        });
      }
    }

    // Handle submit code command
    if (message.toLowerCase().startsWith('submit code ')) {
      if (!session?.user) {
        return NextResponse.json({ 
          message: PROTOCOL_MESSAGES.TWITTER_AUTH.MUST_AUTH 
        });
      }

      const code = message.split(' ')[2];
      if (!code) {
        return NextResponse.json({ 
          message: ERROR_MESSAGES.INVALID_CODE_FORMAT 
        });
      }

      try {
        const db = await initDb();
        
        // Check if code exists and wasn't created by the same user
        const referralCode = await db.prepare(
          'SELECT * FROM referral_codes WHERE code = ? AND twitter_id != ?'
        ).get(code, session.user.id);

        if (!referralCode) {
          return NextResponse.json({
            message: ERROR_MESSAGES.INVALID_REFERENCE_CODE
          });
        }

        // Check if user already used a code
        const existingUse = await db.prepare(
          'SELECT * FROM referral_uses WHERE used_by_twitter_id = ?'
        ).get(session.user.id);

        if (existingUse) {
          return NextResponse.json({
            message: ERROR_MESSAGES.YOU_HAVE_ALREADY_USED_A_REFERENCE_CODE
          });
        }

        // Record code use
        await db.prepare(
          'INSERT INTO referral_uses (code, used_by_twitter_id) VALUES (?, ?)'
        ).run(code, session.user.id);

        // Update use count
        await db.prepare(
          'UPDATE referral_codes SET used_count = used_count + 1 WHERE code = ?'
        ).run(code);

        // Update session to PROTOCOL_COMPLETE
        await SessionManager.updateSessionStage(session.user.id, SessionStage.PROTOCOL_COMPLETE);

        return NextResponse.json({
          message: SUCCESS_MESSAGES.REFERENCE_ACCEPTED,
          commandComplete: true,
          shouldAutoScroll: true,
          newStage: SessionStage.PROTOCOL_COMPLETE
        });
      } catch (error) {
        console.error('Error submitting code:', error);
        return NextResponse.json({
          message: ERROR_MESSAGES.CODE_SUBMISSION_FAILED
        });
      }
    }

    // Handle mandates command
    if (message.toLowerCase() === 'mandates') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      if (currentSession && currentSession.stage > SessionStage.MANDATES) {
        const currentStageMessage = getStageMessage(currentSession.stage);
        return NextResponse.json({
          message: `[CURRENT PROTOCOL STAGE]
=============================
${currentStageMessage}`,
          shouldAutoScroll: true
        });
      }

      await SessionManager.updateSessionStage(session.user.id, SessionStage.MANDATES);
      return NextResponse.json({
        message: MANDATES_MESSAGE
      });
    }

    // Handle join telegram command
    if (message.toLowerCase() === 'join telegram') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED'
        });
      }
      await SessionManager.updateSessionStage(session.user.id, SessionStage.TELEGRAM_REDIRECT);
      return NextResponse.json({
        message: PROTOCOL_MESSAGES.TELEGRAM.JOIN_COMPLETE,
        commandComplete: true,
        shouldAutoScroll: true
      });
    }

    // Handle reference command
    if (message.toLowerCase() === 'reference') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      if (!currentSession || currentSession.stage < SessionStage.REFERENCE_CODE) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS
        });
      }

      if (currentSession && currentSession.stage > SessionStage.REFERENCE_CODE) {
        const currentStageMessage = getStageMessage(currentSession.stage);
        return NextResponse.json({
          message: `[CURRENT PROTOCOL STAGE]
=============================
${currentStageMessage}`,
          shouldAutoScroll: true
        });
      }

      return NextResponse.json({
        message: REFERENCE_MESSAGE
      });
    }

    // If no other conditions matched, generate AI response
    if (session) {
      try {
        const currentSession = await SessionManager.getSession(session.user.id);
        
        if (!currentSession) {
          await resetSession(session.user.id, 'No session found for AI response');
          return NextResponse.json({
            message: INTRO_MESSAGE,
            newStage: SessionStage.INTRO_MESSAGE
          });
        }

        // Generate AI response with validated session
        const aiResponse = await generateResponse(message, currentSession.stage);
        await logStageTransition(session.user.id, 'AI_RESPONSE', currentSession.stage);
        
        return NextResponse.json({
          message: aiResponse,
          shouldAutoScroll: true
        });
      } catch (error) {
        console.error('[AI Response Error]', error);
        await resetSession(session.user.id, 'Error during AI response');
        return NextResponse.json({
          message: INTRO_MESSAGE,
          newStage: SessionStage.INTRO_MESSAGE
        });
      }
    }

    // Default response if no session exists
    return NextResponse.json({
      message: 'Please authenticate to continue.',
      shouldAutoScroll: true
    });

  } catch (error) {
    const errorSession = session; // Now session is available
    const errorMessage = requestMessage; // Now message is available
    
    console.error('[Chat Route Error]', {
      error,
      userId: errorSession?.user?.id,
      message: errorMessage
    });

    if (errorSession?.user?.id) {
      try {
        await resetSession(errorSession.user.id, 'Error recovery');
      } catch (resetError) {
        console.error('[Reset Error]', resetError);
      }
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal Server Error',
        message: INTRO_MESSAGE,
        newStage: SessionStage.INTRO_MESSAGE
      },
      { status: 500 }
    );
  }
}
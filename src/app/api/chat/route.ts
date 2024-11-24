import { Session } from 'next-auth';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { generateReferralCode, initDb } from '@/lib/db';
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
  verifyWalletTransaction 
} from '@/lib/walletValidator';
import { STAGE_PROMPTS } from '@/constants/prompts';
import { Redis } from 'ioredis';

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

const logStageTransition = async (userId: string, fromStage: SessionStage, toStage: SessionStage) => {
  console.log(`[Stage Transition] User: ${userId} | ${SessionStage[fromStage]} -> ${SessionStage[toStage]}`);
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as Session & {
      user: {
        id: string;
        name: string;
        email: string;
      };
      accessToken: string;
    };
    const { message, userId } = await request.json();

    if (message === 'LOAD_CURRENT_STAGE') {
      if (!session?.user?.id) {
        return NextResponse.json({
          message: STAGE_PROMPTS[SessionStage.INTRO_MESSAGE].example_responses[0]
        });
      }

      try {
        let currentSession = await SessionManager.getSession(session.user.id);
        
        if (!currentSession) {
          currentSession = await SessionManager.createSession(session.user.id, SessionStage.INTRO_MESSAGE);
          console.log(`[New Session Created] User: ${session.user.id}, Stage: ${currentSession.stage}`);
        }

        console.log(`[Loading Stage] User: ${session.user.id}, Stage: ${currentSession.stage}`);
        return NextResponse.json({
          message: getStageMessage(currentSession.stage)
        });
      } catch (error) {
        console.error('Error loading stage:', error);
        return NextResponse.json({
          message: PROTOCOL_MESSAGES.LOAD_STAGE.ERROR.SESSION_NOT_FOUND
        });
      }
    }

    if (message.toLowerCase() === 'connect x account') {
      console.log('[API] Handling connect x account command');
      if (session) {
        console.log('[API] User already authenticated');
        await SessionManager.updateSessionStage(session.user.id, SessionStage.AUTHENTICATED);
        
        const db = await initDb();
        await db.prepare(
          `UPDATE message_tracking 
           SET connect_x_message_shown = TRUE 
           WHERE user_id = ?`
        ).run(session.user.id);

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
      let currentSession = await SessionManager.getSession(session.user.id);
      
      if (!currentSession) {
        currentSession = await SessionManager.createSession(session.user.id, SessionStage.INTRO_MESSAGE);
        console.log(`[New Session Created] User: ${session.user.id}, Stage: ${currentSession.stage}`);
        return NextResponse.json({
          message: STAGE_PROMPTS[SessionStage.INTRO_MESSAGE].example_responses[0],
          shouldAutoScroll: true
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

        // Verify transactions if needed
        const [solanaVerified, nearVerified] = await Promise.all([
          verifyWalletTransaction(parsedWallets.solanaAddress, 'solana'),
          verifyWalletTransaction(parsedWallets.nearAddress, 'near')
        ]);

        if (!solanaVerified || !nearVerified) {
          return NextResponse.json({
            message: `[TRANSACTION VERIFICATION FAILED]
=============================
${WALLET_ERROR_MESSAGES.GENERAL.VERIFICATION_FAILED}

Required Actions:
1. Solana wallet must have transaction history
2. NEAR wallet must have transaction history

Please ensure both wallets are active and try again.`
          });
        }

        // Store wallet addresses and update stage
        await SessionManager.updateSessionStage(
          session.user.id, 
          SessionStage.REFERENCE_CODE,
          {
            solanaWallet: parsedWallets.solanaAddress,
            nearWallet: parsedWallets.nearAddress
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
      console.log('[API] Handling generate code command');
      
      if (!session?.user) {
        return NextResponse.json({ 
          message: PROTOCOL_MESSAGES.TWITTER_AUTH.MUST_AUTH 
        });
      }
       try {
        // Check stage first
        const currentSession = await SessionManager.getSession(session.user.id);
        if (!currentSession || currentSession.stage < SessionStage.REFERENCE_CODE) {
          return NextResponse.json({
            message: ERROR_MESSAGES.PREVIOUS_STEPS
          });
        }
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
          throw new Error(`Generation failed: ${response.statusText}`);
        }
         const data = await response.json();
        
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
        console.error('[API] Error generating code:', error);
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

    // Handle verify command
    if (message.toLowerCase() === 'verify') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      if (currentSession && currentSession.stage > SessionStage.TELEGRAM_CODE) {
        const currentStageMessage = getStageMessage(currentSession.stage);
        return NextResponse.json({
          message: `[CURRENT PROTOCOL STAGE]
=============================
${currentStageMessage}`,
          shouldAutoScroll: true
        });
      }

      if (currentSession && currentSession.stage > SessionStage.TELEGRAM_CODE) {
        return NextResponse.json({
          message: 'ERROR: VERIFICATION PHASE ALREADY COMPLETED'
        });
      }

      await SessionManager.updateSessionStage(session.user.id, SessionStage.TELEGRAM_CODE);
      return NextResponse.json({
        message: VERIFICATION_MESSAGE
      });
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

    // Handle verify code command
    if (message.toLowerCase().startsWith('verify ')) {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED'
        });
      }
      // Add your code verification logic here
      await SessionManager.updateSessionStage(session.user.id, SessionStage.TELEGRAM_CODE);
      return NextResponse.json({
        message: PROTOCOL_MESSAGES.VERIFICATION.COMPLETE,
        commandComplete: true,
        shouldAutoScroll: true
      });
    }

    // Handle skip reference command
    if (message.toLowerCase() === 'skip reference') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }
      await SessionManager.updateSessionStage(session.user.id, SessionStage.PROTOCOL_COMPLETE);
      return NextResponse.json({
        message: SUCCESS_MESSAGES.REFERENCE_BYPASSED,
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

    // If no other conditions matched, generate AI response
    if (session) {
      let currentSession = await SessionManager.getSession(session.user.id);
      
      if (!currentSession) {
        currentSession = await SessionManager.createSession(session.user.id, SessionStage.INTRO_MESSAGE);
        console.log(`[New Session Created] User: ${session.user.id}, Stage: ${currentSession.stage}`);
        return NextResponse.json({
          message: STAGE_PROMPTS[SessionStage.INTRO_MESSAGE].example_responses[0],
          shouldAutoScroll: true
        });
      }

      // Generate AI response
      const aiResponse = await generateResponse(message, currentSession.stage);
      return NextResponse.json({
        message: aiResponse,
        shouldAutoScroll: true
      });
    }

    // Default response if no session exists
    return NextResponse.json({
      message: 'Please authenticate to continue.',
      shouldAutoScroll: true
    });

  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
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

interface ReferralCode {
  code: string;
  twitter_id: string;
  twitter_name: string;
  used_count: number;
  created_at: string;
}

// Update the getStageMessage function to be more comprehensive
function getStageMessage(stage: SessionStage): string {
  switch (stage) {
    case SessionStage.INTRO_MESSAGE:
      return STAGE_PROMPTS[SessionStage.INTRO_MESSAGE].example_responses[0];
    
    case SessionStage.POST_PUSH_MESSAGE:
      return STAGE_PROMPTS[SessionStage.POST_PUSH_MESSAGE].example_responses[0];
    
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


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { message, userId } = await request.json();

    // Handle LOAD_CURRENT_STAGE first
    if (message === 'LOAD_CURRENT_STAGE') {
      if (!session?.user?.id) {
        // For unauthenticated users, return the intro message
        return NextResponse.json({
          message: STAGE_PROMPTS[SessionStage.INTRO_MESSAGE].example_responses[0]
        });
      }

      try {
        let currentSession = await SessionManager.getSession(session.user.id);
        
        if (!currentSession) {
          // Create new session if none exists
          currentSession = await SessionManager.createSession(session.user.id, SessionStage.INTRO_MESSAGE);
          console.log(`[New Session Created] User: ${session.user.id}, Stage: ${currentSession.stage}`);
        }

        // Return the appropriate message for their current stage
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

    // Handle Twitter connection command first
    if (message.toLowerCase() === 'connect x account') {
      if (session) {
        // If already authenticated, update stage and show authenticated message
        await SessionManager.updateSessionStage(session.user.id, SessionStage.AUTHENTICATED);
        
        return NextResponse.json({
          message: AUTHENTICATED_MESSAGE.replace('ACCESS: GRANTED', `ACCESS: GRANTED\nUSER: ${session.user.name}`),
          shouldAutoScroll: true
        });
      } else {
        // If not authenticated, trigger Twitter auth
        return NextResponse.json({
          message: PROTOCOL_MESSAGES.TWITTER_AUTH.INITIATING,
          dispatchEvent: 'CONNECT_TWITTER',
          shouldAutoScroll: true
        });
      }
    }

    // Then handle push button sequence
    if (message.toLowerCase() === 'up_push_button') {
      return NextResponse.json({
        message: PROTOCOL_MESSAGES.BUTTON_SEQUENCE.ENGAGED,
        shouldAutoScroll: true
      });
    }

    if (message.toLowerCase() === 'down_push_button') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({
        message: PROTOCOL_MESSAGES.BUTTON_SEQUENCE.SIGNAL_DETECTED,
        shouldAutoScroll: true
      });
    }

    // Then handle AI chat responses
    if (session) {
      let currentSession = await SessionManager.getSession(session.user.id);
      
      // Create session if it doesn't exist
      if (!currentSession) {
        currentSession = await SessionManager.createSession(session.user.id, SessionStage.INTRO_MESSAGE);
        console.log(`[New Session Created] User: ${session.user.id}, Stage: ${currentSession.stage}`);
      }
      
      // If they've completed the protocol, allow free chat
      if (currentSession.stage === SessionStage.PROTOCOL_COMPLETE) {
        const aiResponse = await generateResponse(message, SessionStage.PROTOCOL_COMPLETE);
        return NextResponse.json({
          message: aiResponse,
          shouldAutoScroll: true
        });
      }

      // If message is not a command and they're still in protocol
      if (!isCommand(message)) {
        const aiResponse = await generateResponse(message, currentSession.stage);
        
        // Get stage transition if applicable
        const transition = await SessionManager.handleStageTransition(
          session.user.id,
          currentSession.stage,
          message
        );

        // If there's a stage transition, update Redis session
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
    } else {
      // For unauthenticated users, return intro message instead of free chat
      return NextResponse.json({
        message: STAGE_PROMPTS[SessionStage.INTRO_MESSAGE].example_responses[0]
      });
    }

    // Handle skip mandates command
    if (message.toLowerCase() === 'skip mandates') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      if (!currentSession || currentSession.stage > SessionStage.MANDATES) {
        return NextResponse.json({
          message: ERROR_MESSAGES.MANDATE_COMPLETED
        });
      }

      await SessionManager.updateSessionStage(session.user.id, SessionStage.TELEGRAM_REDIRECT);
      return NextResponse.json({
        message: SUCCESS_MESSAGES.MANDATES_BYPASSED,
        commandComplete: true,
        shouldAutoScroll: true
      });
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
        return NextResponse.json({
          message: ERROR_MESSAGES.MANDATE_COMPLETED
        });
      }

      await SessionManager.updateSessionStage(session.user.id, SessionStage.MANDATES);
      return NextResponse.json({
        message: MANDATES_MESSAGE
      });
    }

    // Handle follow command
    if (message.toLowerCase() === 'follow ptb') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
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

    // Handle like command
    if (message.toLowerCase() === 'like ptb') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
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

      if (currentSession.stage === SessionStage.TELEGRAM_REDIRECT) {
        return NextResponse.json({
          message: TELEGRAM_MESSAGE
        });
      }

      if (currentSession.stage < SessionStage.TELEGRAM_REDIRECT) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS
        });
      }

      return NextResponse.json({
        message: ERROR_MESSAGES.TELEGRAM_PHASE_ALREADY_COMPLETED
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
          message: 'ERROR: X NETWORK CONNECTION REQUIRED\nPLEASE CONNECT X ACCOUNT FIRST'
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      if (!currentSession || currentSession.stage < SessionStage.TELEGRAM_CODE) {
        return NextResponse.json({
          message: 'ERROR: MUST COMPLETE PREVIOUS STEPS FIRST'
        });
      }

      if (currentSession.stage > SessionStage.TELEGRAM_CODE) {
        return NextResponse.json({
          message: 'ERROR: VERIFICATION PHASE ALREADY COMPLETED'
        });
      }

      await SessionManager.updateSessionStage(session.user.id, SessionStage.TELEGRAM_CODE);
      return NextResponse.json({
        message: VERIFICATION_MESSAGE
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

    // Handle wallet command
    if (message.toLowerCase() === 'wallet') {
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

      // Check if they're at the correct stage
      if (currentSession.stage === SessionStage.WALLET_SUBMIT) {
        return NextResponse.json({
          message: WALLET_MESSAGE,
          shouldAutoScroll: true
        });
      }

      // If they're at an earlier stage
      if (currentSession.stage < SessionStage.WALLET_SUBMIT) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS,
          shouldAutoScroll: true
        });
      }

      // If they're at a later stage
      return NextResponse.json({
        message: ERROR_MESSAGES.WALLET_PHASE_ALREADY_COMPLETED,
        shouldAutoScroll: true
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

      // Update to REFERENCE_CODE stage
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
      
      if (!currentSession) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_NOT_FOUND
        });
      }

      // Check if they're at the correct stage
      if (currentSession.stage === SessionStage.REFERENCE_CODE) {
        return NextResponse.json({
          message: REFERENCE_MESSAGE,
          shouldAutoScroll: true
        });
      }

      // If they're at an earlier stage
      if (currentSession.stage < SessionStage.REFERENCE_CODE) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS,
          shouldAutoScroll: true
        });
      }

      // If they're at a later stage
      return NextResponse.json({
        message: ERROR_MESSAGES.REFERENCE_PHASE_ALREADY_COMPLETED,
        shouldAutoScroll: true
      });
    }

    // Handle generate code command
    if (message.toLowerCase() === 'generate code') {
      if (!session?.user) {
        return NextResponse.json({ 
          message: PROTOCOL_MESSAGES.TWITTER_AUTH.MUST_AUTH 
        });
      }

      const currentSession = await SessionManager.getSession(session.user.id);
      
      if (!currentSession || currentSession.stage < SessionStage.REFERENCE_CODE) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS
        });
      }

      try {
        const db = await initDb();
        
        // First check if user already has a code
        const existingCode = await db.prepare(
          'SELECT code FROM referral_codes WHERE twitter_id = ?'
        ).get(session.user.id) as ReferralCode | undefined;

        if (existingCode) {
          // If they have a code, show it and complete protocol
          await SessionManager.updateSessionStage(session.user.id, SessionStage.PROTOCOL_COMPLETE);
          
          return NextResponse.json({ 
            message: SUCCESS_MESSAGES.REFERENCE_CODE_EXISTS(existingCode.code),
            commandComplete: true,
            shouldAutoScroll: true,
            newStage: SessionStage.PROTOCOL_COMPLETE
          });
        }

        // If no existing code, generate a new one
        const code = await generateReferralCode(session.user.id, session.user.name || 'USER');
        
        // After successful generation, update stage
        await SessionManager.updateSessionStage(session.user.id, SessionStage.PROTOCOL_COMPLETE);

        return NextResponse.json({
          message: SUCCESS_MESSAGES.REFERENCE_CODE_GENERATED(code),
          commandComplete: true,
          shouldAutoScroll: true,
          newStage: SessionStage.PROTOCOL_COMPLETE
        });
      } catch (error) {
        console.error('Error generating reference code:', error);
        return NextResponse.json({
          message: ERROR_MESSAGES.GENERATE_CODE_FAILED
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
        
        // Verify code first
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

        // Only after successful code submission, update stage
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

    // Handle wallet submission command
    if (message.toLowerCase().startsWith('wallet ')) {
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

      const parsedWallets = parseWalletCommand(message);
      if (!parsedWallets) {
        return NextResponse.json({
          message: WALLET_ERROR_MESSAGES.GENERAL.INVALID
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
            message: solanaValidation.error
          });
        }

        // Check NEAR validation
        if (!nearValidation.isValid) {
          return NextResponse.json({
            message: nearValidation.error
          });
        }

        // Store wallet addresses in session
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
          message: WALLET_ERROR_MESSAGES.GENERAL.NETWORK_ERROR
        });
      }
    }

    // Handle show referral code command
    if (message.toLowerCase() === 'show referral code') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      try {
        const db = await initDb();
        const existingCode = await db.prepare(
          'SELECT code FROM referral_codes WHERE twitter_id = ?'
        ).get(session.user.id) as Pick<ReferralCode, 'code'> | undefined;

        if (!existingCode) {
          return NextResponse.json({
            message: RESPONSE_MESSAGES.NO_REFERENCE_CODE
          });
        }

        return NextResponse.json({
          message: RESPONSE_MESSAGES.REFERENCE_CODE_RETRIEVED(existingCode.code)
        });
      } catch (error) {
        console.error('Error retrieving code:', error);
        return NextResponse.json({
          message: ERROR_MESSAGES.REFERENCE_FAILED
        });
      }
    }

  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
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
  PROTOCOL_COMPLETE_MESSAGE,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  RESPONSE_MESSAGES
} from '@/constants/messages';
import { SessionManager } from '@/lib/sessionManager';
import { SessionStage } from '@/types/session';
import { generateResponse } from '@/lib/gptHandler';

interface ReferralCode {
  code: string;
  twitter_id: string;
  twitter_name: string;
  used_count: number;
  created_at: string;
}

// Add this function at the top to get stage-specific messages
function getStageMessage(stage: SessionStage): string {
  switch (stage) {
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
      return AUTHENTICATED_MESSAGE;
  }
}

// Add interface for SQLite user session
interface DBUserSession {
  user_id: string;
  stage: number;
  twitter_id: string | null;
  original_user_id: string | null;
  access_token: string | null;
  last_active: number | null;
  created_at: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { message, userId } = await request.json();

    // If message is 'LOAD_CURRENT_STAGE', return the appropriate message for their stage
    if (message === 'LOAD_CURRENT_STAGE') {
      if (!session?.user?.id) {
        return NextResponse.json({
          message: AUTHENTICATED_MESSAGE
        });
      }

      try {
        // First try to get session from Redis
        const redisSession = await SessionManager.getSession(session.user.id);
        
        if (redisSession) {
          console.log(`[Loading Stage from Redis] Twitter ID: ${session.user.id}, Stage: ${redisSession.stage}`);
          return NextResponse.json({
            message: getStageMessage(redisSession.stage)
          });
        }

        // If no Redis session, check SQLite
        const db = await initDb();
        const userMapping = await db.prepare(
          'SELECT * FROM user_sessions WHERE twitter_id = ?'
        ).get(session.user.id) as DBUserSession | undefined;

        if (!userMapping) {
          return NextResponse.json({
            message: AUTHENTICATED_MESSAGE
          });
        }

        // If found in SQLite but not in Redis, recreate Redis session
        const newSession = await SessionManager.createSession(
          session.user.id, 
          userMapping.stage as SessionStage // Cast to SessionStage since we know it's valid
        );

        if (newSession) {
          console.log(`[Loading Stage from SQLite] Twitter ID: ${session.user.id}, Stage: ${newSession.stage}`);
          return NextResponse.json({
            message: getStageMessage(newSession.stage)
          });
        }

        return NextResponse.json({
          message: AUTHENTICATED_MESSAGE
        });
      } catch (error) {
        console.error('Error loading stage:', error);
        return NextResponse.json({
          message: AUTHENTICATED_MESSAGE
        });
      }
    }

    // Handle push button sequence
    if (message.toLowerCase() === 'up_push_button') {
      return NextResponse.json({
        message: '[BUTTON ENGAGED]\nINITIATING SEQUENCE...',
        shouldAutoScroll: true
      });
    }

    if (message.toLowerCase() === 'down_push_button') {
      // Add a delay before showing the connect message
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

      return NextResponse.json({
        message: '[SIGNAL DETECTED]\nFREQUENCY ANOMALY FOUND\nINITIATING DIGITAL BRIDGE PROTOCOL...\n\n>AWAITING X NETWORK SYNCHRONIZATION\n>TYPE "connect x account" TO PROCEED\n>WARNING: EXACT SYNTAX REQUIRED\n\nCONNECTION STATUS: PENDING...',
        shouldAutoScroll: true
      });
    }

    // Handle Twitter connection command
    if (message.toLowerCase() === 'connect x account') {
      if (session) {
        await SessionManager.updateSessionStage(session.user.id, SessionStage.AUTHENTICATED);
        
        // Mark connect_x_message as shown
        const db = await initDb();
        await db.prepare(
          `UPDATE message_tracking 
           SET connect_x_message_shown = TRUE 
           WHERE user_id = ?`
        ).run(session.user.id);

        return NextResponse.json({
          message: AUTHENTICATED_MESSAGE.replace('ACCESS: GRANTED', `ACCESS: GRANTED\nUSER: ${session.user.name}`)
        });
      } else {
        return NextResponse.json({
          message: '[INITIATING X NETWORK SYNC]\nRedirecting to authorization...',
          dispatchEvent: 'CONNECT_TWITTER'
        });
      }
    }

    // Handle help command
    if (message.toLowerCase() === 'help') {
      return NextResponse.json({
        message: HELP_MESSAGE
      });
    }

    // Handle skip mandates command
    if (message.toLowerCase() === 'skip mandates') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED\nPLEASE CONNECT X ACCOUNT FIRST'
        });
      }

      // Get current session to check stage
      const currentSession = await SessionManager.getSession(session.user.id);
      
      // Only allow skip if in correct stage
      if (!currentSession || currentSession.stage > SessionStage.MANDATES) {
        return NextResponse.json({
          message: 'ERROR: MANDATE PHASE ALREADY COMPLETED'
        });
      }

      await SessionManager.updateSessionStage(session.user.id, SessionStage.TELEGRAM_REDIRECT);
      return NextResponse.json({
        message: `[MANDATE PROTOCOL BYPASSED]
=============================
BYPASS AUTHORIZED
SKIPPING MANDATE VERIFICATION...

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [BYPASSED]
2. TELEGRAM SYNC [UNLOCKED]
   >TYPE "telegram" TO PROCEED
   >TYPE "skip telegram" TO BYPASS
3. VERIFICATION CODE [LOCKED]
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`,
        commandComplete: true,
        shouldAutoScroll: true
      });
    }

    // Handle mandates command
    if (message.toLowerCase() === 'mandates') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED\nPLEASE CONNECT X ACCOUNT FIRST'
        });
      }

      // Get current session to check stage
      const currentSession = await SessionManager.getSession(session.user.id);
      
      // If they've already completed or bypassed mandates, don't allow going back
      if (currentSession && currentSession.stage > SessionStage.MANDATES) {
        return NextResponse.json({
          message: `ERROR: MANDATE PHASE ALREADY COMPLETED
=============================
CURRENT PHASE: ${getStageMessage(currentSession.stage)}`
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
          message: 'ERROR: X NETWORK CONNECTION REQUIRED'
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
            message: `[FOLLOW MANDATE COMPLETE]
=============================

STEP [1/5]: MANDATES
-------------------
MANDATE STATUS:
1. FOLLOW PTB [COMPLETE] ■
2. LIKE PTB [PENDING] □

BYPASS OPTIONS:
-------------
>TYPE "skip like" TO BYPASS REMAINING MANDATE
>TYPE "skip mandates" TO BYPASS ALL MANDATES

>PROCEED WITH REMAINING MANDATE`,
            commandComplete: true,
            shouldAutoScroll: true
          });
        } else {
          return NextResponse.json({
            message: 'ERROR: FOLLOW MANDATE FAILED\nPLEASE TRY AGAIN'
          });
        }
      } catch (error) {
        console.error(error);
        return NextResponse.json({
          message: 'ERROR: FOLLOW MANDATE FAILED\nPLEASE TRY AGAIN'
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
          return NextResponse.json({
            message: SUCCESS_MESSAGES.LIKE_COMPLETE,
            commandComplete: true,
            shouldAutoScroll: true
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
      
      if (!currentSession || currentSession.stage < SessionStage.TELEGRAM_REDIRECT) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS
        });
      }

      await SessionManager.updateSessionStage(session.user.id, SessionStage.TELEGRAM_REDIRECT);
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
      
      // Skip showing the TELEGRAM_MESSAGE and go straight to bypass
      await SessionManager.updateSessionStage(session.user.id, SessionStage.TELEGRAM_CODE);
      
      return NextResponse.json({
        message: SUCCESS_MESSAGES.TELEGRAM_SYNC_BYPASSED,
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
      
      if (!currentSession || currentSession.stage < SessionStage.TELEGRAM_CODE) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS
        });
      }

      if (currentSession.stage > SessionStage.TELEGRAM_CODE) {
        return NextResponse.json({
          message: ERROR_MESSAGES.VERIFICATION_PHASE_ALREADY_COMPLETED
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
      await SessionManager.updateSessionStage(session.user.id, SessionStage.TELEGRAM_CODE);
      return NextResponse.json({
        message: `[VERIFICATION PROTOCOL BYPASSED]
=============================
BYPASS AUTHORIZED
SKIPPING CODE VERIFICATION...

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [COMPLETE]
3. VERIFICATION CODE [BYPASSED]
4. WALLET SUBMISSION [UNLOCKED]
   >TYPE "wallet" TO PROCEED
   >TYPE "skip wallet" TO BYPASS
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`,
        commandComplete: true,
        shouldAutoScroll: true
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
      
      if (!currentSession || currentSession.stage < SessionStage.WALLET_SUBMIT) {
        return NextResponse.json({
          message: ERROR_MESSAGES.PREVIOUS_STEPS
        });
      }

      if (currentSession.stage > SessionStage.WALLET_SUBMIT) {
        return NextResponse.json({
          message: ERROR_MESSAGES.WALLET_PHASE_ALREADY_COMPLETED
        });
      }

      await SessionManager.updateSessionStage(session.user.id, SessionStage.WALLET_SUBMIT);
      return NextResponse.json({
        message: WALLET_MESSAGE
      });
    }

    // Handle skip wallet command
    if (message.toLowerCase() === 'skip wallet') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }
      await SessionManager.updateSessionStage(session.user.id, SessionStage.WALLET_SUBMIT);
      return NextResponse.json({
        message: `[WALLET SUBMISSION BYPASSED]
=============================
BYPASS AUTHORIZED
SKIPPING WALLET VERIFICATION...

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [COMPLETE]
3. VERIFICATION CODE [COMPLETE]
4. WALLET SUBMISSION [BYPASSED]
5. REFERENCE CODE [UNLOCKED]
   >TYPE "reference" TO PROCEED
   >TYPE "skip reference" TO BYPASS

>PROCEED TO NEXT STEP`,
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

      if (currentSession.stage > SessionStage.REFERENCE_CODE) {
        return NextResponse.json({
          message: ERROR_MESSAGES.REFERENCE_PHASE_ALREADY_COMPLETED
        });
      }

      return NextResponse.json({
        message: REFERENCE_MESSAGE
      });
    }

    // Handle generate code command
    if (message.toLowerCase() === 'generate code') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED
        });
      }

      try {
        const db = await initDb();
        
        // Check if user already has a code
        const existingCode = await db.prepare(
          'SELECT code FROM referral_codes WHERE twitter_id = ?'
        ).get(session.user.id) as Pick<ReferralCode, 'code'> | undefined;

        if (existingCode) {
          return NextResponse.json({
            message: SUCCESS_MESSAGES.REFERENCE_CODE_EXISTS(existingCode.code)
          });
        }

        // Generate new code
        const referralCode = await generateReferralCode(
          session.user.id,
          session.user.name || 'unknown'
        );

        return NextResponse.json({
          message: SUCCESS_MESSAGES.REFERENCE_CODE_GENERATED(referralCode),
          commandComplete: true,
          shouldAutoScroll: true
        });
      } catch (error) {
        console.error('Error generating code:', error);
        return NextResponse.json({
          message: ERROR_MESSAGES.GENERATE_CODE_FAILED
        });
      }
    }

    // Handle submit code command
    if (message.toLowerCase().startsWith('submit code ')) {
      const code = message.split(' ')[2];
      if (!code) {
        return NextResponse.json({ 
          message: 'Invalid code format. Please use: submit code <CODE>' 
        });
      }

      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }

      try {
        const db = await initDb();
        
        // Check if code exists and wasn't created by the same user
        const referralCode = await db.prepare(
          'SELECT * FROM referral_codes WHERE code = ? AND twitter_id != ?'
        ).get(
          code,
          session.user.id
        );

        if (!referralCode) {
          return NextResponse.json({
            message: ERROR_MESSAGES.INVALID_REFERENCE_CODE
          });
        }

        // Check if user already used a code
        const existingUse = await db.prepare(
          'SELECT * FROM referral_uses WHERE used_by_twitter_id = ?'
        ).get(
          session.user.id
        );

        if (existingUse) {
          return NextResponse.json({
            message: ERROR_MESSAGES.YOU_HAVE_ALREADY_USED_A_REFERENCE_CODE
          });
        }

        // Record code use
        await db.prepare(
          'INSERT INTO referral_uses (code, used_by_twitter_id) VALUES (?, ?)'
        ).run(
          code,
          session.user.id
        );

        // Update use count
        await db.prepare(
          'UPDATE referral_codes SET used_count = used_count + 1 WHERE code = ?'
        ).run(
          code
        );

        // Update session stage to complete
        await SessionManager.updateSessionStage(session.user.id, SessionStage.PROTOCOL_COMPLETE);
        
        return NextResponse.json({
          message: `[REFERENCE CODE ACCEPTED]
=============================
CODE VERIFICATION COMPLETE
REFERRAL RECORDED

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [COMPLETE]
3. VERIFICATION CODE [COMPLETE]
4. WALLET SUBMISSION [COMPLETE]
5. REFERENCE CODE [COMPLETE]

[ACQUISITION PROTOCOL COMPLETE]
==============================
ALL STEPS VERIFIED
SYSTEM ACCESS GRANTED

>INITIALIZATION COMPLETE
>AWAITING FURTHER INSTRUCTIONS...`,
          commandComplete: true
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
        message: `[REFERENCE CODE BYPASSED]
=============================
BYPASS AUTHORIZED
SKIPPING CODE VERIFICATION...

[ACQUISITION PROTOCOL COMPLETE]
==============================
ALL STEPS VERIFIED
SYSTEM ACCESS GRANTED

>INITIALIZATION COMPLETE
>AWAITING FURTHER INSTRUCTIONS...`,
        commandComplete: true,
        shouldAutoScroll: true
      });
    }

    // Handle join telegram command
    if (message.toLowerCase() === 'join telegram') {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }
      await SessionManager.updateSessionStage(session.user.id, SessionStage.TELEGRAM_REDIRECT);
      return NextResponse.json({
        message: TELEGRAM_MESSAGE,
        commandComplete: true,
        shouldAutoScroll: true
      });
    }

    // Handle verify code command
    if (message.toLowerCase().startsWith('verify ')) {
      if (!session) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_REQUIRED
        });
      }
      await SessionManager.updateSessionStage(session.user.id, SessionStage.TELEGRAM_CODE);
      return NextResponse.json({
        message: VERIFICATION_MESSAGE,
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
      await SessionManager.updateSessionStage(session.user.id, SessionStage.WALLET_SUBMIT);
      return NextResponse.json({
        message: WALLET_MESSAGE,
        commandComplete: true,
        shouldAutoScroll: true
      });
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

    // If no command matches, treat as conversation with GPT
    if (session) {
      const currentSession = await SessionManager.getSession(session.user.id);
      if (!currentSession) {
        return NextResponse.json({
          message: ERROR_MESSAGES.SESSION_NOT_FOUND
        });
      }

      const aiResponse = await generateResponse(
        message,
        currentSession.stage
      );

      return NextResponse.json({
        message: aiResponse,
        shouldAutoScroll: true
      });
    }

    return NextResponse.json({
      message: ERROR_MESSAGES.SESSION_REQUIRED
    });

  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
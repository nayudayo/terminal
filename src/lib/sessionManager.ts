import { getRedisClient } from './redis';
import { SessionStage, UserSession } from '@/types/session';
import { STAGE_PROMPTS } from '@/constants/prompts';
import { generateResponse } from './gptHandler';

export class SessionManager {
  private static readonly KEY_PREFIX = 'session:';
  private static readonly SESSION_EXPIRY = 24 * 60 * 60; // 24 hours
   static async createInitialSession(): Promise<string> {
    const userId = crypto.randomUUID();
    const session: UserSession = {
      userId,
      stage: SessionStage.INTRO_MESSAGE,
      timestamp: Date.now()
    };
    
    try {
      const redis = getRedisClient();
      await redis.set(
        `${this.KEY_PREFIX}${userId}`,
        JSON.stringify(session),
        'EX',
        this.SESSION_EXPIRY
      );
      console.log(`[Session Created] User: ${userId}, Stage: ${SessionStage.INTRO_MESSAGE}`);
      return userId;
    } catch (error) {
      console.error(`[Session Creation Failed] Error: ${error}`);
      throw new Error('Failed to create session');
    }
  }
   static async getSession(userId: string): Promise<UserSession | null> {
    if (!userId) {
      console.error('[Session Retrieval Failed] No userId provided');
      return null;
    }
     try {
      const redis = getRedisClient();
      const data = await redis.get(`${this.KEY_PREFIX}${userId}`);
      
      if (!data) {
        console.log(`[Session Not Found] User: ${userId}`);
        return null;
      }
       const session = JSON.parse(data);
      
      // Add check for stale session
      if (Date.now() - session.timestamp > this.SESSION_EXPIRY * 1000) {
        console.log(`[Stale Session] User: ${userId}, Resetting...`);
        await this.resetSession(userId);
        return null;
      }
       console.log(`[Session Retrieved] User: ${userId}, Stage: ${session.stage}`);
      
      // Refresh session TTL
      await redis.expire(`${this.KEY_PREFIX}${userId}`, this.SESSION_EXPIRY);
      
      return session;
    } catch (error) {
      console.error(`[Session Retrieval Failed] User: ${userId}, Error:`, error);
      return null;
    }
  }
   // Add new resetSession method
  static async resetSession(userId: string): Promise<UserSession | null> {
    try {
      const redis = getRedisClient();
      
      // Delete existing session
      await redis.del(`${this.KEY_PREFIX}${userId}`);
      
      // Create new session at INTRO_MESSAGE stage
      const session: UserSession = {
        userId,
        stage: SessionStage.INTRO_MESSAGE,
        timestamp: Date.now()
      };
       await redis.set(
        `${this.KEY_PREFIX}${userId}`,
        JSON.stringify(session),
        'EX',
        this.SESSION_EXPIRY
      );
       console.log(`[Session Reset] User: ${userId}, New Stage: ${SessionStage.INTRO_MESSAGE}`);
      return session;
    } catch (error) {
      console.error(`[Session Reset Failed] User: ${userId}, Error:`, error);
      return null;
    }
  }

  static async updateSessionStage(
    userId: string, 
    stage: SessionStage, 
    additionalData: Record<string, unknown> = {}
  ): Promise<UserSession> {
    if (!userId || !stage) {
      throw new Error('UserId and stage are required');
    }

    try {
      const redis = getRedisClient();
      const existingSession = await redis.get(`${this.KEY_PREFIX}${userId}`);
      if (!existingSession) {
        console.log(`[Creating New Session] User: ${userId}, Stage: ${stage}`);
      }

      let session = existingSession ? JSON.parse(existingSession) : { userId };

      session = {
        ...session,
        ...additionalData,
        stage,
        timestamp: Date.now()
      };

      await redis.set(
        `${this.KEY_PREFIX}${userId}`,
        JSON.stringify(session),
        'EX',
        this.SESSION_EXPIRY
      );

      console.log(`[Session Stage Updated] User: ${userId}, Stage: ${stage}`);
      
      const updatedSession = await redis.get(`${this.KEY_PREFIX}${userId}`);
      if (!updatedSession) {
        throw new Error('Session update verification failed');
      }

      const parsed = JSON.parse(updatedSession);
      console.log(`[Session Verification] User: ${userId}, Stage: ${parsed.stage}`);

      return session;
    } catch (error) {
      console.error(`[Session Update Failed] User: ${userId}, Error:`, error);
      throw error;
    }
  }

  static async handleStageTransition(
    userId: string,
    currentStage: SessionStage,
    message: string
  ): Promise<{ newStage?: SessionStage; response: string }> {
    console.log(`[Stage Transition Check] User: ${userId} | Current: ${SessionStage[currentStage]} | Message: ${message}`);

    try {
      const stagePrompt = STAGE_PROMPTS[currentStage];
      if (!stagePrompt) {
        console.warn(`[Stage Transition] No prompt found for stage ${currentStage}`);
        return { response: "ERROR: Invalid stage" };
      }

      switch (currentStage) {
        case SessionStage.INTRO_MESSAGE:
          if (message.toLowerCase() === 'push') {
            console.log(`[Stage Transition] INTRO_MESSAGE -> POST_PUSH_MESSAGE`);
            return {
              newStage: SessionStage.POST_PUSH_MESSAGE,
              response: STAGE_PROMPTS[SessionStage.POST_PUSH_MESSAGE].example_responses[0]
            };
          }
          break;

        case SessionStage.POST_PUSH_MESSAGE:
          if (message.toLowerCase() === 'connect x account') {
            console.log(`[Stage Transition] POST_PUSH_MESSAGE -> CONNECT_TWITTER`);
            return {
              newStage: SessionStage.CONNECT_TWITTER,
              response: STAGE_PROMPTS[SessionStage.CONNECT_TWITTER].example_responses[0]
            };
          }
          break;

        case SessionStage.CONNECT_TWITTER:
          break;

        case SessionStage.AUTHENTICATED:
          if (message.toLowerCase() === 'mandates') {
            console.log(`[Stage Transition] AUTHENTICATED -> MANDATES`);
            return {
              newStage: SessionStage.MANDATES,
              response: STAGE_PROMPTS[SessionStage.MANDATES].example_responses[0]
            };
          }
          break;

        case SessionStage.MANDATES:
          if (message.toLowerCase() === 'skip mandates') {
            console.log(`[Stage Transition] MANDATES -> TELEGRAM_REDIRECT`);
            return {
              newStage: SessionStage.TELEGRAM_REDIRECT,
              response: STAGE_PROMPTS[SessionStage.TELEGRAM_REDIRECT].example_responses[0]
            };
          }
          break;

        case SessionStage.TELEGRAM_REDIRECT:
          if (message.toLowerCase() === 'skip telegram' || message.toLowerCase() === 'join telegram') {
            console.log(`[Stage Transition] TELEGRAM_REDIRECT -> TELEGRAM_CODE`);
            return {
              newStage: SessionStage.TELEGRAM_CODE,
              response: STAGE_PROMPTS[SessionStage.TELEGRAM_CODE].example_responses[0]
            };
          }
          break;

        case SessionStage.TELEGRAM_CODE:
          if (message.toLowerCase() === 'skip verify') {
            console.log(`[Stage Transition] TELEGRAM_CODE -> WALLET_SUBMIT`);
            return {
              newStage: SessionStage.WALLET_SUBMIT,
              response: STAGE_PROMPTS[SessionStage.WALLET_SUBMIT].example_responses[0]
            };
          }
          break;

        case SessionStage.WALLET_SUBMIT:
          if (message.toLowerCase() === 'skip wallet') {
            console.log(`[Stage Transition] WALLET_SUBMIT -> REFERENCE_CODE`);
            return {
              newStage: SessionStage.REFERENCE_CODE,
              response: STAGE_PROMPTS[SessionStage.REFERENCE_CODE].example_responses[0]
            };
          }
          break;

        case SessionStage.REFERENCE_CODE:
          if (message.toLowerCase() === 'skip reference') {
            console.log(`[Stage Transition] REFERENCE_CODE -> PROTOCOL_COMPLETE (Skip)`);
            await this.updateSessionStage(userId, SessionStage.PROTOCOL_COMPLETE);
            return {
              newStage: SessionStage.PROTOCOL_COMPLETE,
              response: STAGE_PROMPTS[SessionStage.PROTOCOL_COMPLETE].example_responses[0]
            };
          }
          
          if (message.toLowerCase() === 'generate code') {
            console.log(`[Stage Transition] Handling generate code command`);
            return {
              response: 'Generating reference code...'
            };
          }
          
          if (message.toLowerCase().startsWith('submit code ')) {
            console.log(`[Stage Transition] Handling submit code command`);
            return {
              response: 'Processing reference code submission...'
            };
          }
          break;

        case SessionStage.PROTOCOL_COMPLETE:
          console.log(`[Protocol Complete] Free chat enabled for user: ${userId}`);
          const aiResponse = await generateResponse(message, SessionStage.PROTOCOL_COMPLETE);
          return {
            response: aiResponse
          };

        default:
          console.log(`[Stage Transition] No specific transition for stage ${currentStage}`);
          return {
            response: stagePrompt.example_responses[
              Math.floor(Math.random() * stagePrompt.example_responses.length)
            ]
          };
      }

      console.log(`[Stage Transition] No transition matched, using default response`);
      return {
        response: stagePrompt.example_responses[
          Math.floor(Math.random() * stagePrompt.example_responses.length)
        ]
      };
    } catch (error) {
      console.error(`[Stage Transition Failed] Error:`, error);
      return { response: "ERROR: Stage transition failed" };
    }
  }

  static async createSession(userId: string, stage: SessionStage = SessionStage.INTRO_MESSAGE): Promise<UserSession> {
    if (!userId) {
      throw new Error('UserId is required');
    }

    try {
      const redis = getRedisClient();
      const session: UserSession = {
        userId,
        stage,
        timestamp: Date.now()
      };

      await redis.set(
        `${this.KEY_PREFIX}${userId}`,
        JSON.stringify(session),
        'EX',
        this.SESSION_EXPIRY
      );

      console.log(`[Session Created] User: ${userId}, Stage: ${stage}`);
      return session;
    } catch (error) {
      console.error(`[Session Creation Failed] User: ${userId}, Error:`, error);
      throw new Error('Failed to create session');
    }
  }

  static async handleAuthenticationStage(
    userId: string,
    stage: SessionStage
  ): Promise<void> {
    try {
      await this.updateSessionStage(userId, stage);
      console.log(`[Auth Stage Update] User: ${userId}, New Stage: ${stage}`);
    } catch (error) {
      console.error(`[Auth Stage Update Failed] User: ${userId}, Error:`, error);
      throw error;
    }
  }
} 
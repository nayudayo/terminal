import { getRedisClient } from './redis';
import { SessionStage, UserSession } from '@/types/session';
import { STAGE_PROMPTS } from '@/constants/prompts';
import { checkRedisHealth } from './redis';
import { generateResponse } from './gptHandler';

export class SessionManager {
  private static readonly KEY_PREFIX = 'session:';
  private static readonly SESSION_EXPIRY = 24 * 60 * 60;

  static async createInitialSession(): Promise<string> {
    const userId = crypto.randomUUID();
    const session: UserSession = {
      userId,
      stage: SessionStage.INTRO_MESSAGE,
      timestamp: Date.now()
    };
    
    try {
      const redis = getRedisClient();
      const isHealthy = await checkRedisHealth();
      
      if (isHealthy) {
        await redis.set(
          `${this.KEY_PREFIX}${userId}`,
          JSON.stringify(session),
          'EX',
          this.SESSION_EXPIRY
        );
        console.log(`[Session Created] User: ${userId}, Stage: ${SessionStage.INTRO_MESSAGE}`);
        return userId;
      } else {
        console.error('[Redis Health Check Failed] Falling back to local storage');
        localStorage.setItem(`${this.KEY_PREFIX}${userId}`, JSON.stringify(session));
        return userId;
      }
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
      console.log(`[Session Retrieved] User: ${userId}, Stage: ${session.stage}`);
      
      // Refresh expiry on access
      await redis.expire(`${this.KEY_PREFIX}${userId}`, this.SESSION_EXPIRY);
      
      return session;
    } catch (error) {
      console.error(`[Session Retrieval Failed] User: ${userId}, Error:`, error);
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
      
      // Get existing session
      const existingSession = await redis.get(`${this.KEY_PREFIX}${userId}`);
      if (!existingSession) {
        console.log(`[Creating New Session] User: ${userId}, Stage: ${stage}`);
      }

      let session = existingSession ? JSON.parse(existingSession) : { userId };

      // Update session data
      session = {
        ...session,
        ...additionalData,
        stage,
        timestamp: Date.now()
      };

      // Save to Redis with proper expiration
      await redis.set(
        `${this.KEY_PREFIX}${userId}`,
        JSON.stringify(session),
        'EX',
        this.SESSION_EXPIRY
      );

      console.log(`[Session Stage Updated] User: ${userId}, Stage: ${stage}`);
      
      // Verify the update
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
    console.log(`[Stage Transition] Processing - User: ${userId}, Current Stage: ${currentStage}, Message: ${message}`);
    
    const stagePrompt = STAGE_PROMPTS[currentStage];
    if (!stagePrompt) {
      console.warn(`[Stage Transition] No prompt found for stage ${currentStage}`);
      return { response: "ERROR: Invalid stage" };
    }

    try {
      switch (currentStage) {
        case SessionStage.INTRO_MESSAGE:
          if (message.toLowerCase() === 'push') {
            console.log(`[Stage Transition] INTRO -> POST_PUSH`);
            return {
              newStage: SessionStage.POST_PUSH_MESSAGE,
              response: STAGE_PROMPTS[SessionStage.POST_PUSH_MESSAGE].example_responses[0]
            };
          }
          break;

        case SessionStage.POST_PUSH_MESSAGE:
          if (message.toLowerCase() === 'connect x account') {
            console.log(`[Stage Transition] POST_PUSH -> CONNECT_TWITTER`);
            return {
              newStage: SessionStage.CONNECT_TWITTER,
              response: STAGE_PROMPTS[SessionStage.CONNECT_TWITTER].example_responses[0]
            };
          }
          break;

        case SessionStage.CONNECT_TWITTER:
          // Handled by TwitterConnect component
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
            // Don't transition stage here - let the route handler do it
            // Just return null for newStage to let route handler take over
            return {
              response: 'Generating reference code...'
            };
          }
          
          if (message.toLowerCase().startsWith('submit code ')) {
            console.log(`[Stage Transition] Handling submit code command`);
            // Same here - let route handler manage the code submission
            return {
              response: 'Processing reference code submission...'
            };
          }
          break;

        case SessionStage.PROTOCOL_COMPLETE:
          // For PROTOCOL_COMPLETE stage, use GPT for all responses
          console.log(`[Protocol Complete] Free chat enabled for user: ${userId}`);
          const aiResponse = await generateResponse(message, SessionStage.PROTOCOL_COMPLETE);
          return {
            response: aiResponse
          };

        default:
          // Return default response if no transition
          return {
            response: stagePrompt.example_responses[
              Math.floor(Math.random() * stagePrompt.example_responses.length)
            ]
          };
      }

      // Return default response if no transition matched
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
} 
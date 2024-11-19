import { getRedisClient } from './redis';
import { SessionStage, UserSession } from '@/types/session';
import { STAGE_PROMPTS } from '@/constants/prompts';

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
    try {
      const redis = getRedisClient();
      const data = await redis.get(`${this.KEY_PREFIX}${userId}`);
      
      if (data) {
        const session = JSON.parse(data);
        console.log(`[Session Retrieved] User: ${userId}, Stage: ${session.stage}`);
        return session;
      }
      
      console.log(`[Session Not Found] User: ${userId}`);
      return null;
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
    try {
      const redis = getRedisClient();
      
      // Get existing session
      const existingSession = await redis.get(`${this.KEY_PREFIX}${userId}`);
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
      if (updatedSession) {
        const parsed = JSON.parse(updatedSession);
        console.log(`[Session Verification] User: ${userId}, Stage: ${parsed.stage}`);
      }

      return session;
    } catch (error) {
      console.error(`[Session Update Failed] Error:`, error);
      throw error;
    }
  }

  static async createSession(userId: string, stage: SessionStage = SessionStage.INTRO_MESSAGE): Promise<UserSession | null> {
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
      return null;
    }
  }

  static async handleStageTransition(
    userId: string,
    currentStage: SessionStage,
    message: string
  ): Promise<{ newStage?: SessionStage; response: string }> {
    const stagePrompt = STAGE_PROMPTS[currentStage];
    
    switch (currentStage) {
      case SessionStage.INTRO_MESSAGE:
        if (message.toLowerCase() === 'up_push_button') {
          return {
            newStage: SessionStage.POST_PUSH_MESSAGE,
            response: STAGE_PROMPTS[SessionStage.POST_PUSH_MESSAGE].example_responses[0]
          };
        }
        break;

      case SessionStage.POST_PUSH_MESSAGE:
        return {
          newStage: SessionStage.CONNECT_TWITTER,
          response: STAGE_PROMPTS[SessionStage.CONNECT_TWITTER].example_responses[0]
        };

      case SessionStage.CONNECT_TWITTER:
        // Handle in TwitterConnect component
        break;

      case SessionStage.AUTHENTICATED:
        return {
          newStage: SessionStage.MANDATES,
          response: STAGE_PROMPTS[SessionStage.MANDATES].example_responses[0]
        };
    }

    // Return default response if no transition
    return {
      response: stagePrompt.example_responses[
        Math.floor(Math.random() * stagePrompt.example_responses.length)
      ]
    };
  }
} 
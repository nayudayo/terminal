import Redis from 'ioredis';
import { ChatState } from '@/types/chat';
import { UserSession } from '@/types/session';

let redis: Redis | null = null;

export const getRedisClient = () => {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
      disconnectTimeout: 2000,
    });

    redis.on('error', (err) => {
      console.warn('Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis client connected');
    });
  }
  return redis;
};

// Session-related Redis operations
export const KEY_PREFIX = 'session:';
export const SESSION_EXPIRY = 24 * 60 * 60;

export async function getSession(userId: string): Promise<UserSession | null> {
  try {
    const client = getRedisClient();
    const data = await client.get(`${KEY_PREFIX}${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get session error:', error);
    return null;
  }
}

export async function setSession(userId: string, session: UserSession): Promise<void> {
  try {
    const client = getRedisClient();
    await client.set(
      `${KEY_PREFIX}${userId}`,
      JSON.stringify(session),
      'EX',
      SESSION_EXPIRY
    );
  } catch (error) {
    console.error('Redis set session error:', error);
    throw error;
  }
}

// Chat state operations
export async function getChatState(userId: string): Promise<ChatState | null> {
  try {
    const client = getRedisClient();
    const data = await client.get(`chat:${userId}`);
    if (!data) return null;
    
    const state = JSON.parse(data);
    const now = Date.now();
    
    // Check if cache has expired
    if (now - state.timestamp > 30 * 60 * 1000) { // 30 minutes
      await client.del(`chat:${userId}`);
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Redis get chat state error:', error);
    return null;
  }
}

export async function setChatState(userId: string, state: ChatState): Promise<void> {
  try {
    const client = getRedisClient();
    await client.set(
      `chat:${userId}`,
      JSON.stringify(state),
      'EX',
      30 * 60 // 30 minutes
    );
  } catch (error) {
    console.error('Redis set chat state error:', error);
    throw error;
  }
} 
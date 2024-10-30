import Redis from 'ioredis';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Create a singleton Redis instance
let redis: Redis | null = null;

const getRedisClient = () => {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
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

// Helper to generate a session ID
const getSessionId = async () => {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('session_id')?.value;
  
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2);
    cookieStore.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
  }
  
  return sessionId;
};

// Fallback to cookie storage if Redis fails
const getUserIdFromCookie = async (sessionId: string) => {
  const cookieStore = await cookies();
  return cookieStore.get(`user_id_${sessionId}`)?.value;
};

const setUserIdInCookie = async (sessionId: string, userId: string) => {
  const cookieStore = await cookies();
  cookieStore.set(`user_id_${sessionId}`, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });
};

export async function GET() {
    try {
      const sessionId = await getSessionId(); // Add await here
      let userId = null;
      
      try {
        const client = getRedisClient();
        if (client.status === 'ready') {
          userId = await client.get(`user_id:${sessionId}`);
        }
      } catch (redisError) {
        console.warn('Redis error, falling back to cookies:', redisError);
        userId = await getUserIdFromCookie(sessionId);
      }
      
      return NextResponse.json({ userId });
    } catch (error) {
      console.error('Error getting user ID:', error);
      return NextResponse.json({ error: 'Failed to get user ID' }, { status: 500 });
    }
  }
  
  export async function POST(request: Request) {
    try {
      const { userId } = await request.json();
      const sessionId = await getSessionId(); // Add await here
      
      try {
        const client = getRedisClient();
        if (client.status === 'ready') {
          await client.set(`user_id:${sessionId}`, userId, 'EX', 60 * 60 * 24 * 7);
        }
      } catch (redisError) {
        console.warn('Redis error, falling back to cookies:', redisError);
      }
      
      // Always set in cookies as fallback
      await setUserIdInCookie(sessionId, userId);
      
      return NextResponse.json({ success: true, userId });
    } catch (error) {
      console.error('Error storing user ID:', error);
      return NextResponse.json({ error: 'Failed to store user ID' }, { status: 500 });
    }
  }
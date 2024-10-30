import Redis from 'ioredis';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Create Redis client with proper configuration
const redis = new Redis({
  host: 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
  enableOfflineQueue: false,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.warn('Redis connection error:', err);
});

// Helper to generate a session ID
const getSessionId = async () => {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('session_id')?.value;
  
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2);
    // Set cookie for future requests
    cookieStore.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
  }
  
  return sessionId;
};

export async function GET() {
  try {
    const sessionId = await getSessionId();
    const userId = await redis.get(`user_id:${sessionId}`);
    
    return NextResponse.json({ userId });
  } catch (error) {
    console.error('Error getting user ID:', error);
    return NextResponse.json({ error: 'Failed to get user ID' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    const sessionId = await getSessionId();
    
    // Store userId with 1 week expiration
    await redis.set(`user_id:${sessionId}`, userId, 'EX', 60 * 60 * 24 * 7); // 1 week in seconds
    
    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error('Error storing user ID:', error);
    return NextResponse.json({ error: 'Failed to store user ID' }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { SessionManager } from '@/lib/sessionManager';
import { SessionStage } from '@/types/session';
import { getRedisClient } from '@/lib/redis';

export async function POST() {
  try {
    // Generate a new userId
    const userId = crypto.randomUUID();
    
    // Create session in Redis
    const redis = getRedisClient();
    const session = {
      userId,
      stage: SessionStage.INTRO_MESSAGE,
      timestamp: Date.now()
    };

    await redis.set(
      `session:${userId}`,
      JSON.stringify(session),
      'EX',
      60 * 60 * 24 * 7 // 1 week
    );

    // Create response with session data
    const response = NextResponse.json({ 
      success: true,
      userId,
      session 
    });

    // Set cookie
    response.cookies.set('originalUserId', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;
  } catch (error) {
    console.error('[API] Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// Add GET handler to check session
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const redis = getRedisClient();
    const sessionData = await redis.get(`session:${userId}`);

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: JSON.parse(sessionData)
    });
  } catch (error) {
    console.error('[API] Session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
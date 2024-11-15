import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SessionManager } from '@/lib/sessionManager';

// This is a Route Handler, not middleware
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  try {
    if (!userId) {
      const newUserId = await SessionManager.createInitialSession();
      const response = NextResponse.json({ userId: newUserId });
      
      response.cookies.set('userId', newUserId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60
      });
      
      return response;
    }

    const session = await SessionManager.getSession(userId);
    return NextResponse.json({ userId, session });
  } catch (error) {
    console.error('[API] Session error:', error);
    return NextResponse.json({ error: 'Session error' }, { status: 500 });
  }
} 
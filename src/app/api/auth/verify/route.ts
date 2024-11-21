import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      verified: true,
      user: session.user 
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
} 
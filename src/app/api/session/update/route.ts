import { NextResponse } from 'next/server';
import { SessionManager } from '@/lib/sessionManager';
import { SessionStage } from '@/types/session';

export async function POST(request: Request) {
  try {
    const { userId, stage } = await request.json();

    if (!userId || stage === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const session = await SessionManager.updateSessionStage(userId, stage);

    return NextResponse.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
} 
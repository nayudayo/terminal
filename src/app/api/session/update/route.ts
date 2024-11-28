import { NextResponse } from 'next/server';
import { SessionManager } from '@/lib/sessionManager';
import { SessionStage } from '@/types/session';

export async function POST(request: Request) {
  try {
    const { userId, twitterId, stage } = await request.json();
    
    console.log('[Session Update] Received request:', {
      userId,
      twitterId,
      stage,
      stageEnum: SessionStage[stage]
    });

    // Validate required fields
    if (!userId || stage === undefined) {
      console.error('[Session Update] Missing required fields:', { userId, stage });
      return NextResponse.json(
        { success: false, error: 'UserId and stage are required' },
        { status: 400 }
      );
    }

    // Update for UUID
    console.log('[Session Update] Updating UUID session:', userId);
    await SessionManager.updateSessionStage(userId, stage);
    
    // Also update for Twitter ID if available
    if (twitterId) {
      console.log('[Session Update] Updating Twitter ID session:', twitterId);
      await SessionManager.updateSessionStage(twitterId, stage);
    }

    console.log('[Session Update] Successfully updated session(s)');
    return NextResponse.json({
      success: true,
      session: { stage }
    });
  } catch (error) {
    console.error('[Session Update] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
} 
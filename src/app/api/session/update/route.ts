import { NextResponse } from 'next/server';
import { SessionManager } from '@/lib/sessionManager';
import { SessionStage } from '@/types/session';
import { type NextRequest } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'

export async function POST(request: NextRequest) {
  try {
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!)
    const body = await request.json()
    const { userId, twitterId, stage, tweetId } = body

    if (!userId || stage === undefined) {
      console.error('[Session Update] Missing required fields:', { userId, stage });
      return NextResponse.json(
        { success: false, error: 'UserId and stage are required' },
        { status: 400 }
      );
    }

    console.log('[Session Update] Received request:', {
      userId,
      twitterId,
      stage,
      stageEnum: SessionStage[stage]
    });

    // Update for UUID
    console.log('[Session Update] Updating UUID session:', userId);
    await SessionManager.updateSessionStage(userId, stage);
    
    // Also update for Twitter ID if available
    if (twitterId) {
      console.log('[Session Update] Updating Twitter ID session:', twitterId);
      await SessionManager.updateSessionStage(twitterId, stage);
    }

    if (!tweetId) {
      return NextResponse.json(
        { error: 'Tweet ID is required' },
        { status: 400 }
      )
    }

    try {
      const tweet = await client.v2.tweet(tweetId)
      // Process tweet update logic here
      return NextResponse.json({ success: true, tweet })
    } catch (twitterError: any) {
      if (twitterError.code === 400) {
        return NextResponse.json(
          { error: 'Tweet not found or inaccessible' },
          { status: 404 }
        )
      }
      
      if (twitterError.code === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }

      throw twitterError
    }

  } catch (error) {
    console.error('Twitter API error:', error)
    return NextResponse.json(
      { error: 'Failed to update tweet' },
      { status: 500 }
    )
  }
} 
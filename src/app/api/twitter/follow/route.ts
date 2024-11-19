import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export async function POST(request: Request) {
  try {
    console.log('[Twitter Follow API] Starting follow process');
    
    // Initialize with OAuth 1.0a credentials
    const client = new TwitterApi({
      appKey: process.env.TWITTER_CONSUMER_KEY!,
      appSecret: process.env.TWITTER_CONSUMER_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    });

    console.log('[Twitter Follow API] Client initialized with:', {
      hasAppKey: !!process.env.TWITTER_CONSUMER_KEY,
      hasAppSecret: !!process.env.TWITTER_CONSUMER_SECRET,
      hasAccessToken: !!process.env.TWITTER_ACCESS_TOKEN,
      hasAccessSecret: !!process.env.TWITTER_ACCESS_TOKEN_SECRET
    });

    // Use PTB_TWITTER_ID from environment variables
    const targetUserId = process.env.PTB_TWITTER_ID;
    console.log('[Twitter Follow API] Target User ID:', targetUserId);

    if (!targetUserId) {
      console.error('[Twitter Follow API] PTB_TWITTER_ID not found in environment variables');
      return NextResponse.json(
        { error: 'Configuration error - PTB_TWITTER_ID not set' },
        { status: 500 }
      );
    }

    // Verify that the targetUserId is not the same as the authenticated user's ID
    const me = await client.v2.me();
    if (me.data.id === targetUserId) {
      console.error('[Twitter Follow API] Attempting to follow self:', {
        authenticatedUserId: me.data.id,
        targetUserId
      });
      return NextResponse.json(
        { error: 'Invalid operation: Cannot follow self' },
        { status: 400 }
      );
    }

    try {
      // Execute follow with v2 client
      console.log('[Twitter Follow API] Attempting to follow PTB');
      const result = await client.v2.follow(me.data.id, targetUserId);
      console.log('[Twitter Follow API] Follow result:', result);

      return NextResponse.json({ 
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[Twitter Follow API] Twitter API error:', error);
      return NextResponse.json(
        { error: 'Twitter API error', details: error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Twitter Follow API] General error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

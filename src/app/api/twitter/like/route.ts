import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export async function POST(request: Request) {
  try {
    console.log('[Twitter Like API] Starting like process');
    
    // Initialize with OAuth 1.0a credentials
    const client = new TwitterApi({
      appKey: process.env.TWITTER_CONSUMER_KEY!,
      appSecret: process.env.TWITTER_CONSUMER_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    });

    console.log('[Twitter Like API] Client initialized with:', {
      hasAppKey: !!process.env.TWITTER_CONSUMER_KEY,
      hasAppSecret: !!process.env.TWITTER_CONSUMER_SECRET,
      hasAccessToken: !!process.env.TWITTER_ACCESS_TOKEN,
      hasAccessSecret: !!process.env.TWITTER_ACCESS_TOKEN_SECRET
    });

    // Retrieve the authenticated user's ID
    const { data: user } = await client.v2.me();
    const userId = user.id;
    console.log('[Twitter Like API] Authenticated User ID:', userId);

    // Use the provided tweet URL
    const tweetUrl = 'https://x.com/pushbuttonlol/status/1844756967488897385';
    const tweetIdMatch = tweetUrl.match(/status\/(\d+)/);
    const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;
    console.log('[Twitter Like API] Extracted Tweet ID:', tweetId);

    if (!tweetId) {
      console.error('[Twitter Like API] Invalid or missing Tweet ID in URL');
      return NextResponse.json(
        { error: 'Invalid request - Tweet ID could not be extracted from URL' },
        { status: 400 }
      );
    }

    try {
      // Execute like with v2 client
      console.log('[Twitter Like API] Attempting to like tweet');
      const result = await client.v2.like(userId, tweetId);
      console.log('[Twitter Like API] Like result:', result);

      return NextResponse.json({ 
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[Twitter Like API] Twitter API error:', error);
      return NextResponse.json(
        { error: 'Twitter API error', details: error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Twitter Like API] General error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

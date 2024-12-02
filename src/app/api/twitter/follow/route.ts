import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';

export async function POST(request: Request) {
  try {
    console.log('[Twitter Follow API] Starting follow process');
    
    // Get the user's session
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error('[Twitter Follow API] No access token found in session');
      return NextResponse.json(
        { error: 'Unauthorized - No access token found' },
        { status: 401 }
      );
    }

    // Initialize with user's OAuth 2.0 access token
    const client = new TwitterApi(session.accessToken as string);

    console.log('[Twitter Follow API] Client initialized with user access token');

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

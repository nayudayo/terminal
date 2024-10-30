import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { TwitterApi } from 'twitter-api-v2';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tweetId } = await request.json();
    
    const client = new TwitterApi(session.accessToken);
    await client.v2.like(session.user.id, tweetId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error liking tweet:', error);
    return NextResponse.json(
      { error: 'Failed to like tweet' },
      { status: 500 }
    );
  }
} 
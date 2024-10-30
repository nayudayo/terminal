import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { updateSession } from '@/lib/sessionManager';

export async function POST() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    await updateSession(userId, {
      twitterId: session.user.id,
      accessToken: session.accessToken,
      lastActive: Date.now()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error connecting Twitter account', error);
    return NextResponse.json(
      { error: 'Failed to connect Twitter account' },
      { status: 500 }
    );
  }
} 
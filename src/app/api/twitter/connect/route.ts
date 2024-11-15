import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { SessionManager } from '@/lib/sessionManager';
import { initDb } from '@/lib/db';
import { SessionStage } from '@/types/session';
import { linkOriginalUserId } from '@/lib/db';
import { cookies } from 'next/headers';
import { AUTHENTICATED_MESSAGE } from '@/constants/messages';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const db = await initDb();
    const cookieStore = await cookies();
    const originalUserId = cookieStore.get('originalUserId')?.value;

    if (originalUserId) {
      // Link the original user ID with Twitter ID
      await linkOriginalUserId(userId, originalUserId);

      // Update message tracking to use Twitter ID
      await db.prepare(
        `UPDATE message_tracking 
         SET user_id = ? 
         WHERE user_id = ?`
      ).run(userId, originalUserId);

      // Update Redis to maintain the mapping
      const redis = getRedisClient();
      await redis.set(`twitter_user:${userId}`, originalUserId, 'EX', 60 * 60 * 24 * 7);
      await redis.set(`original_user:${originalUserId}`, userId, 'EX', 60 * 60 * 24 * 7);

      // Ensure message tracking entry exists
      await db.prepare(
        `INSERT OR IGNORE INTO message_tracking (user_id) VALUES (?)`
      ).run(userId);
    }

    // Update the session with Twitter data and stage
    const updatedSession = await SessionManager.updateSessionStage(
      userId, 
      SessionStage.AUTHENTICATED,
      {
        twitterId: session.user.id,
        accessToken: session.accessToken,
      }
    );

    // Verify the session was updated
    console.log('Session updated:', updatedSession);

    // Mark messages as shown
    await db.prepare(
      `UPDATE message_tracking 
       SET connect_x_message_shown = TRUE,
           mandates_message_shown = TRUE 
       WHERE user_id = ?`
    ).run(userId);

    return NextResponse.json({ 
      success: true,
      message: AUTHENTICATED_MESSAGE.replace(
        'ACCESS: GRANTED', 
        `ACCESS: GRANTED\nUSER: ${session.user.name}`
      ),
      session: updatedSession
    });
  } catch (error) {
    console.error('Error connecting Twitter account:', error);
    return NextResponse.json(
      { error: 'Failed to connect Twitter account' },
      { status: 500 }
    );
  }
}
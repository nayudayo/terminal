import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    // Initialize Redis
    const redis = getRedisClient();
    await redis.set(`user_id:${userId}`, userId, 'EX', 60 * 60 * 24 * 30);

    // Initialize SQLite
    const db = await initDb();
    
    // Initialize message_tracking
    await db.prepare(
      `INSERT OR IGNORE INTO message_tracking (user_id) VALUES (?)`
    ).run(userId);

    // Initialize user_sessions
    await db.prepare(
      `INSERT OR IGNORE INTO user_sessions (user_id) VALUES (?)`
    ).run(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error initializing user:', error);
    return NextResponse.json(
      { error: 'Failed to initialize user' },
      { status: 500 }
    );
  }
} 
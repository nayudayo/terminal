import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import Database from 'better-sqlite3';

async function tryMarkAsShown(
  db: Database.Database,
  userId: string,
  messageType: string
) {
  try {
    // First ensure the user exists in message_tracking
    const stmt1 = db.prepare(
      `INSERT OR IGNORE INTO message_tracking (user_id) VALUES (?)`
    );
    stmt1.run(userId);

    // Then update the specific message flag
    const column = `${messageType}_shown`;
    const stmt2 = db.prepare(
      `UPDATE message_tracking SET ${column} = TRUE WHERE user_id = ?`
    );
    stmt2.run(userId);

    // Verify the update
    const result = db.prepare(
      `SELECT ${column} FROM message_tracking WHERE user_id = ?`
    ).get(userId);

    console.log(`Message tracking updated for ${userId}, ${messageType}:`, result);

    return true;
  } catch (error) {
    console.error('Error in tryMarkAsShown:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { userId, messageType } = await request.json();

    if (!userId || !messageType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await initDb();
    
    // First ensure the user exists in message_tracking
    const stmt1 = db.prepare(
      `INSERT OR IGNORE INTO message_tracking (user_id) VALUES (?)`
    );
    stmt1.run(userId);

    // Then update the specific message flag
    const column = `${messageType}_shown`;
    const stmt2 = db.prepare(
      `UPDATE message_tracking SET ${column} = TRUE WHERE user_id = ?`
    );
    stmt2.run(userId);

    // Log the update for debugging
    const result = db.prepare(
      `SELECT * FROM message_tracking WHERE user_id = ?`
    ).get(userId);
    
    console.log('Message tracking updated:', {
      userId,
      messageType,
      result
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking message as shown:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as shown' },
      { status: 500 }
    );
  }
}
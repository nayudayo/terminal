import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export async function initDb() {
  if (!db) {
    try {
      // Create the data directory if it doesn't exist
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const dbPath = path.join(dataDir, 'database.sqlite');
      db = new Database(dbPath, { verbose: console.log });
      
      // Initialize tables
      db.exec(`
        CREATE TABLE IF NOT EXISTS message_tracking (
          user_id TEXT PRIMARY KEY,
          intro_message_shown BOOLEAN DEFAULT FALSE,
          post_push_message_shown BOOLEAN DEFAULT FALSE,
          connect_x_message_shown BOOLEAN DEFAULT FALSE,
          mandates_message_shown BOOLEAN DEFAULT FALSE
        );

        CREATE TABLE IF NOT EXISTS user_sessions (
          user_id TEXT PRIMARY KEY,
          stage INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS referral_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          twitter_id TEXT UNIQUE NOT NULL,
          twitter_name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          used_count INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS user_mappings (
          original_user_id TEXT PRIMARY KEY,
          twitter_id TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }
  return db;
}

export async function closeDb() {
  if (db) {
    await db.close();
    db = null;
  }
}

export async function markMessageAsShown(userId: string, messageType: string) {
  const db = await initDb();
  const column = `${messageType}_shown`;
  
  await db.prepare(
    `INSERT OR IGNORE INTO message_tracking (user_id) VALUES (?)`
  ).run(
    userId
  );

  await db.prepare(
    `UPDATE message_tracking SET ${column} = TRUE WHERE user_id = ?`
  ).run(
    userId
  );
}

export async function linkOriginalUserId(twitterId: string, originalUserId: string) {
  const db = await initDb();
  await db.prepare(
    `INSERT OR REPLACE INTO user_sessions (user_id, original_user_id) VALUES (?, ?)`
  ).run(
    [twitterId, originalUserId]
  );
}

export function generateReferralCode(twitterId: string, twitterName: string): string {
  // Generate a unique code based on Twitter ID and name
  const prefix = twitterName.slice(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const suffix = twitterId.slice(-3);
  
  return `${prefix}-${randomPart}-${suffix}`;
}

export async function createUserMapping(originalUserId: string) {
  const db = await initDb();
  await db.prepare(
    `INSERT OR IGNORE INTO user_mappings (original_user_id) VALUES (?)`
  ).run(originalUserId);
}

// Make sure the database is closed when the process exits
process.on('exit', () => {
  closeDb();
}); 
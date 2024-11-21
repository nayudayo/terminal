import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { rateLimit } from '@/lib/rateLimit';

let db: Database.Database | null = null;

export async function initDb() {
  if (!db) {
    try {
      // Create the data directory if it doesn't exist
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const dbPath = path.join(dataDir, 'referral-codes.db');
      db = new Database(dbPath, { verbose: console.log });
      
      // Initialize tables
      db.exec(`
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

export async function linkOriginalUserId(twitterId: string, originalUserId: string) {
  const db = await initDb();
  await db.prepare(
    `INSERT OR REPLACE INTO user_sessions (user_id, original_user_id) VALUES (?, ?)`
  ).run(
    [twitterId, originalUserId]
  );
}

// Add helper for code generation
function generateUniqueCode(twitterName: string): string {
  const prefix = twitterName.slice(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestamp = Date.now().toString(36).slice(-3).toUpperCase();
  
  return `${prefix}-${randomPart}-${timestamp}`;
}

// Add validation function
async function isCodeUnique(db: Database.Database, code: string): Promise<boolean> {
  const existing = await db.prepare(
    'SELECT code FROM referral_codes WHERE code = ?'
  ).get(code);
  
  return !existing;
}

export async function generateReferralCode(
  twitterId: string, 
  twitterName: string
): Promise<string> {
  const db = await initDb();
  
  // Check rate limit (5 attempts per hour)
  const rateLimitKey = `generate_code:${twitterId}`;
  const isRateLimited = await rateLimit(rateLimitKey, 5, 3600);
  
  if (isRateLimited) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Try up to 3 times to generate a unique code
  let attempts = 0;
  let code: string;
  
  do {
    code = generateUniqueCode(twitterName);
    const unique = await isCodeUnique(db, code);
    
    if (unique) {
      // Insert the code
      await db.prepare(
        `INSERT INTO referral_codes (
          code, 
          twitter_id, 
          twitter_name, 
          used_count, 
          created_at
        ) VALUES (?, ?, ?, 0, datetime('now'))`
      ).run(
        code,
        twitterId,
        twitterName
      );
      
      return code;
    }
    
    attempts++;
  } while (attempts < 3);

  throw new Error('Failed to generate unique code. Please try again.');
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

export async function getReferralCode(twitterId: string): Promise<string | null> {
  const db = await initDb();
  try {
    const result = await db.prepare(
      'SELECT code FROM referral_codes WHERE twitter_id = ?'
    ).get(twitterId) as { code: string } | undefined;

    return result?.code || null;
  } catch (error) {
    console.error('Error retrieving referral code:', error);
    return null;
  }
} 
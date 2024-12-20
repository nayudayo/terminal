import { Database } from 'better-sqlite3';
import { Migration } from './types';

const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: async (db: Database) => {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          user_id TEXT PRIMARY KEY,
          stage INTEGER NOT NULL,
          twitter_id TEXT,
          original_user_id TEXT,
          access_token TEXT,
          last_active INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ); 

        CREATE INDEX idx_original_user_id 
        ON user_sessions(original_user_id);

        CREATE TABLE IF NOT EXISTS referral_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          twitter_id TEXT UNIQUE NOT NULL,
          twitter_name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          used_count INTEGER DEFAULT 0
        );
        
        CREATE TABLE IF NOT EXISTS referral_uses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT NOT NULL,
          used_by_twitter_id TEXT NOT NULL,
          used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (code) REFERENCES referral_codes(code),
          UNIQUE(code, used_by_twitter_id)
        );

        CREATE INDEX IF NOT EXISTS idx_referral_codes_twitter_id 
        ON referral_codes(twitter_id);
      `);
    },
    down: async (db: Database) => {
      await db.exec(`
        DROP TABLE IF EXISTS referral_uses;
        DROP TABLE IF EXISTS referral_codes;
      `);
    }
  },
  {
    version: 2,
    name: 'add_wallet_submissions',
    up: async (db: Database) => {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS wallet_submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          twitter_id TEXT UNIQUE NOT NULL,
          solana_address TEXT NOT NULL,
          near_address TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (twitter_id) REFERENCES user_sessions(twitter_id)
        );

        CREATE INDEX idx_wallet_submissions_twitter_id 
        ON wallet_submissions(twitter_id);
      `);
    },
    down: async (db: Database) => {
      await db.exec(`
        DROP TABLE IF EXISTS wallet_submissions;
      `);
    }
  }
];

export async function runMigrations(db: Database) {
  // Create migrations table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Get current version
  const result = await db.prepare(
    'SELECT MAX(version) as version FROM schema_migrations'
  ).get() as { version: number | null};
  const currentVersion = result?.version || 0;

  // Run pending migrations
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`Running migration ${migration.version}: ${migration.name}`);
      await migration.up(db);
      await db.prepare(
        'INSERT INTO schema_migrations (version, name) VALUES (?, ?)'
      ).run(
        migration.version,
        migration.name
      );
    }
  }
} 
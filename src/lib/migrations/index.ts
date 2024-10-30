import { Database } from 'sqlite';
import { Migration } from './types';

const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: async (db: Database) => {
      await db.exec(`
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

        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
    down: async (db: Database) => {
      await db.exec(`
        DROP TABLE IF EXISTS referral_uses;
        DROP TABLE IF EXISTS referral_codes;
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
  const result = await db.get<{ version: number }>(
    'SELECT MAX(version) as version FROM schema_migrations'
  );
  const currentVersion = result?.version || 0;

  // Run pending migrations
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`Running migration ${migration.version}: ${migration.name}`);
      await migration.up(db);
      await db.run(
        'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
        [migration.version, migration.name]
      );
    }
  }
} 
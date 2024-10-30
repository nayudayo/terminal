import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { runMigrations } from './migrations';

// Initialize database
async function openDb() {
  return open({
    filename: './referral.db',
    driver: sqlite3.Database
  });
}

// Initialize database with migrations
async function initDb() {
  const db = await openDb();
  await runMigrations(db);
  return db;
}

// Generate unique referral code
function generateReferralCode(twitterId: string, twitterName: string): string {
  const prefix = twitterName.slice(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36).slice(-4);
  const random = Math.random().toString(36).slice(-3).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

export { openDb, initDb, generateReferralCode }; 
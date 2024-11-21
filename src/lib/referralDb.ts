import Database from 'better-sqlite3';
import path from 'path';

export async function initReferralDb() {
  const dbPath = path.join(process.cwd(), 'path', 'to', 'your', 'referral-codes.db');
  return new Database(dbPath);
}

export async function getReferralCode(twitterId: string): Promise<string | null> {
  const db = await initReferralDb();
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
import { initDb } from './db';
import { rateLimit } from './rateLimit';
import crypto from 'crypto';

interface ReferralCode {
  id: number;
  twitter_id: string;
  twitter_name: string;
  code: string;
  created_at: string;
  used_count: number;
}

/**
 * Generates a unique referral code with format: XXX-YYYYYY-ZZZ
 * XXX: Sanitized Twitter name prefix
 * YYYYYY: Cryptographically secure random string
 * ZZZ: Obfuscated timestamp
 */
function generateUniqueCode(twitterName: string): string {
  // Sanitize prefix: remove non-alphanumeric chars and ensure 3 chars
  const prefix = twitterName
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .padEnd(3, 'X')
    .slice(0, 3);
    
  // Generate 6 random chars using crypto
  const randomPart = crypto
    .randomBytes(4)
    .toString('hex')
    .toUpperCase()
    .slice(0, 6);
    
  // Use timestamp but make it less predictable
  const timestamp = Buffer.from(Date.now().toString())
    .toString('base64')
    .replace(/[^A-Z0-9]/gi, '')
    .slice(-3)
    .toUpperCase();

  return `${prefix}-${randomPart}-${timestamp}`;
}

/**
 * Validates if a code is unique in the database
 */
async function isCodeUnique(code: string): Promise<boolean> {
  const db = await initDb();
  const existing = await db.prepare(
    'SELECT code FROM referral_codes WHERE code = ?'
  ).get(code);
  
  return !existing;
}

/**
 * Generates a new referral code for a user
 */
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
    const unique = await isCodeUnique(code);
    
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

/**
 * Retrieves an existing referral code for a user
 */
export async function getReferralCode(twitterId: string): Promise<string | null> {
  const db = await initDb();
  try {
    const result = await db.prepare(
      'SELECT code FROM referral_codes WHERE twitter_id = ?'
    ).get(twitterId) as Pick<ReferralCode, 'code'> | undefined;

    return result?.code || null;
  } catch (error) {
    console.error('Error retrieving referral code:', error);
    return null;
  }
}

/**
 * Records the use of a referral code
 */
export async function recordReferralUse(code: string, usedByTwitterId: string): Promise<boolean> {
  const db = await initDb();
  
  try {
    await db.prepare(
      'INSERT INTO referral_uses (code, used_by_twitter_id) VALUES (?, ?)'
    ).run(code, usedByTwitterId);

    await db.prepare(
      'UPDATE referral_codes SET used_count = used_count + 1 WHERE code = ?'
    ).run(code);

    return true;
  } catch (error) {
    console.error('Error recording referral use:', error);
    return false;
  }
}

/**
 * Validates a referral code
 */
export async function validateReferralCode(code: string, usedByTwitterId: string): Promise<boolean> {
  const db = await initDb();
  
  try {
    // Check if code exists and wasn't created by the same user
    const referralCode = await db.prepare(
      'SELECT * FROM referral_codes WHERE code = ? AND twitter_id != ?'
    ).get(code, usedByTwitterId);

    if (!referralCode) return false;

    // Check if user already used a code
    const existingUse = await db.prepare(
      'SELECT * FROM referral_uses WHERE used_by_twitter_id = ?'
    ).get(usedByTwitterId);

    return !existingUse;
  } catch (error) {
    console.error('Error validating referral code:', error);
    return false;
  }
} 
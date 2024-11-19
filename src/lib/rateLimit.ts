import { getRedisClient } from './redis';

export async function rateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  const redis = getRedisClient();
  
  // Get current attempts
  const attempts = await redis.incr(key);
  
  // Set expiry on first attempt
  if (attempts === 1) {
    await redis.expire(key, windowSeconds);
  }
  
  return attempts > maxAttempts;
} 
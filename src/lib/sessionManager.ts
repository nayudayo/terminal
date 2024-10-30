import Redis from 'ioredis';

interface SessionData {
  userId: string;
  twitterId?: string;
  accessToken?: string;
  lastActive: number;
}

export const redis = new Redis({
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT!),
});

export async function createSession(userId: string, sessionData: SessionData) {
  const key = `session:${userId}`;
  await redis.set(key, JSON.stringify(sessionData), 'EX', 24 * 60 * 60);
}

export async function getSession(userId: string): Promise<SessionData | null> {
  const key = `session:${userId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function updateSession(userId: string, updates: Partial<SessionData>) {
  const session = await getSession(userId);
  if (!session) return null;
  
  const updatedSession = { ...session, ...updates };
  await createSession(userId, updatedSession);
  return updatedSession;
} 
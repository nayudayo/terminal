import { Redis } from 'ioredis';
import { ChatState } from '@/types/chat';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const CACHE_DURATION = 30 * 60; // 30 minutes in seconds

export async function getChatState(userId: string): Promise<ChatState | null> {
  try {
    const data = await redis.get(`chat:${userId}`);
    if (!data) return null;
    
    const state = JSON.parse(data);
    const now = Date.now();
    
    // Check if cache has expired
    if (now - state.timestamp > CACHE_DURATION * 1000) {
      await redis.del(`chat:${userId}`);
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setChatState(userId: string, state: ChatState): Promise<void> {
  try {
    await redis.set(
      `chat:${userId}`,
      JSON.stringify(state),
      'EX',
      CACHE_DURATION
    );
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function clearChatState(userId: string): Promise<void> {
  try {
    await redis.del(`chat:${userId}`);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
} 
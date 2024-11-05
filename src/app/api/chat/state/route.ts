import { NextResponse } from 'next/server';
import { getChatState, setChatState } from '@/lib/redis';
import { ChatState } from '@/types/chat';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const state = await getChatState(userId);
    return NextResponse.json({ state });
  } catch (error) {
    console.error('Error getting chat state:', error);
    return NextResponse.json({ error: 'Failed to get chat state' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId, state } = await request.json() as { userId: string; state: ChatState };

  if (!userId || !state) {
    return NextResponse.json({ error: 'User ID and state are required' }, { status: 400 });
  }

  try {
    await setChatState(userId, state);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting chat state:', error);
    return NextResponse.json({ error: 'Failed to set chat state' }, { status: 500 });
  }
} 
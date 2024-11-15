import { initDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await initDb();
    const status = await db.prepare(
      'SELECT * FROM message_tracking WHERE user_id = ?'
    ).all();

    return NextResponse.json({ status: status || {} });
  } catch (error) {
    console.error('Error getting message status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
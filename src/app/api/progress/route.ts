import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserProgress } from '@/lib/progress';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const progress = await getUserProgress(session.userId, session.email ?? '');
    return NextResponse.json({ [session.userId]: progress });
  } catch {
    return NextResponse.json({ error: 'Failed to read progress' }, { status: 500 });
  }
}

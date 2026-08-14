import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createBlankProgress } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Initialize progress for a new Supabase user
    if (action === 'init-progress') {
      const { userId, email } = body;
      if (!userId || !email) {
        return NextResponse.json({ error: 'userId and email required' }, { status: 400 });
      }

      const progressPath = path.join(process.cwd(), 'src', 'db', 'progress.json');
      let progressDb: any = {};
      if (fs.existsSync(progressPath)) {
        progressDb = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
      }

      // Only create if doesn't exist yet
      if (!progressDb[userId]) {
        progressDb[userId] = createBlankProgress(email);
        fs.writeFileSync(progressPath, JSON.stringify(progressDb, null, 2));
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

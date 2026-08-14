import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const dbPath = path.join(process.cwd(), 'src', 'db', 'progress.json');
  
  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ error: 'Progress not found' }, { status: 404 });
  }

  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    const progress = JSON.parse(data);
    return NextResponse.json(progress);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read progress' }, { status: 500 });
  }
}

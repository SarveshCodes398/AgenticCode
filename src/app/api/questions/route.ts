import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const dbPath = path.join(process.cwd(), 'src', 'db', 'questions.json');
  
  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ error: 'Database not found' }, { status: 404 });
  }

  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    const questions = JSON.parse(data);
    
    // For the list view, we don't need to send all testcases and hints, just the metadata
    const list = questions.map((q: any) => ({
      id: q.id,
      title: q.title,
      difficulty: q.difficulty,
    }));
    
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read database' }, { status: 500 });
  }
}

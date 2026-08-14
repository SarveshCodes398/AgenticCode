import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const dbPath = path.join(process.cwd(), 'src', 'db', 'questions.json');
  
  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ error: 'Database not found' }, { status: 404 });
  }

  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    const questions = JSON.parse(data);
    
    const question = questions.find((q: any) => q.id === id);
    if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    return NextResponse.json(question);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read database' }, { status: 500 });
  }
}

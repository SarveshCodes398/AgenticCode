import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ChatMistralAI } from '@langchain/mistralai';
import { cookies } from 'next/headers';
import { getServerSupabase } from '@/lib/supabaseClient';


const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// We initialize the model lazily inside the route handler to prevent
// build-time crashes if the environment variable isn't present during 'npm run build'.
function getModel() {
  if (!MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY is not configured.");
  }
  return new ChatMistralAI({
    apiKey: MISTRAL_API_KEY,
    modelName: "mistral-large-latest",
    temperature: 0.1
  });
}

export async function POST(request: Request) {
  try {
    const { questionId, code, timeTaken } = await request.json();
    
    // Auth Check
    const cookieStore = await cookies();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database connection is not configured.' }, { status: 500 });
    }

    const supabase = getServerSupabase(cookieStore as any);
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection is not configured.' }, { status: 500 });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;
    
    // Load question test cases
    const dbPath = path.join(process.cwd(), 'src', 'db', 'questions.json');
    const questions = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const question = questions.find((q: any) => q.id === questionId);
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const testCases = question.testCases || [];
    
    // Call Groq LLM Evaluator
    const prompt = `
You are an expert, strict Agentic Code Grader. 
A student has submitted the following Python code for the problem: "${question.title}"
Problem Description: ${question.description}

Evaluate the student's code against the following testcase criteria. For each criteria, determine if the code satisfies it based on structural logic, import presence, agent configuration, and correctness.
Testcases:
${testCases.map((tc: string, i: number) => `TC${i+1}: ${tc}`).join('\n')}

Student Code:
\`\`\`python
${code}
\`\`\`

Return a JSON array of objects. Each object MUST have:
- "name": String (the text of the testcase)
- "passed": Boolean (true if satisfied, false otherwise)
- "reason": String (brief explanation if false, empty if true)

Return ONLY the raw JSON array. No markdown, no explanations outside the JSON.
`;

    let evaluation = [];
    if (testCases.length === 0) {
      evaluation = [{ name: "Default Logic Check", passed: true, reason: "" }];
    } else {
      const response = await getModel().invoke(prompt);
      let content = String(response.content);
      
      // Clean JSON
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      evaluation = JSON.parse(content);
    }
    
    const total = evaluation.length;
    const score = evaluation.filter((e: any) => e.passed).length;
    const passed = score === total;

    // Update Progress if passed
    if (passed) {
       const progressPath = path.join(process.cwd(), 'src', 'db', 'progress.json');
       if (fs.existsSync(progressPath)) {
          const progressDb = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
          const userProgress = progressDb[userId];
          
          if (userProgress) {
            const alreadySolved = userProgress.recentSubmissions.some((s: any) => s.id === questionId);
            if (!alreadySolved) {
                userProgress.recentSubmissions.unshift({
                   id: questionId,
                   title: question.title,
                   time: "Just now",
                   timeTaken: timeTaken || ""
                });
                if (userProgress.solved[question.difficulty] !== undefined) {
                   userProgress.solved[question.difficulty]++;
                }
                
                // Active days logic
                const todayKey = new Date().toISOString().split('T')[0];
                if (!userProgress.contributionGrid[todayKey]) {
                   userProgress.activeDays++;
                   userProgress.maxStreak = Math.max(userProgress.maxStreak, 1);
                   
                   // Very simple badge logic check (Mocking weekly for demo purposes)
                   if (userProgress.activeDays === 7 && !userProgress.badges.includes("7-Day Warrior")) {
                      userProgress.badges.push("7-Day Warrior");
                   }
                }
                
                userProgress.contributionGrid[todayKey] = (userProgress.contributionGrid[todayKey] || 0) + 1;
                progressDb[userId] = userProgress;
                fs.writeFileSync(progressPath, JSON.stringify(progressDb, null, 2));
            }
          }
       }
    }

    return NextResponse.json({
      passed,
      score,
      total,
      details: evaluation
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to evaluate code. ' + error.message }, { status: 500 });
  }
}

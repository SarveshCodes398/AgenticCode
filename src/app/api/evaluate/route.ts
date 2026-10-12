import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ChatGroq } from '@langchain/groq';
import { getSession } from '@/lib/session';
import { recordSolvedSubmission } from '@/lib/progress';


const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";

// We initialize the model lazily inside the route handler to prevent
// build-time crashes if the environment variable isn't present during 'npm run build'.
function getModel() {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }
  return new ChatGroq({
    apiKey: GROQ_API_KEY,
    model: GROQ_MODEL,
    temperature: 0.1
  });
}

function isRateLimitError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const status = typeof error === "object" && error !== null && "status" in error
    ? (error as { status?: number }).status
    : undefined;

  return status === 429 || message.includes("429") || message.toLowerCase().includes("rate limit");
}

async function invokeModel(prompt: string) {
  const model = getModel();

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await model.invoke(prompt);
    } catch (error) {
      if (!isRateLimitError(error) || attempt === 1) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  throw new Error("The evaluator could not be reached.");
}

export async function POST(request: Request) {
  try {
    const { questionId, code, timeTaken } = await request.json();
    
    // Auth Check
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.userId;
    
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
      const response = await invokeModel(prompt);
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
      await recordSolvedSubmission(userId, question, timeTaken || '');
    }

    return NextResponse.json({
      passed,
      score,
      total,
      details: evaluation
    });

  } catch (error: unknown) {
    console.error(error);
    if (isRateLimitError(error)) {
      return NextResponse.json(
        { error: 'The evaluator is rate-limited. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown evaluation error';
    return NextResponse.json({ error: 'Failed to evaluate code. ' + message }, { status: 500 });
  }
}

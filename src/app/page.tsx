import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import fs from 'fs';
import path from 'path';
import { getSession } from "@/lib/session";
import ConceptQuestions from "@/components/ConceptQuestions";

type Question = {
  id: string;
  title: string;
  difficulty: string;
};

function getAcceptanceRate(id: string) {
  const hash = Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0);
  return (40 + (hash % 400) / 10).toFixed(1);
}

// Fetch questions server-side for instant load
async function getQuestions() {
  const dbPath = path.join(process.cwd(), 'src', 'db', 'questions.json');
  if (!fs.existsSync(dbPath)) return [];
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data) as Question[];
}

// Fetch user progress server-side
async function getProgress(userId: string) {
  const dbPath = path.join(process.cwd(), 'src', 'db', 'progress.json');
  if (!fs.existsSync(dbPath)) return null;
  const data = fs.readFileSync(dbPath, 'utf-8');
  const progressDb = JSON.parse(data);
  return progressDb[userId];
}

export default async function Home() {
  const session = await getSession();
  const questions = await getQuestions();
  let solvedIds: string[] = [];
  
  if (session) {
    const progress = await getProgress(session.userId);
    if (progress) {
      solvedIds = progress.recentSubmissions.map((s: any) => s.id);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          
          {/* Topics Filter */}
          <div className="mb-6 flex flex-wrap gap-2">
            {['LangGraph', 'RAG Pipeline', 'Tool Calling', 'Memory', 'ReAct Agent', 'Multi-Agent'].map((topic) => (
              <button key={topic} className="rounded-full bg-card px-4 py-1.5 text-sm font-medium text-gray-300 hover:bg-card-hover border border-border transition-colors">
                {topic}
              </button>
            ))}
          </div>

          {/* Questions Table */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-card-hover/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Acceptance</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No questions available.</td>
                  </tr>
                ) : questions.map((q, idx) => (
                  <tr key={q.id} className="transition-colors hover:bg-card-hover">
                    <td className="whitespace-nowrap px-6 py-4">
                      {solvedIds.includes(q.id) ? <CheckCircle2 className="h-5 w-5 text-success" /> : null}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link href={`/problems/${q.id}`} className="text-gray-200 hover:text-neon-blue transition-colors">
                        {idx + 1}. {q.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                      {getAcceptanceRate(q.id)}%
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`
                        ${q.difficulty === 'Easy' ? 'text-success' : ''}
                        ${q.difficulty === 'Medium' ? 'text-warning' : ''}
                        ${q.difficulty === 'Hard' ? 'text-error' : ''}
                      `}>
                        {q.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <ConceptQuestions />
          
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="mb-4 text-sm font-semibold text-gray-300 flex items-center justify-between">
              <span>Agentic Challenge</span>
            </h4>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }).map((_, i) => (
                <div key={i} className={`aspect-square rounded-sm flex items-center justify-center text-xs bg-border/50 text-gray-600`}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

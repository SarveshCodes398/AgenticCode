"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import { Play, Clock, CheckCircle2, ChevronRight, ChevronDown, Lightbulb, TerminalSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Workspace() {
  const { id } = useParams();
  const [question, setQuestion] = useState<any>(null);
  const [code, setCode] = useState<string>("");
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  useEffect(() => {
    fetch(`/api/questions/${id}`)
      .then(res => res.json())
      .then(data => {
        setQuestion(data);
        // Default python code template
        setCode(`# Agentic Solution for: ${data.title}
from langchain_groq import ChatGroq
import os

# 1. Initialize your model with your API Key
# Replace '<YOUR_GROQ_API_KEY>' with your actual key
model = ChatGroq(
    model="llama3-8b-8192",
    temperature=0,
    api_key="<YOUR_GROQ_API_KEY>"
)

def solve():
    # Write your agentic logic here using LangGraph/LangChain
    # Example: 
    # response = model.invoke("Explain RAG pipeline simply")
    # return response.content
    pass

if __name__ == "__main__":
    print(solve())
`);
      })
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    setIsTimerRunning(false); // Stop timer when submitting
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: id, code, timeTaken: formatTime(timer) })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: "Failed to evaluate code." });
    } finally {
      setSubmitting(false);
    }
  };

  if (!question) return <div className="p-8 text-center text-gray-400">Loading workspace...</div>;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-black text-gray-300">
      
      {/* Left Pane - Problem Description */}
      <div className="w-1/2 flex flex-col border-r border-border bg-card">
        {/* Header Tabs */}
        <div className="flex bg-card-hover/50 border-b border-border">
          <button className="flex items-center gap-2 border-b-2 border-neon-blue px-4 py-2 text-sm font-semibold text-white">
            <TerminalSquare className="h-4 w-4 text-neon-blue" /> Description
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <h1 className="text-2xl font-bold text-white mb-2">{question.title}</h1>
          <div className="flex items-center gap-4 mb-6">
            <span className={`text-sm font-medium ${question.difficulty === 'Easy' ? 'text-success' : question.difficulty === 'Medium' ? 'text-warning' : 'text-error'}`}>
              {question.difficulty}
            </span>
          </div>
          
          <div className="prose prose-invert max-w-none text-gray-300 mb-8">
            <p>{question.description}</p>
          </div>

          {/* Hint Section */}
          <div className="mb-6">
            <button 
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-neon-blue transition-colors"
            >
              <Lightbulb className={`h-4 w-4 ${showHint ? 'text-neon-blue' : ''}`} /> 
              {showHint ? 'Hide Hints' : 'Show Hints'}
              {showHint ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <AnimatePresence>
              {showHint && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <ul className="mt-4 space-y-2 rounded-md border border-border/50 bg-card-hover p-4 text-sm">
                    {question.hints?.map((h: string, i: number) => (
                      <li key={i} className="flex gap-2"><span className="font-bold text-neon-blue">{i+1}.</span> {h}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Testcases requirements preview */}
          <div>
             <h3 className="text-sm font-semibold text-white mb-2 border-b border-border pb-2">Evaluation Criteria</h3>
             <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 pl-2">
                {question.testCases?.slice(0, 5).map((tc: string, i: number) => (
                  <li key={i}>{tc}</li>
                ))}
                {question.testCases?.length > 5 && (
                  <li className="text-neon-blue list-none ml-4 mt-2 text-xs cursor-pointer">+ {question.testCases.length - 5} more hidden testcases checked on submit.</li>
                )}
             </ul>
          </div>
        </div>
      </div>

      {/* Right Pane - Code Editor */}
      <div className="w-1/2 flex flex-col bg-card">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between border-b border-border bg-card-hover/50 px-4 py-2">
          <div className="flex items-center gap-2">
             <span className="text-xs font-semibold text-gray-400">Python 3 (Agentic)</span>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Timer */}
             <button 
               onClick={toggleTimer}
               className={`flex items-center gap-2 rounded px-3 py-1 text-sm font-medium transition-colors ${isTimerRunning ? 'bg-neon-blue/20 text-neon-blue' : 'bg-border/50 text-gray-300 hover:bg-border'}`}
             >
               <Clock className="h-4 w-4" />
               <span className="w-12 text-center font-mono">{formatTime(timer)}</span>
             </button>
             
             {/* Submit Button */}
             <button 
               onClick={handleSubmit}
               disabled={submitting}
               className="flex items-center gap-2 rounded bg-success/20 border border-success/30 px-4 py-1 text-sm font-bold text-success transition-colors hover:bg-success hover:text-black disabled:opacity-50"
             >
               {submitting ? <Clock className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
               Submit
             </button>
          </div>
        </div>
        
        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden pt-2">
          <Editor
            height="100%"
            language="python"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'Consolas, monospace',
              scrollBeyondLastLine: false,
              padding: { top: 16 }
            }}
          />
        </div>
        
        {/* Evaluation Results Panel */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '30%', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border bg-card-hover flex flex-col"
            >
               <div className="flex justify-between items-center border-b border-border/50 px-4 py-2 bg-black/20">
                 <h4 className="text-sm font-semibold flex items-center gap-2">
                   {result.passed ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-error" />} 
                   Evaluation Result
                 </h4>
                 <button onClick={() => setResult(null)} className="text-xs text-gray-500 hover:text-white">Close</button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-sm">
                 {result.error ? (
                   <div className="text-error">{result.error}</div>
                 ) : (
                   <div className="space-y-4">
                      <div className="flex items-center gap-4 text-lg font-bold">
                         <span className={result.passed ? 'text-success' : 'text-error'}>
                           {result.passed ? 'Accepted' : 'Failed'}
                         </span>
                         <span className="text-gray-400 font-mono text-sm">{result.score} / {result.total} testcases passed</span>
                      </div>
                      <div className="space-y-2">
                         {result.details?.map((dt: any, i: number) => (
                           <div key={i} className={`p-2 rounded border ${dt.passed ? 'border-success/30 bg-success/10 text-success' : 'border-error/30 bg-error/10 text-error'}`}>
                              <div className="font-semibold">{i+1}. {dt.name}</div>
                              {!dt.passed && <div className="text-xs mt-1 text-gray-400">{dt.reason}</div>}
                           </div>
                         ))}
                      </div>
                   </div>
                 )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";

type Question = {
  q: string;
  a: string;
  testing: string;
};

type Category = {
  name: string;
  description: string;
  questions: Question[];
};

const concepts: Category[] = [
  {
    name: "Fundamentals",
    description: "First 30 minutes of the screen. Short answers, clean tradeoffs.",
    questions: [
      {
        q: "1. Walk me through ReAct. Why does it work?",
        a: "ReAct interleaves Reasoning and Acting: model writes a thought, picks a tool, observes the result, repeats. It works because the observation grounds the next step in real data instead of letting the model hallucinate forward. Risk is verbosity and token cost since every loop adds context.",
        testing: "Whether you understand the loop primitive, not whether you memorized the paper."
      },
      {
        q: "2. Plan-and-execute vs ReAct. When do you pick which?",
        a: "Plan-and-execute writes the full plan upfront, then executes. ReAct decides each step in the loop. Plan-and-execute is cheaper when the task decomposes cleanly. ReAct wins when later steps genuinely depend on what earlier steps return (debugging, exploratory analysis).",
        testing: "Whether you justify architecture from task structure, not preference."
      },
      {
        q: "3. What's reflection in an agent loop?",
        a: "Reflection is when the agent reviews its own output or trajectory and decides whether to retry, refine, or accept. Two patterns: self-critique on the final answer, or step-level reflection that catches a bad tool call before the next step compounds the error. Roughly doubles cost.",
        testing: "Whether you've actually built one. Anyone who's shipped reflection knows the cost hit."
      },
      {
        q: "4. Define 'tool use' without marketing fluff.",
        a: "The model emits a structured call (JSON matching a schema), your runtime executes it, the result feeds the next model call. Function calling is the API mechanic; tool use is the pattern. The hard part is schema design and error handling.",
        testing: "Whether you separate the API feature from the design problem."
      },
      {
        q: "5. Autonomous vs assisted agents. Where's the line?",
        a: "Assisted agents wait for confirmation before consequential actions (sending email, writing to a database, spending money). Autonomous agents act inside a sandbox with budget and capability limits. Draw the line by blast radius: if a wrong action costs money, leaks data, or wakes someone up, gate it behind a human.",
        testing: "Whether you'll ship something reckless."
      },
      {
        q: "6. Why do agents loop forever, and how do you stop it?",
        a: "Three causes: model can't tell the task is done, a tool keeps returning an error the model can't handle, or the model fixates on a sub-goal. Stop it with hard step limits, budget caps (tokens and dollars), repeated-state detection, and an explicit termination check. Step cap is the cheapest defense.",
        testing: "Whether you've debugged a runaway loop at 3am."
      },
      {
        q: "7. What's the simplest agent you'd build today?",
        a: "A single-tool ReAct loop with a 5-step cap and structured logging. One tool, a system prompt that defines termination, a wrapper that records every step. Anything more without a reason is over-engineering.",
        testing: "Whether you reach for complexity or simplicity by default."
      }
    ]
  },
  {
    name: "Frameworks",
    description: "Every team picked sides and is justifying the call. The trap is naming a favorite without owning the tradeoffs.",
    questions: [
      {
        q: "8. LangGraph vs CrewAI vs AutoGen vs custom. How do you choose?",
        a: "LangGraph for explicit state machines and durable checkpoints. Best for long-running stateful agents. CrewAI for fast multi-agent prototypes with role-based orchestration. AutoGen for conversational multi-agent patterns. Custom if your loop is simple or constraints rule out a framework.",
        testing: "Whether you can defend a pick without bashing the others."
      },
      {
        q: "9. When would you build a custom agent loop?",
        a: "When the loop is small enough that the framework adds more than it saves (~50 lines for single-tool ReAct). Also when you need control the framework doesn't expose: custom retry logic, non-standard state, specific observability hooks. Frameworks earn their weight on multi-agent and long-running stateful systems.",
        testing: "Whether you reach for frameworks reflexively."
      },
      {
        q: "10. Explain LangGraph's state graph model.",
        a: "A directed graph: nodes are functions (LLM call, tool call, decision), edges are transitions. State is a typed dict that flows through nodes; each node returns updates that get merged. Edges can be conditional. Checkpoints persist state so you can resume after a crash.",
        testing: "Whether you've used it past the quickstart."
      },
      {
        q: "11. CrewAI uses roles. What's the tradeoff?",
        a: "Roles give you fast prototyping and a mental model that ports to non-engineers. Tradeoff: role boundaries are convention, not enforcement. Agents leak responsibilities and debugging gets murky. Fine for demos, painful in prod beyond a certain scale.",
        testing: "Whether you've felt the pain."
      },
      {
        q: "12. What's wrong with AutoGen's conversational pattern?",
        a: "Nothing inherent, but conversation as orchestration means every message gets re-ingested by every agent, inflating token cost and latency. Works for research where the conversation IS the artifact. Bad fit for high-volume production where structured handoffs win.",
        testing: "Whether you understand the cost model, not just the feature list."
      },
      {
        q: "13. How do you handle framework lock-in?",
        a: "Keep business logic (tools, prompts, eval harness) out of the framework. The framework wraps orchestration; everything else lives in your own modules. Switching costs a week, not a quarter.",
        testing: "Whether you've been burned by it."
      },
      {
        q: "14. Pick one framework you'd never use in prod. Why?",
        a: "Any framework where the abstraction hides the prompt or the loop semantics. If I can't see what the model is being asked and what the runtime does between calls, I can't debug it. Rules out a few 'no-code agent' platforms regardless of demo polish.",
        testing: "Whether you have taste, not whether you trash-talk."
      },
      {
        q: "15. Message-passing vs shared-state architectures?",
        a: "Shared state (one dict every node reads and writes) is simpler for short flows. Message passing (typed messages, no shared mutable state) scales better with many agents or distributed execution. Default to shared state until pain forces a move.",
        testing: "Whether you reach for distributed systems vocab without justification."
      }
    ]
  },
  {
    name: "Tool Use and Function Calling",
    description: "The round where the screen shares a JSON schema and asks you to fix it.",
    questions: [
      {
        q: "16. How do you design a tool schema the model will call correctly?",
        a: "Three rules: descriptive parameter names, examples in the description, strict typing. If a parameter could be string or number, pick one and validate. Use enum for known values. Keep the schema small; models call short schemas more reliably than 15-parameter monsters.",
        testing: "Whether you've debugged a tool the model wouldn't call."
      },
      {
        q: "17. The model calls a tool and gets an error. What do you feed back?",
        a: "Structured: error type, message, hint about valid input. Don't paste the stack trace. Don't swallow and return success. I return {'error': '<type>', 'message': '<short>', 'hint': '<recovery>'}.",
        testing: "Whether you understand error handling shapes the next loop iteration."
      },
      {
        q: "18. Parallel tool calls. When and how?",
        a: "When the model emits multiple tool calls in one turn and the tools are independent, execute in parallel. Saves latency proportional to the longest call. Anthropic and OpenAI APIs support this natively. Don't parallelize across turns; that's concurrency, not parallelism.",
        testing: "Whether you know the API supports it and you've used it."
      },
      {
        q: "19. Tool results exceed the context window. What do you do?",
        a: "Summarize before feeding back, store the full result in a side-channel the model can re-query, or paginate. Cheapest is summarization with a small model. Most accurate is full storage + re-query.",
        testing: "Whether you've hit this in production."
      },
      {
        q: "20. Structured outputs vs tool use. What's the difference?",
        a: "Structured outputs constrain the final answer shape. Tool use lets the model call functions. Both use JSON schema, which is why they get confused. Use structured outputs when you want a typed response. Use tool use when you want the model to take actions and observe results.",
        testing: "Whether you can keep the two patterns straight."
      },
      {
        q: "21. The model is making up tool names. Why?",
        a: "Three causes: tools weren't passed to that API call, the prompt mentions tools that aren't available, or the model's tool-use training is weak for that schema shape. Fix in that order. Usually it's the prompt promising capabilities you didn't wire up.",
        testing: "Whether you debug systematically or guess."
      }
    ]
  },
  {
    name: "Human-in-the-Loop and Checkpointing",
    description: "Design round questions. They want to know if you'd let your agent send the email.",
    questions: [
      {
        q: "22. When do you interrupt for human approval?",
        a: "Before any high blast radius action: spending money, external communication, writing to prod data, anything irreversible. Also when confidence on a critical decision drops below a threshold. Cheap actions don't need approval.",
        testing: "Whether you have judgment about blast radius."
      },
      {
        q: "23. How do you persist agent state for resumption?",
        a: "Two layers: a checkpoint of full agent state (messages, intermediate results, tool history) and a separate event log for audit. Checkpoints go in a durable store keyed by run_id; LangGraph's checkpointer is the cleanest reference.",
        testing: "Whether you've thought about crash recovery."
      },
      {
        q: "24. The agent crashes mid-run. Walk me through resuming.",
        a: "Load the latest checkpoint for the run_id, validate the state schema still matches, re-enter the loop at the next node. The tricky part is partial side effects: if the agent already sent the email, you don't want to send it twice. Idempotency keys solve this.",
        testing: "Whether you understand idempotency in agent context."
      },
      {
        q: "25. How do you let a human edit the agent's plan mid-run?",
        a: "Pause at a checkpoint, surface state and proposed next step in a UI, let the human edit the plan or any intermediate result, resume with edited state. LangGraph's interrupt mechanism is built for this.",
        testing: "Whether you've thought about the human side."
      },
      {
        q: "26. What's the cost of checkpointing?",
        a: "Storage and write latency. For most agents both are small relative to model cost, so default to checkpoint-everything and optimize on pressure. The trap is checkpointing large tool results inline; reference them by ID instead.",
        testing: "Whether you measure before optimizing."
      }
    ]
  },
  {
    name: "Eval and Observability",
    description: "The round that filters senior candidates. Can you tell whether your agent is actually getting better?",
    questions: [
      {
        q: "27. How do you eval an agent vs a single-LLM app?",
        a: "Single-LLM: input -> output, score the output. Agent: input -> trajectory -> output, score both the final answer AND the trajectory (which tools were called, in what order). Trajectory eval catches agents that get the right answer the wrong way.",
        testing: "Whether you understand the eval shape change."
      },
      {
        q: "28. What's a golden trajectory?",
        a: "A reference trajectory for a known input: the ideal sequence of tool calls and intermediate results an expert produces. Score new runs against the golden by step-level match. Building goldens is expensive but reliable.",
        testing: "Whether you've actually run this kind of eval."
      },
      {
        q: "29. How do you track cost per task?",
        a: "Instrument every model call and tool call with cost. Aggregate by run_id, then by task type. Dashboards: p50/p95 cost per task, cost per successful task, trend over time. Helicone and LangSmith both have this out of the box.",
        testing: "Whether you've owned a cost line item."
      },
      {
        q: "30. LangSmith vs Helicone vs custom. What do you use?",
        a: "LangSmith if you want trace UI and eval together (LangChain ecosystem). Helicone for a proxy-based approach across providers with minimal code change. Custom for compliance needs or integration with existing observability.",
        testing: "Whether you've shipped observability, not just installed it."
      },
      {
        q: "31. Agent passes eval in dev but fails in prod. Where do you look?",
        a: "Distribution drift first: prod input distribution vs eval set? Then tool reliability (eval tools are mocks). Then model version. Then long-tail prompts. Add prod sampling to your eval set every week.",
        testing: "Whether you've debugged the eval-prod gap before."
      }
    ]
  },
  {
    name: "Production System Design",
    description: "Final round. Whiteboard, design something real.",
    questions: [
      {
        q: "32. Design a research agent that handles 10k requests per day.",
        a: "Queue + worker. API takes the request, drops a job on a queue (SQS, Redis), workers pick up jobs and run the agent loop. Each worker has a budget cap. Checkpointing to a durable store. Scale workers horizontally on queue depth.",
        testing: "Whether you can do capacity math and pick the right primitives."
      },
      {
        q: "33. Multi-agent coordination. When do you actually need it?",
        a: "Rarely. Most 'multi-agent' systems are one orchestrator that calls specialized sub-routines. True multi-agent makes sense when tasks decompose cleanly along agent boundaries, agents need different tool access, or you want to parallelize independent sub-problems.",
        testing: "Whether you'll over-engineer."
      },
      {
        q: "34. Latency budget for an interactive agent. How do you set it?",
        a: "Budget = user tolerance, typically 5-15s for chat, 30s+ for batch. Decompose: model latency, tool latency, loop count. Set per-step budgets and fail fast when exceeded. If total exceeds tolerance, switch to streaming.",
        testing: "Whether you understand latency as a budget, not a property."
      },
      {
        q: "35. How do you contain costs when an agent goes off the rails?",
        a: "Five layers: hard step cap (e.g., 10 max), token budget per run, dollar budget per run, repeated-state detection (same tool call twice triggers a halt), circuit breakers on tools that error repeatedly.",
        testing: "Whether you've actually had a runaway and learned from it."
      }
    ]
  }
];

function Accordion({ question, answer, testing }: { question: string, answer: string, testing: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-border bg-card rounded-md overflow-hidden mb-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex justify-between items-center bg-card-hover hover:bg-card-hover/80 transition-colors"
      >
        <span className="font-medium text-gray-200">{question}</span>
        {isOpen ? <ChevronUp className="h-4 w-4 text-neon-blue" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="p-4 bg-card border-t border-border/50 text-sm">
          <p className="text-gray-300 mb-3">{answer}</p>
          <div className="bg-neon-blue/10 border border-neon-blue/20 p-3 rounded text-neon-blue">
            <span className="font-bold">Testing:</span> {testing}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConceptQuestions() {
  return (
    <div className="mt-12 space-y-8">
      <div className="border-b border-border pb-4 flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-neon-blue" />
        <h2 className="text-2xl font-bold text-white">Concept-Based Interview Questions</h2>
      </div>
      
      <div className="space-y-10">
        {concepts.map((cat, i) => (
          <div key={i} className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{cat.name}</h3>
              <p className="text-sm text-gray-400">{cat.description}</p>
            </div>
            <div>
              {cat.questions.map((q, j) => (
                <Accordion key={j} question={q.q} answer={q.a} testing={q.testing} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

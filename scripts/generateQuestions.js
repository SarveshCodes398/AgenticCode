const fs = require('fs');
const path = require('path');
const { ChatGroq } = require('@langchain/groq');
import "dotenv/config";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const model = new ChatGroq({
  apiKey: GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  temperature: 0.5
});

const DB_PATH = path.join(__dirname, '..', 'src', 'db', 'questions.json');

async function generateBatch(batchNum, batchSize) {
  console.log(`Generating batch ${batchNum}...`);
  const prompt = `
You are an expert technical interviewer for Agentic Coding Rounds.
Generate exactly ${batchSize} unique, high-quality agentic coding questions.
For each question, provide exactly 50 test cases that evaluate the conceptual correctness, logic, edge cases, and robustness of the agentic solution.

Return the response STRICTLY as a JSON array of objects. Do not include any markdown formatting, just the raw JSON.
Each object must match this schema:
{
  "id": "q-batch${batchNum}-num<index>",
  "title": "String",
  "difficulty": "Easy" | "Medium" | "Hard",
  "description": "String (detailed problem statement, e.g., 'How would you add a RAG pipeline of docs on your agent for a college FAQ chatbot')",
  "hints": ["String", "String", "String"],
  "testCases": ["String"] // Exactly 50 strings describing what needs to be tested in the student's code (e.g. 'Checks if VectorStore retriever is initialized', 'Verifies empty query handling', etc.)
}
`;

  try {
    const response = await model.invoke(prompt);
    let content = response.content;
    
    // Clean up markdown block if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (content.startsWith('```')) {
        content = content.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    return JSON.parse(content);
  } catch (err) {
    console.error(`Error generating batch ${batchNum}:`, err.message);
    return [];
  }
}

async function main() {
  const totalQuestions = 100;
  const batchSize = 5; // Smaller batch size to avoid hitting LLM output token limits
  const batches = totalQuestions / batchSize;
  
  let allQuestions = [];
  
  // Create DB directory if it doesn't exist
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Load existing questions if any
  if (fs.existsSync(DB_PATH)) {
    try {
        allQuestions = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        console.log(`Loaded ${allQuestions.length} existing questions.`);
    } catch(e) {}
  }

  if (allQuestions.length >= totalQuestions) {
      console.log("Already have 100 questions. Exiting.");
      return;
  }

  // Generate a few questions initially to seed the DB so the app can be used immediately.
  // Generating 100 * 50 testcases takes a long time and token limit, so we will generate 2 batches (10 questions)
  
  console.log("Generating initial questions to seed the database...");
  
  for (let i = 0; i < 2; i++) { 
      const batch = await generateBatch(i + 1, batchSize);
      if (batch && batch.length > 0) {
          allQuestions.push(...batch);
          fs.writeFileSync(DB_PATH, JSON.stringify(allQuestions, null, 2));
          console.log(`Saved ${allQuestions.length} questions to ${DB_PATH}`);
      }
      
      // small delay to prevent rate limits
      await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log("Seed generation complete! You can run this script again to generate more questions.");
}

main();

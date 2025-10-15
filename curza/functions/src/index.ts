import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";

// Admin init
initializeApp();

/**
 * Read from secret injected by Cloud Functions (Gen-2)
 * Set with: `firebase functions:secrets:set OPENAI_API_KEY`
 */
function requireOpenAIKey() {
  const key = process.env.OPENAI_API_KEY ?? "";
  if (!key) {
    // Don't crash locally—just warn; but in prod we expect it to be set.
    console.warn("OPENAI_API_KEY is not set.");
  }
  return key;
}

type SummaryReq = { text: string; subject: string; grade: number };
type QuizReq = { text: string; subject: string; grade: number; count?: number };

const MODEL = "gpt-4o-mini";

// Helper to call OpenAI Responses API using Node 20's global fetch
async function callResponses(apiKey: string, body: any) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text}`);
  }
  return (await res.json()) as any;
}

// === Summaries + Flashcards ===
export const summarize = onCall<SummaryReq>(
  {
    region: "us-central1",
    timeoutSeconds: 120,
    memory: "256MiB",
    secrets: ["OPENAI_API_KEY"],
  },
  async (request) => {
    const { auth, data } = request;
    if (!auth) throw new HttpsError("unauthenticated", "Sign in required");

    const { text, subject, grade } = data;
    const schema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        bullets: { type: "array", items: { type: "string" } },
        keyConcepts: { type: "array", items: { type: "string" } },
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: { q: { type: "string" }, a: { type: "string" } },
            required: ["q", "a"],
          },
        },
      },
      required: ["summary", "bullets", "keyConcepts", "flashcards"],
    };

    const input = [
      {
        role: "system",
        content: `You are a South African ${subject} tutor for Grade ${grade}. Use clear, exam-ready language.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Summarize this content, produce 5–8 bullets, list key concepts, and create 8 flashcards.",
          },
          { type: "text", text },
        ],
      },
    ];

    const out = await callResponses(requireOpenAIKey(), {
      model: MODEL,
      input,
      response_format: {
        type: "json_schema",
        json_schema: { name: "summaryPack", schema },
      },
    });

    const payload = JSON.parse(out.output[0].content[0].text as string);
    return payload;
  }
);

// === Build MCQ quiz ===
export const buildQuiz = onCall<QuizReq>(
  {
    region: "us-central1",
    timeoutSeconds: 120,
    memory: "256MiB",
    secrets: ["OPENAI_API_KEY"],
  },
  async (request) => {
    const { auth, data } = request;
    if (!auth) throw new HttpsError("unauthenticated", "Sign in required");

    const { text, subject, grade, count = 10 } = data;

    const schema = {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              stem: { type: "string" },
              choices: { type: "array", items: { type: "string" } },
              answerIndex: { type: "integer" },
            },
            required: ["id", "stem", "choices", "answerIndex"],
          },
        },
      },
      required: ["items"],
    };

    const input = [
      {
        role: "system",
        content: `Create ${count} CAPS-aligned multiple-choice questions for Grade ${grade} ${subject}. One correct answer, plausible distractors.`,
      },
      { role: "user", content: [{ type: "text", text }] },
    ];

    const out = await callResponses(requireOpenAIKey(), {
      model: MODEL,
      input,
      response_format: { type: "json_schema", json_schema: { name: "quiz", schema } },
    });

    const payload = JSON.parse(out.output[0].content[0].text as string);
    return payload;
  }
);

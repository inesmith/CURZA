import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { defineSecret } from "firebase-functions/params";

initializeApp();

// Use Secret Manager (what you just deployed)
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

const MODEL = "gpt-4o-mini"; // small/fast; swap to bigger when needed

type CreateTestReq = {
  subject: string;        // "Physical Sciences"
  grade: number;          // 7..12
  mode: "full" | "section";
  examType?: string;      // e.g. "Paper 1" | "Paper 2" | "June Exam" | "Trial Exam"
  topic?: string;         // only for section mode (e.g., "Mechanics: Newton's Laws")
  minutes?: number;       // optional explicit time limit; if absent we suggest one
};

// quick helper for OpenAI Responses API
async function callResponses(key: string, body: any) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<any>;
}

/**
 * createTest
 * Returns an exam-like test structure (not a “quiz”):
 * - title, durationMinutes (suggested if not provided)
 * - sections[] with items[] (MCQ/short/calc), each with points + marking guidance
 */
export const createTest = onCall({ secrets: [OPENAI_API_KEY] }, async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError("unauthenticated", "Sign in required");

  const { subject, grade, mode, examType, topic, minutes } = data as CreateTestReq;

  if (!subject || !grade || !mode) {
    throw new HttpsError("invalid-argument", "subject, grade and mode are required");
  }
  if (mode === "section" && !topic) {
    throw new HttpsError("invalid-argument", "topic is required for section mode");
  }

  // JSON schema we want back
  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      durationMinutes: { type: "number" },
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            instructions: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: { type: "string", enum: ["mcq", "short", "calc"] },
                  stem: { type: "string" },
                  choices: { type: "array", items: { type: "string" } },   // only for mcq
                  answer: { type: "string" },                              // model answer / marking points
                  points: { type: "number" },
                },
                required: ["id", "type", "stem", "answer", "points"],
              },
            },
          },
          required: ["title", "instructions", "items"],
        },
      },
      markingGuidelines: { type: "string" },
    },
    required: ["title", "durationMinutes", "sections", "markingGuidelines"],
  };

  // If minutes is not provided, we’ll ask the model to suggest one that is
  // typical for the subject/grade/examType/section.
  const ask = (minutes
    ? `Use ${minutes} minutes total.`
    : `Suggest a realistic total time in minutes for Grade ${grade} ${subject}${examType ? " (" + examType + ")" : ""}${mode === "section" ? " section test" : " full paper"}.`);

  const input = [
    {
      role: "system",
      content:
        `You are a CAPS-aligned exam setter for South African Grade ${grade} ${subject}. ` +
        `Create a structured ${mode === "full" ? "full exam" : "section test"} with clear sections and points. ` +
        `Use exam-ready phrasing and realistic marking points.`,
    },
    {
      role: "user",
      content: [
        { type: "text", text: `${mode === "full" ? `Create a full paper${examType ? " for " + examType : ""}.` : `Create a section test on: ${topic}.`}` },
        { type: "text", text: ask },
        { type: "text", text: `Return JSON with: title, durationMinutes, sections[{title,instructions,items[{id,type(mcq|short|calc),stem,choices?,answer,points}]}], markingGuidelines.` },
      ],
    },
  ];

  const out = await callResponses(OPENAI_API_KEY.value(), {
    model: MODEL,
    input,
    response_format: { type: "json_schema", json_schema: { name: "exam", schema } },
  });

  const payload = JSON.parse(out.output[0].content[0].text as string);
  return payload;
});

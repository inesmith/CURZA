// functions/src/summarise.ts
import { onCall } from "firebase-functions/v2/https";
import { openai, MODEL } from "./openai";

type SummariseReq = { topic: string; grade?: string };

type TopicSummary = {
  title: string;
  overview: string;
  keyConcepts: string[];
  formulas: { name: string; expr: string; note: string }[];
  workedExample: {
    problem: string;
    steps: string[];
    answer: string;
  };
  tips: string[];
};

// 🔹 Fallback now returns NON-EMPTY content so UI is never blank
function fallbackSummary(topic: string): TopicSummary {
  const name = topic || "This topic";

  return {
    title: name,
    overview: `Key ideas, examples and tips for ${name}.`,
    keyConcepts: [
      `${name}: main idea or definition.`,
      `${name}: how it is used in problems.`,
      `${name}: common links to other topics.`,
    ],
    formulas: [],
    workedExample: {
      problem: `Example problem involving ${name}. (AI summary unavailable, using fallback.)`,
      steps: [
        `Identify what is being asked in the ${name} question.`,
        `Write down the relevant definitions or formulas for ${name}.`,
        `Substitute the given values and simplify carefully.`,
      ],
      answer: `A sample answer for a typical ${name} question (fallback content).`,
    },
    tips: [
      `Revise the basic definition of ${name} before attempting harder problems.`,
      `Write each step clearly when working with ${name} so you can see mistakes.`,
      `Check your final answer for ${name} questions to see if it makes sense in context.`,
    ],
  };
}

export const summarise = onCall<SummariseReq>(
  { region: "us-central1" },
  async (req) => {
    const { topic, grade = "" } = req.data || {};

    if (!topic) {
      console.error("[summarise] Missing topic in request");
      return fallbackSummary("");
    }

    const schema = {
      type: "object",
      required: [
        "title",
        "overview",
        "keyConcepts",
        "formulas",
        "workedExample",
        "tips",
      ],
      properties: {
        title: { type: "string" },
        overview: { type: "string" },
        keyConcepts: { type: "array", items: { type: "string" }, minItems: 3 },
        formulas: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "expr", "note"],
            properties: {
              name: { type: "string" },
              expr: { type: "string" },
              note: { type: "string" },
            },
          },
        },
        workedExample: {
          type: "object",
          required: ["problem", "steps", "answer"],
          properties: {
            problem: { type: "string" },
            steps: { type: "array", items: { type: "string" } },
            answer: { type: "string" },
          },
        },
        tips: { type: "array", items: { type: "string" }, minItems: 3 },
      },
    };

    const system = `You are a clear, student-friendly math explainer.
Return JSON only.`;

    const user = `
Make a concise summary for "${topic}" ${grade ? "(grade " + grade + ")" : ""}.
Keep it practical and readable on mobile.

Return ONLY valid JSON that conforms to this schema (no extra text):
${JSON.stringify(schema)}
`;

    let txt = "";

    try {
      const res = await openai.responses.create({
        model: MODEL,
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        // @ts-ignore (types may lag behind)
        response_format: {
          type: "json_schema",
          json_schema: { name: "TopicSummary", schema },
        },
      } as any);

      txt =
        (res as any)?.output_text ??
        (res as any)?.output?.[0]?.content?.[0]?.text ??
        "";

      if (!txt || typeof txt !== "string") {
        console.error("[summarise] Empty or invalid OpenAI response", res);
        return fallbackSummary(topic);
      }
    } catch (err) {
      console.error("[summarise] OpenAI call failed:", err);
      return fallbackSummary(topic);
    }

    try {
      const parsed = JSON.parse(txt);

      if (!parsed || typeof parsed !== "object") {
        console.error("[summarise] Parsed JSON not an object:", parsed);
        return fallbackSummary(topic);
      }

      // If AI returns empty arrays/strings for some reason, also backfill
      const withFallbacks: TopicSummary = {
        ...fallbackSummary(topic),
        ...parsed,
      };

      return withFallbacks;
    } catch (err) {
      console.error("[summarise] JSON parse failed. Raw text was:", txt);
      return fallbackSummary(topic);
    }
  }
);

import { onCall } from "firebase-functions/v2/https";
import { openai, MODEL } from "./openai";

type TopicSection = {
  name: string;
  keyConcepts: string[];
  formulas: string[];
  exampleSteps: string[];
  tips: string[];
};

const FALLBACK_TOPICS: TopicSection[] = [
  {
    name: "Intro Concepts",
    keyConcepts: [
      "Core definitions and notation",
      "Relationship between variables",
      "Typical question formats"
    ],
    formulas: [],
    exampleSteps: ["Read the definition", "Identify given values", "Apply the rule", "Simplify", "Conclude"],
    tips: [
      "Underline key terms in the question.",
      "Check units and simplify algebra carefully."
    ]
  }
];

/**
 * Returns:
 * {
 *   topics: Array<{
 *     name: string,
 *     keyConcepts: string[],
 *     formulas: string[],
 *     exampleSteps: string[],
 *     tips: string[]
 *   }>
 * }
 */
export const chapterTopics = onCall({ region: "us-central1" }, async (req) => {
  const { curriculum, grade, subject, chapterNumber, chapterName } = req.data || {};
  if (!subject || !chapterNumber) {
    return { topics: FALLBACK_TOPICS };
  }

  const cur = String(curriculum || "CAPS").trim();
  const grd = String(grade || "").trim();
  const subj = String(subject).trim();
  const chNo = String(chapterNumber).trim();
  const chName = String(chapterName || "").trim();

  const system = `You are an expert curriculum tutor.
Return JSON only, strictly following the provided schema. Be concise but complete for a study guide.`;

  const user = `
Curriculum: ${cur}
Grade: ${grd || "—"}
Subject: ${subj}
Chapter: ${chNo}${chName ? ` - ${chName}` : ""}

Break the chapter into its natural subtopics (3–8). For each topic provide:
- name (short, conventional)
- keyConcepts (comprehensive bullet points, not all-caps)
- formulas (only if relevant; otherwise empty)
- exampleSteps (step-by-step worked outline, 3–8 lines)
- tips (practical hints, common mistakes, exam cues)

Return JSON:
{
  "topics": [
    { "name": "...", "keyConcepts": ["..."], "formulas": ["..."], "exampleSteps": ["..."], "tips": ["..."] }
  ]
}
`;

  const schema = {
    type: "object",
    required: ["topics"],
    properties: {
      topics: {
        type: "array",
        minItems: 1,
        maxItems: 12,
        items: {
          type: "object",
          required: ["name", "keyConcepts", "formulas", "exampleSteps", "tips"],
          properties: {
            name: { type: "string" },
            keyConcepts: { type: "array", items: { type: "string" } },
            formulas: { type: "array", items: { type: "string" } },
            exampleSteps: { type: "array", items: { type: "string" } },
            tips: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  };

  let txt = "";
  try {
    const res = await openai.responses.create({
      model: MODEL,
      input: [{ role: "system", content: system }, { role: "user", content: user }],
      // @ts-ignore
      response_format: { type: "json_schema", json_schema: { name: "ChapterTopics", schema } }
    });
    txt =
      (res as any)?.output_text ??
      (res as any)?.output?.[0]?.content?.[0]?.text ??
      "";
  } catch {
    return { topics: FALLBACK_TOPICS };
  }

  try {
    const parsed = JSON.parse(txt);
    const topics: TopicSection[] = Array.isArray(parsed?.topics) ? parsed.topics : [];
    if (!topics.length) return { topics: FALLBACK_TOPICS };

    // light cleanup
    const cleaned = topics.map((t: TopicSection) => ({
      name: String(t?.name || "").trim() || "Topic",
      keyConcepts: (Array.isArray(t?.keyConcepts) ? t.keyConcepts : []).map((s) => String(s || "").trim()).filter(Boolean),
      formulas: (Array.isArray(t?.formulas) ? t.formulas : []).map((s) => String(s || "").trim()).filter(Boolean),
      exampleSteps: (Array.isArray(t?.exampleSteps) ? t.exampleSteps : []).map((s) => String(s || "").trim()).filter(Boolean),
      tips: (Array.isArray(t?.tips) ? t.tips : []).map((s) => String(s || "").trim()).filter(Boolean)
    }));

    return { topics: cleaned.length ? cleaned : FALLBACK_TOPICS };
  } catch {
    return { topics: FALLBACK_TOPICS };
  }
});

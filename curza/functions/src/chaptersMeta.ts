import { onCall } from "firebase-functions/v2/https";
import { openai, MODEL } from "./openai";

const FALLBACK = {
  total: 10,
  names: {
    "1": "Algebraic Expressions",
    "2": "Factorisation",
    "3": "Equations & Inequalities",
    "4": "Functions & Graphs",
    "5": "Trigonometry",
    "6": "Sequences & Series",
    "7": "Analytical Geometry",
    "8": "Probability",
    "9": "Statistics",
    "10": "Financial Mathematics"
  }
};

export const chaptersMeta = onCall({ region: "us-central1" }, async (req) => {
  const { curriculum, grade, subject } = req.data || {};
  if (!subject) return { total: 0, names: {} };

  const cur = String(curriculum || "CAPS").trim();
  const grd = String(grade || "").trim();
  const subj = String(subject).trim();

  const system = `You are a South African school curriculum assistant.
Return JSON only. Keep chapter names concise and commonly used in textbooks and past papers.
Do NOT include numbering prefixes in the names (no "Chapter 1: ..."), just clean titles.
If the syllabus differs by curriculum (CAPS, IEB, Cambridge, IB), choose the most standard naming for the given curriculum and grade.`;

  const user = `
For curriculum: ${cur}
Grade: ${grd || "—"}
Subject: ${subj}

Return exactly this JSON shape:
{
  "total": <number>,
  "names": {
    "1": "First chapter name",
    "2": "Second chapter name",
    ...
  }
}
Rules:
- Provide the full list for the year level (not just a few).
- "total" must equal the number of keys in "names".
- Keep names short (max ~6 words), accurate, and conventional for this syllabus.
`;

  const schema = {
    type: "object",
    required: ["total", "names"],
    properties: {
      total: { type: "integer", minimum: 1, maximum: 40 },
      names: {
        type: "object",
        additionalProperties: { type: "string" }
      }
    }
  };

  let txt = "";
  try {
    const res = await openai.responses.create({
      model: MODEL,
      input: [{ role: "system", content: system }, { role: "user", content: user }],
      // @ts-ignore
      response_format: { type: "json_schema", json_schema: { name: "ChaptersMeta", schema } }
    });
    txt =
      (res as any)?.output_text ??
      (res as any)?.output?.[0]?.content?.[0]?.text ??
      "";
  } catch {
    return FALLBACK;
  }

  try {
    const parsed = JSON.parse(txt);
    const namesObj = parsed?.names && typeof parsed.names === "object" ? parsed.names : {};
    const keys = Object.keys(namesObj).sort((a, b) => Number(a) - Number(b));

    const normalized: Record<string, string> = {};
    keys.forEach((k, i) => {
      const val = String(namesObj[k] ?? "").trim();
      if (val) normalized[String(i + 1)] = val;
    });

    if (!Object.keys(normalized).length) return FALLBACK;

    return { total: Object.keys(normalized).length, names: normalized };
  } catch {
    return FALLBACK;
  }
});

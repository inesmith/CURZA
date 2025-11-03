// functions/src/chaptersMeta.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Public callable (no auth required) – safe because it returns only generic metadata
export const chaptersMeta = onCall<{
  curriculum: string | number;
  grade: string | number;
  subject: string;
}>(async (req) => {
  try {
    const { curriculum, grade, subject } = req.data || {};
    if (!curriculum || !grade || !subject) {
      throw new HttpsError(
        "invalid-argument",
        "Required fields: curriculum, grade, subject"
      );
    }

    // Prompt model to return strict JSON: { total:number, chapters:[{number:number,name:string}] }
    const sys =
      "You generate accurate chapter structures for school subjects. " +
      "Return ONLY valid JSON with shape: {\"total\": number, \"chapters\": [{\"number\": number, \"name\": string}, ...] }. " +
      "No prose, no markdown, no comments.";

    const user = `
Curriculum: ${String(curriculum)}
Grade: ${String(grade)}
Subject: ${String(subject)}
Task: Provide the canonical chapter count and precise chapter names for this subject in this curriculum & grade.
Output: Strict JSON only.
`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    });

    const raw = resp.choices?.[0]?.message?.content?.trim() || "{}";

    // Be strict: must be valid JSON
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new HttpsError(
        "internal",
        "Model did not return valid JSON."
      );
    }

    // Minimal validation + normalization
    const total =
      Number(parsed?.total) && Number(parsed?.total) > 0
        ? Number(parsed.total)
        : 10;

    const chaptersArr = Array.isArray(parsed?.chapters) ? parsed.chapters : [];
    const chapters = chaptersArr
      .map((c: any) => ({
        number: Number(c?.number) || null,
        name: String(c?.name ?? "").trim(),
      }))
      .filter((c: any) => c.number && c.name);

    return {
      total,
      chapters,
    };
  } catch (e: any) {
    console.error("chaptersMeta failed:", e);
    throw new HttpsError(
      e?.code === "invalid-argument" ? "invalid-argument" : "internal",
      e?.message || "chaptersMeta failed"
    );
  }
});

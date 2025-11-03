// src/utils/chaptersMeta.ts
import { getAuth } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase"; // your existing initialized functions export
import { summarizeAI, createTestAI } from "../../firebase";

export type ChaptersMeta = {
  total: number;
  names: Record<string, string>;
};

// ---- local catalog fallback (kept short; extend as needed) ----
const catalog: Record<string, ChaptersMeta> = {
  "CAPS|12|Mathematics": {
    total: 14,
    names: {
      "1": "Algebraic Expressions & Laws of Exponents",
      "2": "Factorisation & Simplification",
      "3": "Equations & Inequalities",
      "4": "Number Patterns & Sequences",
      "5": "Functions & Graphs",
      "6": "Financial Mathematics",
      "7": "Trigonometric Ratios & Identities",
      "8": "Trigonometric Graphs & Equations",
      "9": "Analytical Geometry",
      "10": "Euclidean Geometry & Measurement",
      "11": "Differential Calculus",
      "12": "Applications of Calculus",
      "13": "Statistics & Data Handling",
      "14": "Probability",
    },
  },
};

const key = (cur: string | number, grade: string | number, subj: string) =>
  `${String(cur).toUpperCase()}|${String(grade)}|${String(subj).trim()}`;

const generic = (n = 10): ChaptersMeta => ({
  total: n,
  names: Object.fromEntries(Array.from({ length: n }, (_, i) => [`${i + 1}`, ""])),
});

// ---- normalize server JSON into ChaptersMeta ----
function toMeta(raw: any): ChaptersMeta {
  const total =
    Number(raw?.total) && Number(raw.total) > 0 ? Number(raw.total) : 10;
  const map: Record<string, string> = {};
  const arr = Array.isArray(raw?.chapters) ? raw.chapters : [];
  arr.forEach((c: any) => {
    const num = String(c?.number ?? "").trim();
    const name = String(c?.name ?? "").trim();
    if (num) map[num] = name;
  });
  return { total, names: map };
}

export async function getChaptersMeta({
  curriculum,
  grade,
  subject,
}: {
  curriculum: string | number;
  grade: string | number;
  subject: string;
}): Promise<ChaptersMeta> {
  // 1) Try the new callable first (no auth required)
  try {
    const callable = httpsCallable(functions, "chaptersMeta");
    const res = await callable({ curriculum, grade, subject });
    return toMeta((res as any)?.data);
  } catch (e) {
    console.log("chaptersMeta callable failed; trying fallbacks:", e);
  }

  // 2) Catalog fallback for known combos
  const hit = catalog[key(curriculum, grade, subject)];
  if (hit) return hit;

  // 3) If user is signed in, try your existing AI callables
  const user = getAuth().currentUser;
  if (user) {
    try {
      const r1 = await createTestAI({
        mode: "chapters_meta",
        curriculum,
        grade,
        subject,
      });
      return toMeta(r1?.data);
    } catch (e1: any) {
      const code = String(e1?.code || e1?.message || "");
      if (
        code.includes("not-found") ||
        code.includes("unimplemented") ||
        code.includes("function-not-found")
      ) {
        try {
          const r2 = await summarizeAI({
            mode: "chapters_meta",
            curriculum,
            grade,
            subject,
          } as any);
          return toMeta(r2?.data);
        } catch (e2) {
          console.log("summarizeAI chapters_meta failed:", e2);
        }
      }
    }
  }

  // 4) Final generic fallback
  return generic(10);
}

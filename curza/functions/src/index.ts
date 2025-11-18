// functions/src/index.ts
import * as functions from "firebase-functions";
import { onCall } from "firebase-functions/v2/https";

// ------------------------------------------------------
// REAL TEST BUILDERS (from separate files)
// ------------------------------------------------------
export { buildTest } from "./buildTest";
export { generateTestAI } from "./generateTestAI";

// ------------------------------------------------------
// CHAPTERS + TOPICS META
// ------------------------------------------------------
export { chaptersMeta } from "./chaptersMeta";
export { chapterTopics } from "./chapterTopics";

// ------------------------------------------------------
// TOPIC SUMMARIES (AI)
// ------------------------------------------------------
export { summarise } from "./summarise";

// ------------------------------------------------------
// SIMPLE STUBS YOU STILL HAVE
// ------------------------------------------------------
export const scoreTest = onCall({ region: "us-central1" }, async (req) => {
  return { ok: true, score: 0 };
});

// ------------------------------------------------------
// listOptionsAI (keep this here for topics/papers)
// ------------------------------------------------------

type ListReq = {
  type: "topics" | "papers";
  curriculum?: string;
  grade?: number | string;
  subject?: string;
};

const norm = (s?: any) =>
  String(s ?? "")
    .trim()
    .toLowerCase();

function capsMathTopics(grade: number): string[] {
  if (grade <= 9) {
    return [
      "Numbers, Operations & Relationships",
      "Patterns & Algebra",
      "Functions & Graphs",
      "Space & Shape (Geometry)",
      "Measurement",
      "Data Handling & Probability",
    ];
  }
  return [
    "Algebra",
    "Functions & Graphs",
    "Trigonometry",
    "Analytical Geometry",
    "Euclidean Geometry",
    "Probability",
    "Financial Mathematics",
    "Differential Calculus",
    "Integral Calculus",
    "Sequences & Series",
  ];
}

function capsMathPapers(grade: number): string[] {
  if (grade >= 10) return ["Paper 1", "Paper 2"];
  return ["Term Test"];
}

export const listOptionsAI = onCall<ListReq>(
  { region: "us-central1" },
  async (req) => {
    const { type } = req.data || {};
    if (type !== "topics" && type !== "papers") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Expected 'type' to be 'topics' or 'papers'."
      );
    }

    const curriculum = norm(req.data?.curriculum) || "caps";
    const subject = norm(req.data?.subject) || "mathematics";
    let gnum = Number(req.data?.grade ?? 12);
    if (!Number.isFinite(gnum)) gnum = 12;

    if (subject !== "mathematics") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Only Mathematics is supported at this time."
      );
    }

    if (curriculum === "caps") {
      if (type === "topics") {
        return { topics: capsMathTopics(gnum) };
      } else {
        return { papers: capsMathPapers(gnum) };
      }
    }

    if (type === "topics") return { topics: capsMathTopics(gnum) };
    return { papers: capsMathPapers(gnum) };
  }
);

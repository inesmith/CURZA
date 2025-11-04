// functions/src/index.ts
import * as functions from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';

// --- If you already had these, keep them. ---
export const summarise = onCall({ region: 'us-central1' }, async (req) => {
  return { ok: true, summary: 'stub' };
});

export const scoreTest = onCall({ region: 'us-central1' }, async (req) => {
  return { ok: true, score: 0 };
});


export const buildTest = onCall({ region: 'us-central1' }, async (req) => {
  // You already call this from the app as createTestAI('buildTest')
  return {
    title: 'Mathematics Paper',
    totalMarks: 150,
    timed: !!req.data?.timed,
    durationSec: req.data?.timed ? 3 * 60 * 60 : undefined,
    blocks: [],
  };
});

// ---------------- NEW: listOptionsAI ----------------
// Returns curriculum/grade-aligned options:
//  - type: 'topics' -> string[]
//  - type: 'papers' -> string[]
//
// Client calls via httpsCallable('listOptionsAI') using region 'us-central1'.
type ListReq = {
  type: 'topics' | 'papers';
  curriculum?: string;
  grade?: number | string;
  subject?: string;
};

const norm = (s?: any) =>
  String(s ?? '')
    .trim()
    .toLowerCase();

function capsMathTopics(grade: number): string[] {
  // Minimal, safe defaults per CAPS Mathematics (Grade 7–12).
  // You can expand/adjust these lists later.
  if (grade <= 9) {
    return [
      'Numbers, Operations & Relationships',
      'Patterns & Algebra',
      'Functions & Graphs',
      'Space & Shape (Geometry)',
      'Measurement',
      'Data Handling & Probability',
    ];
  }
  // Grades 10–12
  return [
    'Algebra',
    'Functions & Graphs',
    'Trigonometry',
    'Analytical Geometry',
    'Euclidean Geometry',
    'Probability',
    'Financial Mathematics',
    'Differential Calculus',
    'Integral Calculus',
    'Sequences & Series',
  ];
}

function capsMathPapers(grade: number): string[] {
  // CAPS usually Paper 1 & Paper 2 for Grades 10–12.
  // For lower grades, present a generic single paper or sectioned tests.
  if (grade >= 10) return ['Paper 1', 'Paper 2'];
  return ['Term Test'];
}

export const listOptionsAI = onCall<ListReq>({ region: 'us-central1' }, async (req) => {
  const { type } = req.data || {};
  if (type !== 'topics' && type !== 'papers') {
    throw new functions.https.HttpsError('invalid-argument', "Expected 'type' to be 'topics' or 'papers'.");
  }

  const curriculum = norm(req.data?.curriculum) || 'caps';
  const subject = norm(req.data?.subject) || 'mathematics';
  let gnum = Number(req.data?.grade ?? 12);
  if (!Number.isFinite(gnum)) gnum = 12;

  // Only Mathematics is currently supported by the app.
  if (subject !== 'mathematics') {
    throw new functions.https.HttpsError('failed-precondition', 'Only Mathematics is supported at this time.');
  }

  // 🔹 If you later want to use OpenAI to generate/refine lists,
  // you can plug it here and fall back to the curated lists if it fails.
  // For now, we return curriculum-aligned curated options.
  if (curriculum === 'caps') {
    if (type === 'topics') {
      return { topics: capsMathTopics(gnum) };
    } else {
      return { papers: capsMathPapers(gnum) };
    }
  }

  // Fallback for other curricula (IEB/Cambridge/IB) — reuse CAPS until you extend.
  if (type === 'topics') return { topics: capsMathTopics(gnum) };
  return { papers: capsMathPapers(gnum) };
});

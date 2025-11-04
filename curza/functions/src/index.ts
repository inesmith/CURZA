// functions/src/index.ts 
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';

setGlobalOptions({ region: 'us-central1' });

// ---- Existing callable exports ----
export { chaptersMeta } from './chaptersMeta';
export { chapterTopics } from './chapterTopics';

// CreateTest (used by your app)
export const createTest = onCall(async (req) => {
  const { subject, grade, mode, topic, count, examType, timed } = req.data ?? {};

  if (!subject || !grade || !mode) {
    throw new HttpsError('invalid-argument', 'subject, grade, and mode are required.');
  }

  // Build a placeholder response (replace this later with real test generation logic)
  const title =
    mode === 'full'
      ? `${subject} ${examType ?? 'Paper 1'}`
      : topic ?? 'Section Test';

  const totalMarks =
    mode === 'full'
      ? 150
      : (Number(count) > 0 ? Number(count) : 10) * 5;

  return {
    title,
    totalMarks,
    timed: !!timed,
    message: `Generated ${mode} test for ${subject} (Grade ${grade})`,
  };
});

// Summarise
export const summarise = onCall(async (req) => {
  const { text, subject, grade } = req.data ?? {};
  if (!text) {
    throw new HttpsError('invalid-argument', 'text is required.');
  }

  // Simple summarisation placeholder
  return {
    summary: `Summary for ${subject ?? ''} ${grade ? `(Grade ${grade})` : ''}: ${String(
      text,
    ).slice(0, 120)}...`,
  };
});

// ScoreTest (so test submissions don’t 404)
export const scoreTest = onCall(async (req) => {
  const { questions, answers } = req.data ?? {};
  if (!Array.isArray(questions)) {
    throw new HttpsError('invalid-argument', 'questions array is required.');
  }

  return {
    score: 0,
    total: questions.length,
    items: [],
    weakAreas: [],
    message: 'Scoring placeholder until AI marking logic added.',
  };
});

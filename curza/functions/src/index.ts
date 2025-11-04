import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';

setGlobalOptions({ region: 'us-central1' });

// ---- Existing callable exports you already had ----
export { chaptersMeta } from './chaptersMeta';
export { chapterTopics } from './chapterTopics';
export { summarise } from './summarise';
export { buildTest } from './buildTest';

// Back-compat alias: app calls "createTest"
export { buildTest as createTest } from './buildTest';

/**
 * Minimal scorer with stepwise shape.
 * Accepts:
 *  - questions: Block[]
 *  - answers: { items: Array<{ qid: string, id?: string, text?: string }> }
 *  - working: optional Array<{ qid: string, uri?: string, mime?: string }>
 *  - rubric: { stepwise?: boolean, methodMarks?: boolean }
 *
 * Returns:
 *  {
 *    score, total,
 *    items: [{ qid, allocated, max, steps: [{ name, got, max, note? }], feedback? }],
 *    weakAreas: string[],
 *    summary?: { methodMarks, accuracyMarks }
 *  }
 */
export const scoreTest = onCall(async (req) => {
  const { questions, answers, working, rubric } = req.data ?? {};
  if (!Array.isArray(questions)) {
    throw new HttpsError('invalid-argument', 'questions array is required');
  }
  if (!answers || !Array.isArray(answers.items)) {
    throw new HttpsError('invalid-argument', 'answers.items is required');
  }

  // === PLACEHOLDER LOGIC ===
  // We don’t really “mark” here. We return a plausible structure so the app can save and render.
  // Total = sum of question.marks if present; fallback to 100.
  let total = 0;
  for (const q of questions) {
    if (q && q.type === 'question' && typeof q.marks === 'number') {
      total += q.marks;
    }
  }
  if (!total || Number.isNaN(total)) total = 100;

  // Very naive allocation: everyone gets half of each part (as method marks),
  // to demonstrate stepwise breakdown shape.
  const items = [];
  let score = 0;

  for (const ans of answers.items) {
    const qid = String(ans.qid);
    // Fake parse qNumber/part from qid like q-1-p-2
    const isPart = /-p-/.test(qid);

    const max = isPart ? 4 : 8;               // pretend a per-part max vs whole-question max
    const methodGot = Math.ceil(max * 0.5);   // 50% as method marks
    const accuracyGot = 0;                    // 0 now; we’ll improve when we add real marking
    const allocated = methodGot + accuracyGot;

    score += allocated;

    items.push({
      qid,
      allocated,
      max,
      steps: (rubric?.stepwise || rubric?.methodMarks)
        ? [
            { name: 'Setup & Given', got: Math.ceil(max * 0.2), max: Math.ceil(max * 0.2), note: 'Identified variables/knowns' },
            { name: 'Method/Application', got: Math.ceil(max * 0.3), max: Math.ceil(max * 0.3), note: 'Correct method shown' },
            { name: 'Accuracy/Final', got: 0, max: max - Math.ceil(max * 0.5), note: 'Final answer not verified in placeholder' },
          ]
        : undefined,
      feedback: 'Placeholder: method recognised; accuracy not evaluated.',
    });
  }

  const weakAreas: string[] = []; // fill once we have taxonomy mapping

  const result = {
    score,
    total,
    items,
    weakAreas,
    summary: { methodMarks: score, accuracyMarks: 0 },
  };

  // You can inspect `working` array here (uris/mime) to route to a math-OCR service later.
  // e.g., call an OCR+math parser, reconstruct steps, allocate method marks precisely.

  return result;
});

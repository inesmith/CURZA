// src/utils/topicTotals.ts
import { db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/** Canonical key, e.g. "CAPS_12_Mathematics" */
function makeKey(curriculum: string, grade: string | number, subject: string) {
  const c = String(curriculum || '').trim().toUpperCase();
  const g = String(grade || '').trim();
  const s = String(subject || '').trim();
  return `${c}_${g}_${s}`;
}

/**
 * Returns the total number of topics for the subject in the given curriculum+grade.
 * Reads: system/topicTotals/byKey/{key}
 * Seeds a sensible default if missing (you can replace with AI later).
 */
export async function getTopicTotal(
  curriculum: string,
  grade: string | number,
  subject: string,
): Promise<number> {
  const key = makeKey(curriculum, grade, subject);
  const ref = doc(db, 'system', 'topicTotals', 'byKey', key);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data() as any;
    const val = Number(data?.total);
    return Number.isFinite(val) && val > 0 ? val : 12;
  }

  // Defaults (safe placeholders) — extend as needed
  const defaults: Record<string, number> = {
    'CAPS_12_Mathematics': 12,
    'CAPS_11_Mathematics': 12,
    'CAPS_10_Mathematics': 12,
    'CAPS_12_Life Sciences': 10,
    'CAPS_12_Physical Sciences': 12,
    'CAPS_12_Mathematical Literacy': 12,
  };

  const seeded = defaults[key] ?? 12;

  await setDoc(ref, {
    key,
    total: seeded,
    source: 'seed-default',
    updatedAt: serverTimestamp(),
  });

  return seeded;
}

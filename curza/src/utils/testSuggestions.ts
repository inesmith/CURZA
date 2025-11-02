import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';

export type SuggestedTest = {
  id: string;
  label: string;             // what we show in the pill
  subject: string;
  chapter?: string | number;
  topic?: string;
  kind: 'weakness' | 'chapter' | 'mixed';
  createdAt?: number;        // for sorting/recency
};

/**
 * Builds up to `cap` suggested tests for a user & subject.
 * Heuristics:
 *  1) Weak topics from recent results (<= 65%)  → "Mini-test on <topic> (Ch <n>)"
 *  2) Recently read summaries (last few entries) → "Revision quiz: Chapter <n>"
 * De-dupes by label and caps to `cap`.
 */
export async function getUpcomingTestsForSubject(
  uid: string,
  subject: string,
  cap = 5
): Promise<SuggestedTest[]> {
  const out: SuggestedTest[] = [];
  const seen = new Set<string>();

  // --- Recent results → weak areas
  try {
    const resCol = collection(db, 'users', uid, 'results');
    const resQ = query(
      resCol,
      where('subject', '==', subject),
      orderBy('createdAt', 'desc'),
      limit(12)
    );
    const resSnap = await getDocs(resQ);
    resSnap.forEach((d) => {
      const r = d.data() as any;
      const createdAt =
        (r?.createdAt?.toMillis?.() as number) ??
        (typeof r?.createdAt === 'number' ? r.createdAt : 0);

      if (Array.isArray(r?.breakdown)) {
        r.breakdown.forEach((b: any) => {
          const topic = String(b?.topic ?? '').trim();
          const score = typeof b?.score === 'number' ? b.score : 100;
          const chapter = r?.chapter ?? r?.paperChapter ?? '';
          if (topic && score <= 65) {
            const label = `MINI-TEST: ${topic.toUpperCase()}${chapter ? ` (CH ${chapter})` : ''}`;
            if (!seen.has(label)) {
              seen.add(label);
              out.push({
                id: `weak:${d.id}:${topic}:${createdAt}`,
                label,
                subject,
                topic,
                chapter,
                kind: 'weakness',
                createdAt,
              });
            }
          }
        });
      } else {
        // whole-test weak outcome
        const overall = typeof r?.score === 'number' ? r.score : undefined;
        const chapter = r?.chapter ?? '';
        if (typeof overall === 'number' && overall <= 60) {
          const label = chapter
            ? `MINI-TEST: CHAPTER ${chapter} – WEAK AREAS`
            : `MINI-TEST: WEAK AREAS`;
          if (!seen.has(label)) {
            seen.add(label);
            out.push({
              id: `weak:${d.id}:overall:${createdAt}`,
              label,
              subject,
              chapter,
              kind: 'weakness',
              createdAt,
            });
          }
        }
      }
    });
  } catch {
    // ignore
  }

  // --- Recent summaries → revision quiz
  try {
    const sumCol = collection(db, 'users', uid, 'summaries');
    const sumQ = query(
      sumCol,
      where('subject', '==', subject),
      orderBy('generatedAt', 'desc'),
      limit(10)
    );
    const sumSnap = await getDocs(sumQ);
    sumSnap.forEach((d) => {
      const s = d.data() as any;
      const chapter = String(s?.chapter ?? '').trim();
      const genAt =
        (s?.generatedAt?.toMillis?.() as number) ??
        (typeof s?.generatedAt === 'number' ? s.generatedAt : 0);
      if (chapter) {
        const label = `REVISION QUIZ: CHAPTER ${chapter}`;
        if (!seen.has(label)) {
          seen.add(label);
          out.push({
            id: `rev:${d.id}:${genAt}`,
            label,
            subject,
            chapter,
            kind: 'chapter',
            createdAt: genAt,
          });
        }
      }
    });
  } catch {
    // ignore
  }

  // Order by recency (best effort), cap
  out.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return out.slice(0, cap);
}

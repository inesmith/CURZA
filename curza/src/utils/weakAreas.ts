// src/utils/weakAreas.ts
import {
  collection,
  getDocs,
  orderBy,
  limit,
  query,
} from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Pulls weak areas for a given subject from users/{uid}/results,
 * using `breakdown: [{ topic, score }]` when available.
 * Returns topic labels (uppercase) sorted from weakest to stronger.
 */
export async function getWeakAreasForSubject(
  uid: string,
  subject: string,
  maxItems = 10
): Promise<string[]> {
  const colRef = collection(db, 'users', uid, 'results');
  const qy = query(colRef, orderBy('createdAt', 'desc'), limit(40));
  const snap = await getDocs(qy);

  // aggregate per topic
  const sums = new Map<string, { total: number; count: number }>();

  snap.forEach((d) => {
    const r = d.data() as any;
    const s = String(r?.subject ?? '').trim().toLowerCase();
    if (!s) return;
    if (s !== String(subject).trim().toLowerCase()) return;

    if (Array.isArray(r?.breakdown) && r.breakdown.length) {
      r.breakdown.forEach((b: any) => {
        const topic = String(b?.topic ?? '').trim();
        const score = typeof b?.score === 'number' ? b.score : NaN;
        if (!topic || !Number.isFinite(score)) return;
        const key = topic.toUpperCase();
        const prev = sums.get(key) ?? { total: 0, count: 0 };
        prev.total += score;
        prev.count += 1;
        sums.set(key, prev);
      });
    } else {
      // fallback: use overall score, bucket into a generic chapter “topic”
      const chapter = String(r?.chapter ?? '').trim();
      const overall = typeof r?.score === 'number' ? r.score : NaN;
      if (!chapter || !Number.isFinite(overall)) return;
      const key = `CHAPTER ${chapter}`.toUpperCase();
      const prev = sums.get(key) ?? { total: 0, count: 0 };
      prev.total += overall;
      prev.count += 1;
      sums.set(key, prev);
    }
  });

  const ranked = Array.from(sums.entries())
    .map(([topic, agg]) => ({
      topic,
      avg: agg.count ? agg.total / agg.count : 100,
    }))
    .sort((a, b) => a.avg - b.avg) // weakest first
    .slice(0, maxItems)
    .map((x) => x.topic);

  return ranked;
}

// src/utils/suggestions.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../firebase';
// local fallback type for progress keys (remove dependency on ./progress)
type ProgressKey = 'summariesStudied' | 'chaptersCovered' | 'testsCompleted' | string;

export type SuggestedTodo = {
  id?: string;
  text: string;
  source: 'streak' | 'revise' | 'weakness' | 'practice';
  /** Which progress counter should move if user completes this suggestion */
  progressType: ProgressKey;
  curriculum?: string;
  grade?: string | number;
  subject?: string;
  chapter?: string | number;
  score?: number;
  createdAt?: Timestamp;
  dayKey: string; // "YYYY-MM-DD"
};

// Local YYYY-MM-DD (device timezone is fine)
const todayKey = () => new Date().toISOString().slice(0, 10);

/** Subscribe to suggestions as ToDoBlock items (curriculum-aware) */
export function subscribeSuggestedTodos(
  uid: string,
  cb: (items: { id: string; text: string; isSuggested: true }[]) => void,
  opts?: { curriculum?: string; grade?: string | number; subject?: string },
): Unsubscribe {
  const colRef = collection(db, 'users', uid, 'suggestedTodos');

  const clauses: any[] = [orderBy('createdAt', 'asc')];
  if (opts?.curriculum) clauses.unshift(where('curriculum', '==', String(opts.curriculum).toUpperCase()));
  if (opts?.grade != null) clauses.unshift(where('grade', '==', String(opts.grade)));
  if (opts?.subject) clauses.unshift(where('subject', '==', String(opts.subject)));

  const qy = query(colRef, ...clauses);
  return onSnapshot(qy, (snap) => {
    const list = snap.docs.map((d) => ({
      id: d.id,
      text: String((d.data() as any).text ?? '').toUpperCase(),
      isSuggested: true as const,
    }));
    cb(list);
  });
}

/**
 * Apply (complete) a suggestion:
 *  1) add it to normal todos
 *  2) increment the correct progress counter on curriculum-aware doc
 *  3) delete the suggestion
 */
export async function applySuggestedTodo(uid: string, suggestionId: string) {
  const sRef = doc(db, 'users', uid, 'suggestedTodos', suggestionId);
  const snap = await getDoc(sRef);
  const data = snap.data() as SuggestedTodo | undefined;
  if (!data) {
    await deleteDoc(sRef).catch(() => {});
    return;
  }

  // 1) add to normal todos
  const tRef = collection(db, 'users', uid, 'todos');
  await addDoc(tRef, {
    text: data.text,
    createdAt: serverTimestamp(),
    completed: false,
    meta: {
      fromSuggestion: true,
      source: data.source,
      progressType: data.progressType,
      curriculum: data.curriculum ?? null,
      grade: data.grade ?? null,
      subject: data.subject ?? null,
      chapter: data.chapter ?? null,
      dayKey: data.dayKey,
    },
  });

  // 2) increment progress on curriculum-aware doc (fallback to default if missing context)
    if (data.curriculum && data.grade != null && data.subject) {
      try {
        const mod = await import('./progress');
        if (typeof mod.incWithContext === 'function') {
          await mod.incWithContext(data.curriculum, data.grade, data.subject, data.progressType, 1);
        }
      } catch {
        // progress helper unavailable — ignore
      }
    }
  
    // 3) remove suggestion
    await deleteDoc(sRef).catch(() => {});
}

/** Delete without applying */
export async function removeSuggestedTodo(uid: string, suggestionId: string) {
  await deleteDoc(doc(db, 'users', uid, 'suggestedTodos', suggestionId));
}

/**
 * Refresh today’s suggestions for a specific curriculum/grade/subject.
 * Writes: users/{uid}/suggestedTodos (with curriculum/grade/subject tags)
 */
export async function refreshSuggestedTodos(
  uid: string,
  opts: { curriculum: string; grade: string | number; subject: string },
) {
  const day = todayKey();
  const { curriculum, grade, subject } = opts;

  // prevent multiple runs per day for this trio
  const metaId = `${String(curriculum).toUpperCase()}_${String(grade)}_${String(subject)}`;
  const metaRef = doc(db, 'users', uid, 'meta', `suggestions_${metaId}`);
  const metaSnap = await getDoc(metaRef);
  if ((metaSnap.data() as any)?.lastDayKey === day) return;

  // clear older suggestions for this trio
  await deleteOldSuggested(uid, day, curriculum, grade, subject);

  const suggestions: SuggestedTodo[] = [];

  // — Habit / streak
  suggestions.push({
    text: '15-MINUTE REFRESH: REVIEW YOUR LATEST SUMMARY',
    source: 'streak',
    progressType: 'summariesStudied',
    dayKey: day,
    curriculum: String(curriculum).toUpperCase(),
    grade: String(grade),
    subject,
  });

  // — Recently covered chapters (from summaries)
  const recents = await pickRecentChapters(uid, curriculum, grade, subject);
  recents.forEach((r) =>
    suggestions.push({
      text: `REVISE CHAPTER ${r.chapter} – ${r.subject}`,
      source: 'revise',
      progressType: 'chaptersCovered',
      subject: r.subject,
      chapter: r.chapter,
      dayKey: day,
      curriculum: String(curriculum).toUpperCase(),
      grade: String(grade),
    }),
  );

  // — Weak topics (from results breakdown)
  const weakies = await pickWeakAreas(uid, curriculum, grade, subject);
  weakies.forEach((w) =>
    suggestions.push({
      text: `RETRY MINI-TEST: ${w.topic.toUpperCase()} (${w.subject})`,
      source: 'practice',
      progressType: 'testsCompleted',
      subject: w.subject,
      chapter: w.chapter,
      score: w.score,
      dayKey: day,
      curriculum: String(curriculum).toUpperCase(),
      grade: String(grade),
    }),
  );

  // de-dupe by text; cap to 5
  const dedup = Array.from(new Map(suggestions.map((s) => [s.text, s])).values()).slice(0, 5);

  // write today’s set
  const colRef = collection(db, 'users', uid, 'suggestedTodos');
  const batch = writeBatch(db);
  dedup.forEach((s) => batch.set(doc(colRef), { ...s, createdAt: serverTimestamp() }));
  batch.set(metaRef, { lastDayKey: day }, { merge: true });
  await batch.commit();
}

async function deleteOldSuggested(
  uid: string,
  keepDayKey: string,
  curriculum: string,
  grade: string | number,
  subject: string,
) {
  const colRef = collection(db, 'users', uid, 'suggestedTodos');
  const qy = query(
    colRef,
    where('dayKey', '!=', keepDayKey),
    where('curriculum', '==', String(curriculum).toUpperCase()),
    where('grade', '==', String(grade)),
    where('subject', '==', String(subject)),
  );
  const snap = await getDocs(qy);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

// —— Recent summaries (for chapter revision), curriculum-aware
async function pickRecentChapters(
  uid: string,
  curriculum: string,
  grade: string | number,
  subject: string,
): Promise<{ subject: string; chapter: string }[]> {
  try {
    const colRef = collection(db, 'users', uid, 'summaries');
    const qy = query(
      colRef,
      where('curriculum', '==', String(curriculum).toUpperCase()),
      where('grade', '==', String(grade)),
      where('subject', '==', String(subject)),
      orderBy('generatedAt', 'desc'),
      limit(5),
    );
    const snap = await getDocs(qy);
    const seen = new Set<string>();
    const picks: { subject: string; chapter: string }[] = [];
    snap.forEach((d) => {
      const s = d.data() as any;
      const subj = String(s?.subject ?? subject);
      const chapter = String(s?.chapter ?? '').trim() || '1';
      const key = `${subj}|${chapter}`;
      if (!seen.has(key)) {
        seen.add(key);
        picks.push({ subject: subj, chapter });
      }
    });
    return picks.slice(0, 2);
  } catch {
    return [];
  }
}

// —— Weak areas from results, curriculum-aware
async function pickWeakAreas(
  uid: string,
  curriculum: string,
  grade: string | number,
  subject: string,
): Promise<{ subject: string; chapter: string; topic: string; score: number }[]> {
  try {
    const colRef = collection(db, 'users', uid, 'results');
    const qy = query(
      colRef,
      where('curriculum', '==', String(curriculum).toUpperCase()),
      where('grade', '==', String(grade)),
      where('subject', '==', String(subject)),
      orderBy('createdAt', 'desc'),
      limit(5),
    );
    const snap = await getDocs(qy);

    const lows: { subject: string; chapter: string; topic: string; score: number }[] = [];

    snap.forEach((d) => {
      const r = d.data() as any;
      const subj = String(r?.subject ?? subject);
      const chapter = String(r?.chapter ?? '').trim() || '1';
      const overall = typeof r?.score === 'number' ? r.score : undefined;

      if (Array.isArray(r?.breakdown) && r.breakdown.length) {
        r.breakdown.forEach((b: any) => {
          const topic = String(b?.topic ?? 'Topic').trim() || 'Topic';
          const score = typeof b?.score === 'number' ? b.score : 0;
          if (score <= 65) lows.push({ subject: subj, chapter, topic, score });
        });
      } else if (typeof overall === 'number' && overall <= 60) {
        lows.push({ subject: subj, chapter, topic: `Chapter ${chapter}`, score: overall });
      }
    });

    lows.sort((a, b) => a.score - b.score);
    return lows.slice(0, 2);
  } catch {
    return [];
  }
}

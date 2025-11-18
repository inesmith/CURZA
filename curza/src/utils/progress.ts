// src/utils/progress.ts
import { db } from '../../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
  collection,
  addDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const slug = (s: string) =>
  String(s || 'default')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'default';

export type ProgressType = 'summary' | 'chapter' | 'test';

/**
 * Increment progress for a specific subject (and keep global in sync).
 */
export async function incWithContext(
  curriculum: string,
  grade: string | number,
  subject: string,
  type: ProgressType,
  amount = 1,
) {
  const user = getAuth().currentUser;
  if (!user) return;

  const subjectSlug = slug(subject);

  const field =
    type === 'summary'
      ? 'summariesStudied'
      : type === 'chapter'
      ? 'chaptersCovered'
      : 'testsCompleted';

  // Subject-scoped progress doc
  const ref = doc(db, 'users', user.uid, 'progressBySubject', subjectSlug);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      curriculum: String(curriculum).toUpperCase(),
      grade,
      subject,
      summariesStudied: 0,
      chaptersCovered: 0,
      testsCompleted: 0,
      updatedAt: serverTimestamp(),
    });
  }
  await updateDoc(ref, {
    [field]: increment(amount),
    updatedAt: serverTimestamp(),
  });

  // Global fallback doc (kept in sync for legacy UI)
  const gRef = doc(db, 'users', user.uid, 'progress', 'default');
  const gSnap = await getDoc(gRef);
  if (!gSnap.exists()) {
    await setDoc(gRef, {
      summariesStudied: 0,
      chaptersCovered: 0,
      testsCompleted: 0,
      updatedAt: serverTimestamp(),
    });
  }
  await updateDoc(gRef, {
    [field]: increment(amount),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Convenience shorthands (used elsewhere in your app)
 */
export async function incSummariesStudied() {
  const user = getAuth().currentUser;
  if (!user) return;
  const ref = doc(db, 'users', user.uid, 'progress', 'default');
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      summariesStudied: 0,
      chaptersCovered: 0,
      testsCompleted: 0,
      updatedAt: serverTimestamp(),
    });
  }
  await updateDoc(ref, { summariesStudied: increment(1), updatedAt: serverTimestamp() });
}

export async function incChaptersCovered() {
  const user = getAuth().currentUser;
  if (!user) return;
  const ref = doc(db, 'users', user.uid, 'progress', 'default');
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      summariesStudied: 0,
      chaptersCovered: 0,
      testsCompleted: 0,
      updatedAt: serverTimestamp(),
    });
  }
  await updateDoc(ref, { chaptersCovered: increment(1), updatedAt: serverTimestamp() });
}

export async function incTestsCompleted() {
  const user = getAuth().currentUser;
  if (!user) return;
  const ref = doc(db, 'users', user.uid, 'progress', 'default');
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      summariesStudied: 0,
      chaptersCovered: 0,
      testsCompleted: 0,
      updatedAt: serverTimestamp(),
    });
  }
  await updateDoc(ref, { testsCompleted: increment(1), updatedAt: serverTimestamp() });
}

/* ------------------------------------------------------------------ */
/* 🔵 NEW: Activity logging helpers for Recent Activities on dashboard */
/* ------------------------------------------------------------------ */

type SummaryActivityOpts = {
  curriculum?: string;
  grade?: string | number;
  subject: string;
  chapter: string | number;
  chapterName?: string;
};

/**
 * Log that a summary was studied for a specific chapter.
 * Writes to: users/{uid}/summaries
 * Dashboard uses this for "SUMMARY STUDIED – <chapter name> • <date>".
 */
export async function logSummaryStudied(opts: SummaryActivityOpts) {
  const user = getAuth().currentUser;
  if (!user) return;

  const subj = opts.subject || 'Unknown subject';
  const ch = String(opts.chapter ?? '1').trim();

  const colRef = collection(db, 'users', user.uid, 'summaries');
  await addDoc(colRef, {
    subject: subj,
    chapter: ch,
    chapterName: opts.chapterName ?? null,
    curriculum: opts.curriculum ?? null,
    grade: opts.grade ?? null,
    generatedAt: serverTimestamp(),
  });
}

/**
 * Log that a chapter was marked as revised.
 * Writes to: users/{uid}/chaptersProgress
 * Dashboard uses this for "CHAPTER MARKED AS REVISED – <chapter name> • <date>".
 */
export async function logChapterRevised(opts: SummaryActivityOpts) {
  const user = getAuth().currentUser;
  if (!user) return;

  const subj = opts.subject || 'Unknown subject';
  const ch = String(opts.chapter ?? '1').trim();

  const colRef = collection(db, 'users', user.uid, 'chaptersProgress');
  await addDoc(colRef, {
    subject: subj,
    chapter: ch,
    chapterName: opts.chapterName ?? null,
    curriculum: opts.curriculum ?? null,
    grade: opts.grade ?? null,
    status: 'revised',
    updatedAt: serverTimestamp(),
  });
}

type TestActivityOpts = {
  subject: string;
  paper: string;              // test name / paper name / section name
  score: number;              // percentage
  totalMarks?: number | null;
  curriculum?: string | null;
  grade?: string | number | null;
};

/**
 * Log that a test was completed with a mark.
 * Writes to: users/{uid}/results
 * Dashboard uses this for "TEST COMPLETED – <paper> • <date>" + mark on the right.
 */
export async function logTestCompleted(opts: TestActivityOpts) {
  const user = getAuth().currentUser;
  if (!user) return;

  let scoreNum = typeof opts.score === 'number'
    ? opts.score
    : Number(opts.score);

  if (!Number.isFinite(scoreNum)) {
    scoreNum = 0;
  }

  const colRef = collection(db, 'users', user.uid, 'results');
  await addDoc(colRef, {
    subject: opts.subject || 'Unknown subject',
    paper: opts.paper || 'TEST',
    score: scoreNum,
    totalMarks: opts.totalMarks ?? null,
    curriculum: opts.curriculum ?? null,
    grade: opts.grade ?? null,
    createdAt: serverTimestamp(),
  });
}

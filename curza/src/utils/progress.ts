// src/utils/progress.ts
import { db } from '../../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
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
 * Convenience shorthands (optional; used elsewhere in your app)
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

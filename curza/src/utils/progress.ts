// src/utils/progress.ts
import { db, auth } from '../../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment as fbIncrement,
  serverTimestamp,
} from 'firebase/firestore';

export type ProgressKey = 'summariesStudied' | 'chaptersCovered' | 'testsCompleted';

/** Build a curriculum-aware doc id, e.g. "CAPS_12_Mathematics" */
export function makeProgressDocId(curriculum: string, grade: string | number, subject: string) {
  const c = String(curriculum || '').trim().toUpperCase();
  const g = String(grade || '').trim();
  const s = String(subject || '').trim();
  return `${c}_${g}_${s}`;
}

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No signed-in user');
  return uid;
}

/** Get ref to users/{uid}/progress/{docId} */
export function getProgressRef(uid: string, docId: string) {
  return doc(db, 'users', uid, 'progress', docId);
}

/** Ensure a progress doc exists for a given docId (curriculum+grade+subject) */
export async function ensureProgressDoc(uid: string, docId = 'default') {
  const ref = getProgressRef(uid, docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      summariesStudied: 0,
      chaptersCovered: 0,
      testsCompleted: 0,
      createdAt: serverTimestamp(),
      key: docId,
    });
  }
}

/** Increment a single counter on a specific progress doc */
export async function incrementProgressOnDoc(
  uid: string,
  docId: string,
  key: ProgressKey,
  by = 1,
) {
  const ref = getProgressRef(uid, docId);
  await updateDoc(ref, { [key]: fbIncrement(by) });
}

/** Back-compat: increment on 'default' (kept to avoid breaking older screens) */
export async function incrementProgress(uid: string, key: ProgressKey, by = 1) {
  await incrementProgressOnDoc(uid, 'default', key, by);
}

/** Convenience helpers that read current user and increment 'default' */
export async function incSummariesStudied(by = 1) {
  const uid = requireUid();
  await incrementProgress(uid, 'summariesStudied', by);
}
export async function incChaptersCovered(by = 1) {
  const uid = requireUid();
  await incrementProgress(uid, 'chaptersCovered', by);
}
export async function incTestsCompleted(by = 1) {
  const uid = requireUid();
  await incrementProgress(uid, 'testsCompleted', by);
}

/** New: curriculum-aware helpers (use these when you have c/g/s context) */
export async function incWithContext(
  curriculum: string,
  grade: string | number,
  subject: string,
  key: ProgressKey,
  by = 1,
) {
  const uid = requireUid();
  const docId = makeProgressDocId(curriculum, grade, subject);
  await ensureProgressDoc(uid, docId);
  await incrementProgressOnDoc(uid, docId, key, by);
}

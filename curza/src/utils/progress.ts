// src/utils/progress.ts
import { auth, db } from '../../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';

async function ensure(uid?: string) {
  const userId = uid || auth.currentUser?.uid;
  if (!userId) throw new Error('Not signed in');

  const ref = doc(db, 'users', userId, 'progress', 'default');
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      summariesStudied: 0,
      chaptersCovered: 0,
      testsCompleted: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  return ref;
}

export async function incSummariesStudied(uid?: string) {
  const ref = await ensure(uid);
  await updateDoc(ref, {
    summariesStudied: increment(1),
    updatedAt: serverTimestamp(),
  });
}

export async function incChaptersCovered(uid?: string) {
  const ref = await ensure(uid);
  await updateDoc(ref, {
    chaptersCovered: increment(1),
    updatedAt: serverTimestamp(),
  });
}

export async function incTestsCompleted(uid?: string) {
  const ref = await ensure(uid);
  await updateDoc(ref, {
    testsCompleted: increment(1),
    updatedAt: serverTimestamp(),
  });
}
export function incWithContext(curriculum: string, grade: string | number, subject: string, progressType: string, arg4: number) {
    throw new Error('Function not implemented.');
}


// src/utils/suggestions.ts
import { db } from '../../firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { incWithContext } from './progress';

type SuggestionInput = {
  text: string;
  source?: string; // 'ai' | 'system' | ...
  progressType?: 'summary' | 'chapter' | 'test';
  curriculum?: string | null;
  grade?: string | number | null;
  subject?: string | null;
  chapter?: string | number | null;
  dayKey?: string | null;
};

export type SuggestedTodo = SuggestionInput & {
  id: string;
  createdAt?: any;
};

/**
 * Subscribe to a user's suggested todos (live).
 */
export function subscribeSuggestedTodos(
  uid: string,
  onItems: (items: SuggestedTodo[]) => void,
): () => void {
  const col = collection(db, 'users', uid, 'suggestedTodos');
  const qy = query(col, orderBy('createdAt', 'desc'));
  return onSnapshot(
    qy,
    (snap) => {
      const list: SuggestedTodo[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({
          id: d.id,
          text: String(data.text ?? ''),
          source: data.source ?? 'system',
          progressType: data.progressType ?? undefined,
          curriculum: data.curriculum ?? null,
          grade: data.grade ?? null,
          subject: data.subject ?? null,
          chapter: data.chapter ?? null,
          dayKey: data.dayKey ?? null,
          createdAt: data.createdAt,
        });
      });
      onItems(list);
    },
    () => onItems([]),
  );
}

/**
 * Refresh today's suggestions for a specific curriculum/grade/subject.
 * (Idempotent best-effort – safe to call whenever you land on the dashboard.)
 */
export async function refreshSuggestedTodos(
  uid: string,
  ctx: { curriculum?: string; grade?: string | number; subject?: string },
) {
  const col = collection(db, 'users', uid, 'suggestedTodos');

  // We'll ensure at least a couple suggestions exist for the day.
  // Use a stable document to avoid duplicates.
  const dayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const ensure = async (id: string, data: SuggestionInput) => {
    const ref = doc(db, 'users', uid, 'suggestedTodos', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        dayKey,
      });
    }
  };

  await ensure(`revise-${dayKey}`, {
    text: `REVISE A CHAPTER IN ${String(ctx.subject || 'YOUR SUBJECT').toUpperCase()}`,
    source: 'system',
    progressType: 'chapter',
    curriculum: ctx.curriculum ?? null,
    grade: ctx.grade ?? null,
    subject: ctx.subject ?? null,
    chapter: null,
    dayKey,
  });

  await ensure(`summary-${dayKey}`, {
    text: `READ A SUMMARY FOR ${String(ctx.subject || 'YOUR SUBJECT').toUpperCase()}`,
    source: 'system',
    progressType: 'summary',
    curriculum: ctx.curriculum ?? null,
    grade: ctx.grade ?? null,
    subject: ctx.subject ?? null,
    chapter: null,
    dayKey,
  });
}

/**
 * Apply a suggested todo:
 *  - copies the suggestion into real todos
 *  - increments subject-specific progress (when context present)
 *  - removes the suggestion doc
 */
export async function applySuggestedTodo(uid: string, suggestionId: string) {
  const sRef = doc(db, 'users', uid, 'suggestedTodos', suggestionId);
  const snap = await getDoc(sRef);
  if (!snap.exists()) return;

  const data = snap.data() as SuggestionInput;

  // 1) move into /todos
  const todosCol = collection(db, 'users', uid, 'todos');
  await addDoc(todosCol, {
    text: String(data.text || '').toUpperCase(),
    createdAt: serverTimestamp(),
    completed: false,
    meta: {
      fromSuggestion: true,
      source: data.source ?? 'system',
      progressType: data.progressType ?? null,
      curriculum: data.curriculum ?? null,
      grade: data.grade ?? null,
      subject: data.subject ?? null,
      chapter: data.chapter ?? null,
      dayKey: data.dayKey ?? null,
    },
  });

  // 2) increment progress for the subject if we have context
  if (data.curriculum && data.grade != null && data.subject && data.progressType) {
    try {
      await incWithContext(
        data.curriculum,
        data.grade,
        data.subject,
        data.progressType,
        1,
      );
    } catch {
      // ignore progress errors
    }
  }

  // 3) remove the suggestion
  await deleteDoc(sRef).catch(() => {});
}

/**
 * Delete a suggestion without applying it.
 */
export async function removeSuggestedTodo(uid: string, suggestionId: string) {
  const sRef = doc(db, 'users', uid, 'suggestedTodos', suggestionId);
  await deleteDoc(sRef);
}

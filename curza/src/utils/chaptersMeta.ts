import { getFunctions, httpsCallable } from "firebase/functions";
import { ensureAuthReady } from "./ensureAuthReady";
import { app } from "../../firebase"; // keep your existing export

type Meta = { total: number; names: Record<string, string> };

export async function getChaptersMeta(params: {
  curriculum: string;
  grade: string | number;
  subject: string;
}): Promise<Meta> {
  await ensureAuthReady();
  const functions = getFunctions(app, "us-central1");
  const fn = httpsCallable<any, Meta>(functions, "chaptersMeta");
  const res = await fn(params);
  return (res && (res.data as Meta)) || { total: 0, names: {} };
}

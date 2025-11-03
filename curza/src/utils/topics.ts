import { getFunctions, httpsCallable } from "firebase/functions";
import { ensureAuthReady } from "./ensureAuthReady";
import { app } from "../../firebase";

export type TopicSection = {
  name: string;
  keyConcepts: string[];
  formulas: string[];
  exampleSteps: string[];
  tips: string[];
};

export async function getTopicsForChapter(params: {
  curriculum: string;
  grade: string | number;
  subject: string;
  chapterNumber: string | number;
  chapterName?: string;
}): Promise<TopicSection[]> {
  await ensureAuthReady();
  const functions = getFunctions(app, "us-central1");
  const fn = httpsCallable<any, { topics: TopicSection[] }>(functions, "chapterTopics");
  const res = await fn(params);
  return (res?.data?.topics as TopicSection[]) || [];
}

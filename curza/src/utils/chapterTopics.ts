// src/utils/chapterTopics.ts
import { httpsCallable, getFunctions } from "firebase/functions";
import { app } from "../../firebase"; // adjust if you export app from firebase.ts

export type TopicSection = {
  title: string;
  keyConcepts: string[];
  formulas: string[];
  exampleSteps: string[];
  tips: string[];
};

export async function getTopicsForChapter(params: {
  curriculum: string;
  grade: string | number;
  subject: string;
  chapter: string | number;
  chapterName?: string;
}): Promise<TopicSection[]> {
  try {
    const fn = httpsCallable(getFunctions(app), "chapterTopics");
    const res = await fn(params);
    const data = (res?.data as any) || {};
    const topics: TopicSection[] = Array.isArray(data.topics) ? data.topics : [];
    return topics;
  } catch (e) {
    console.log("getTopicsForChapter failed:", e);
    return [];
  }
}

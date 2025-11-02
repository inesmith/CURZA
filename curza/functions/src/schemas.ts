import { z } from "zod";

export const Option = z.object({
  id: z.string(),            // "A" | "B" | "C" | "D"
  text: z.string()
});

export const Question = z.object({
  qid: z.string(),
  prompt: z.string(),
  options: z.array(Option).length(4),
  correctId: z.string(),     // one of the option ids
  concept: z.string()        // e.g., "isolating variables"
});

export const Quiz = z.object({
  topic: z.string(),
  grade: z.string().optional(),
  questions: z.array(Question).min(3).max(20)
});

export const Answers = z.object({
  items: z.array(z.object({ qid: z.string(), id: z.string() }))
});

export const Scored = z.object({
  score: z.number().int(),
  total: z.number().int(),
  items: z.array(z.object({
    qid: z.string(),
    isCorrect: z.boolean(),
    correctId: z.string(),
    explanation: z.string().min(1),
    tip: z.string().optional()
  })),
  weakAreas: z.array(z.string()).default([])
});

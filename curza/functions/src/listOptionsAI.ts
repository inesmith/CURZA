// functions/src/listOptionsAI.ts
import * as functions from "firebase-functions/v1";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Cloud Function: listOptionsAI
 * Dynamically generates Mathematics topics and exam paper names
 * aligned with the given curriculum and grade.
 *
 * Used in two ways:
 * - type: "topics"  (+ optional chapter/chapterName) → topic titles
 * - type: "papers"  → exam paper names
 */
export const listOptionsAI = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    // Optional auth check — prevents unauthenticated calls
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to use this feature."
      );
    }

    const {
      type = "topics",
      curriculum = "CAPS",
      grade = "12",
      subject = "Mathematics",
      chapter,
      chapterName,
    } = data || {};

    let prompt: string;

    if (type === "topics" && chapter) {
      // ✅ Chapter-specific subtopics (used by getTopicsForChapter fallback)
      prompt = `
        You are an expert South African ${subject} curriculum designer.

        Curriculum: ${curriculum}
        Grade: ${grade}
        Subject: ${subject}
        Chapter: ${chapter}${chapterName ? ` - ${chapterName}` : ""}

        List 3–8 key subtopics INSIDE THIS CHAPTER only (not the whole year).
        Use short, conventional topic names that a Grade ${grade} learner would recognise.

        Return the data in strict JSON with this structure:
        {
          "topics": ["Topic 1", "Topic 2", "..."]
        }
      `;
    } else if (type === "papers") {
      // Exam papers (keeps previous behaviour, used by getPaperListAI)
      prompt = `
        You are an expert South African ${subject} curriculum designer.

        Curriculum: ${curriculum}
        Grade: ${grade}

        List the exam papers a learner would typically write in this subject
        (e.g. "Paper 1: Algebra and Calculus", "Paper 2: Geometry and Probability").

        Return the data in strict JSON with this structure:
        {
          "papers": ["Paper 1 name", "Paper 2 name", "..."]
        }
      `;
    } else {
      // Generic subject-wide topics (previous behaviour when no chapter is given)
      prompt = `
        You are an expert South African ${subject} curriculum designer.

        Curriculum: ${curriculum}
        Grade: ${grade}

        List the key topics a learner would encounter in this subject.

        Return the data in strict JSON with this structure:
        {
          "topics": ["Topic 1", "Topic 2", "..."]
        }
      `;
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You generate structured data for an education app." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      });

      const text = response.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(text);

      return {
        topics: parsed.topics || [],
        papers: parsed.papers || [],
        // helpful for generic consumers (like getTopicsForChapter)
        items: parsed.topics || parsed.papers || [],
      };
    } catch (err: any) {
      console.error("listOptionsAI error:", err);
      throw new functions.https.HttpsError(
        "internal",
        err.message || "Failed to generate list."
      );
    }
  });

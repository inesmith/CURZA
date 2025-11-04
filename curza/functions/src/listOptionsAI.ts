import * as functions from "firebase-functions/v1";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Cloud Function: listOptionsAI
 * Dynamically generates Mathematics topics and exam paper names
 * aligned with the given curriculum and grade.
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

    const { curriculum = "CAPS", grade = "12", subject = "Mathematics" } = data;

    try {
      const prompt = `
        You are an expert South African Mathematics curriculum designer.
        Based on the ${curriculum} curriculum for Grade ${grade}, 
        list the key topics and exam papers a learner would encounter.

        Return the data in strict JSON with this structure:
        {
          "topics": ["Topic 1", "Topic 2", ...],
          "papers": ["Paper 1", "Paper 2", ...]
        }
      `;

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
      };
    } catch (err: any) {
      console.error("listOptionsAI error:", err);
      throw new functions.https.HttpsError(
        "internal",
        err.message || "Failed to generate list."
      );
    }
  });

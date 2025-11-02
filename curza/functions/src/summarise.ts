// functions/src/summarize.ts
import * as functions from "firebase-functions/v2/https";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: "***REMOVED***" });

export const summarize = functions.onCall<{topic:string; grade?:string}>(
  async (req) => {
    const { topic, grade = "" } = req.data;

    const schema = {
      type: "object",
      required: ["title","overview","keyConcepts","formulas","workedExample","tips"],
      properties: {
        title: { type: "string" },
        overview: { type: "string" },
        keyConcepts: { type: "array", items: { type: "string" }, minItems: 3 },
        formulas: { type: "array", items: { type: "object",
          required: ["name","expr","note"],
          properties: { name:{type:"string"}, expr:{type:"string"}, note:{type:"string"} }
        }},
        workedExample: { type: "object",
          required: ["problem","steps","answer"],
          properties: {
            problem:{type:"string"},
            steps:{type:"array", items:{type:"string"}},
            answer:{type:"string"}
          }
        },
        tips: { type: "array", items: { type: "string" }, minItems: 3 }
      }
    };

    const prompt = `
You are a clear, student-friendly math explainer.
Make a concise summary for "${topic}" ${grade ? "(grade "+grade+")" : ""}.
Keep it practical and readable on mobile.`;

    // Ask the model to output only JSON matching the schema and call the SDK with supported properties
    const res = await openai.responses.create({
      model: "o3-mini",
      input: `${prompt}\n\nPlease return ONLY valid JSON that conforms to the following schema (no extra text): ${JSON.stringify(schema)}`
    });

    const json = res.output_text || "";
    return JSON.parse(json);
  }
);

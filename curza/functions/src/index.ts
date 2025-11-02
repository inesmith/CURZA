import * as functions from "firebase-functions/v2/https";
import { openai, MODEL } from "./openai";
import { Quiz, Answers, Scored } from "./schemas";

// Helper to call Structured Outputs
async function structuredJSON<T>(schema: object, prompt: string): Promise<T> {
  const res = await openai.responses.create({
    model: MODEL,
    input: prompt,
    // @ts-ignore: response_format is not yet in the SDK typings
    response_format: { type: "json_schema", json_schema: { name: "schema", schema } }
  });
  const txt = res.output_text || (res.output as any)?.[0]?.content?.[0]?.text || "";
  return JSON.parse(txt) as T;
}

// 1) CREATE TEST
export const createTest = functions.onCall<{topic:string; grade?:string; numQuestions?:number}>(
  async (req) => {
    const { topic, grade = "", numQuestions = 10 } = req.data;
    const schema = {
      type: "object",
      properties: {
        topic: { type: "string" },
        grade: { type: "string" },
        questions: {
          type: "array",
          minItems: numQuestions,
          maxItems: numQuestions,
          items: {
            type: "object",
            required: ["qid","prompt","options","correctId","concept"],
            properties: {
              qid: { type: "string" },
              prompt: { type: "string" },
              options: {
                type: "array",
                minItems: 4,
                maxItems: 4,
                items: {
                  type: "object",
                  required: ["id","text"],
                  properties: {
                    id: { type: "string", enum: ["A","B","C","D"] },
                    text: { type: "string" }
                  }
                }
              },
              correctId: { type: "string", enum: ["A","B","C","D"] },
              concept: { type: "string" }
            }
          }
        }
      },
      required: ["topic","questions"]
    };

    const sys = `You are a tutor generating rigorous, grade-appropriate multiple-choice questions.
Each question must be clear, unambiguous, and solvable without a calculator unless stated.`;
    const user = `Create ${numQuestions} questions on "${topic}" ${grade ? "for grade "+grade : ""}.
Constrain to 4 options A–D, single correct answer. Include concept tags.`;

    const result = await structuredJSON<any>(schema, `${sys}\n\n${user}`);
    return result; // already matches schema
  }
);

// 2) SCORE TEST
export const scoreTest = functions.onCall<{questions:any[]; answers:{items:{qid:string,id:string}[]}}>(
  async (req) => {
    const { questions, answers } = req.data;

    const schema = {
      type: "object",
      properties: {
        score: { type: "integer" },
        total: { type: "integer" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              qid: { type: "string" },
              isCorrect: { type: "boolean" },
              correctId: { type: "string" },
              explanation: { type: "string" },
              tip: { type: "string" }
            },
            required: ["qid","isCorrect","correctId","explanation"]
          }
        },
        weakAreas: { type: "array", items: { type: "string" } }
      },
      required: ["score","total","items"]
    };

    const prompt = `Given the questions and the learner's answers, return scored results.
Explain briefly (1–2 sentences) why the correct answer is correct and what to fix when wrong.
Aggregate weakAreas from missed concepts. Keep explanations student-friendly.  

Questions JSON:
${JSON.stringify(questions).slice(0, 40000)}

Answers JSON:
${JSON.stringify(answers).slice(0, 40000)}
`;

    const scored = await structuredJSON<any>(schema, prompt);
    return scored;
  }
);


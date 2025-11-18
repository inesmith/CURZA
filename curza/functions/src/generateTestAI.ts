// functions/src/generateTestAI.ts
import { onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import OpenAI from 'openai';

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');

type Part = {
  label?: string;
  text?: string;
  marks?: number;
  type?: string;
  options?: { id: string; text: string }[];
};

type Block =
  | {
      type: 'section';
      title?: string;
      instructions?: string;
      marks?: number | null;
    }
  | {
      type: 'question';
      number?: string | number;
      prompt?: string;
      marks?: number;
      parts?: Part[];
      resources?: any;
    }
  | Record<string, any>;

interface GenerateRequest {
  subject: string;
  title: string;
  totalMarks: number;
  blocks: Block[];
  difficulty?: 'easy' | 'medium' | 'hard';
  seed?: number;
  grade?: number | string;
  paper?: string; // "paper1" | "paper2" etc.
}

interface GenerateResponse {
  blocks: Block[];
  totalMarks: number;
}

// -------- helpers to keep marks consistent -------------------------

const fixQuestionParts = (q: any): any => {
  if (!Array.isArray(q.parts) || q.parts.length === 0) return q;

  const target = Number(q.marks || 0);
  const sum = q.parts.reduce(
    (a: number, p: any) => a + Number(p?.marks || 0),
    0
  );

  if (!target || sum === target) return q;

  let running = 0;
  const scaled = q.parts.map((p: any, i: number) => {
    if (i === q.parts.length - 1) {
      return { ...p, marks: Math.max(1, target - running) };
    }
    const val = Math.max(
      1,
      Math.round((Number(p.marks || 0) / Math.max(1, sum)) * target)
    );
    running += val;
    return { ...p, marks: val };
  });

  return { ...q, parts: scaled };
};

const reconcileMarks = (blocks: Block[], total: number): Block[] => {
  const questions = blocks.filter(
    (b: any) => b?.type === 'question'
  ) as any[];

  const qSum = questions.reduce(
    (a: number, q: any) => a + Number(q.marks || 0),
    0
  );

  let out = blocks.map((b: any) =>
    b?.type === 'question' ? fixQuestionParts(b) : b
  );

  if (!total || qSum === total) return out;

  const factor = total / Math.max(1, qSum);
  let running = 0;

  out = out.map((b: any, idx: number) => {
    if (b?.type !== 'question') return b;

    const q = { ...b };
    const isLast =
      questions[questions.length - 1]?.number === q.number ||
      idx === out.length - 1;

    if (isLast) {
      q.marks = Math.max(1, total - running);
    } else {
      q.marks = Math.max(
        1,
        Math.round(Number(q.marks || 0) * factor)
      );
      running += q.marks;
    }

    return fixQuestionParts(q);
  });

  return out;
};

// ----------------- MAIN FUNCTION -----------------------------------

export const generateTestAI = onCall<GenerateRequest, GenerateResponse>(
  {
    region: 'us-central1',
    invoker: 'public',
    cors: true,
    enforceAppCheck: false,
    secrets: [OPENAI_API_KEY],
  },
  (async (req: { data: GenerateRequest }): Promise<GenerateResponse> => {
    const {
      subject,
      title,
      totalMarks,
      blocks,
      difficulty = 'medium',
      grade,
      paper,
      seed,
    } = req.data || {};

    if (!subject || !title || !Array.isArray(blocks) || !totalMarks) {
      throw new Error(
        'Missing subject/title/totalMarks/blocks in generateTestAI.'
      );
    }

    const client = new OpenAI({
      apiKey: OPENAI_API_KEY.value(),
    });

    const capsLevel =
      typeof grade === 'number'
        ? grade
        : Number(grade ?? 12) || 12;

    const paperLabel =
      (paper || '')
        .toString()
        .toLowerCase()
        .includes('2')
        ? 'Paper 2'
        : 'Paper 1';

    // ------------ PROMPTS: this is the important part --------------

    const system = `
You are a South African CAPS Mathematics exam generator.

You are given a BLUEPRINT of an exam: sections, question numbers, marks and short skill descriptions.
Your job is to turn this into a REAL exam paper with EXPLICIT questions.

CURRICULUM / LEVEL:
- CAPS Mathematics, Grade ${capsLevel}, ${paperLabel}.
- Subject: ${subject}.

STRUCTURE RULES (DO NOT BREAK THESE):
- Keep the SAME structure as the blueprint:
  • same sections in the same order
  • same questions and numbers
  • same parts and labels
  • same marks for each question and each part
- Do NOT change section titles, question numbers, or marks.

QUESTION RULES (VERY IMPORTANT):
- For EVERY question and EVERY part:
  • Replace the vague description text with a FULL exam-style question.
  • The text must contain concrete mathematical content:
    - explicit numbers (e.g. 3, 5, 10)
    - algebraic expressions (e.g. 2x² - 5x + 3)
    - equations or inequalities (e.g. 2(3x - 1) = 5x + 7)
    - function definitions (e.g. f(x) = x² - 4x - 5)
  • Example style:
      "Simplify: 3x² - 5x + 2 - (x² - 4x - 1)."
      "Solve for x: 2(3x - 1) = 5x + 7."
      "Given f(x) = x² - 4x - 5, find the coordinates of the turning point."
- DO NOT leave generic descriptions like:
    "Simplify and factorise algebraic expressions."
    "Work with arithmetic or geometric sequences."
    "Apply algebra in a contextual or word problem."
  These MUST be replaced with proper, specific questions.

DIFFICULTY / VARIATION:
- Make sure each question is solvable at Grade ${capsLevel} level and fits CAPS topics for ${paperLabel}.
- Every time this function is called, use DIFFERENT numbers or contexts, even if the blueprint is the same.

OUTPUT FORMAT (CRITICAL):
- Return ONLY a JSON object with this shape:
  {
    "blocks": [ ... ]
  }
- Each block must have the same structure as the blueprint:
  - sections keep title + instructions
  - questions keep number, marks, parts, etc.
- part.text MUST be the full question text with explicit numbers/symbols.
- No additional fields, no explanations, no LaTeX, no Markdown.
`.trim();

    const user = `
Title: ${title}
Difficulty: ${difficulty}
Total marks: ${totalMarks}
Grade: ${capsLevel}
Paper: ${paperLabel}
Random seed hint: ${seed ?? 'none'}

The following JSON is the BLUEPRINT.

Fields:
- section.instructions and question.prompt can stay as short summaries.
- part.text currently just describes the skill. You must REPLACE it with a full exam question with explicit numbers.

BLUEPRINT:
${JSON.stringify(blocks, null, 2)}
`.trim();

    let generatedBlocks: Block[] = blocks;

    try {
      // ⬇⬇⬇  IMPORTANT CHANGE: use chat.completions instead of responses.create  ⬇⬇⬇
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices?.[0]?.message?.content ?? '';
      console.log('generateTestAI OpenAI raw:', raw);

      let payload: { blocks?: Block[] } = {};
      try {
        if (raw && typeof raw === 'string') {
          payload = JSON.parse(raw);
        }
      } catch (err) {
        console.error('generateTestAI JSON parse error:', err);
      }

      if (Array.isArray(payload.blocks) && payload.blocks.length > 0) {
        generatedBlocks = payload.blocks;
      } else {
        console.warn(
          'generateTestAI: payload.blocks missing or empty, using blueprint.'
        );
      }
    } catch (err) {
      console.error('generateTestAI OpenAI error:', err);
      // fall back to blueprint if OpenAI fails
      generatedBlocks = blocks;
    }

    const fixedBlocks = reconcileMarks(generatedBlocks, totalMarks);

    return {
      blocks: fixedBlocks,
      totalMarks,
    };
  }) as any
);

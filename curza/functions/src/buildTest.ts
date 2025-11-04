import { onCall, HttpsError } from 'firebase-functions/v2/https';

/**
 * buildTest
 *  - mode: 'full' | 'section'
 *  - subject: string
 *  - grade: string | number
 *  - examType?: 'Paper 1' | 'Paper 2' | ...
 *  - topic?: string                // for section mode
 *  - count?: number                // for section mode
 *  - timed?: boolean
 *
 * Returns:
 *  {
 *    message: string,
 *    title: string,
 *    subject: string,
 *    totalMarks: number,
 *    timed?: boolean,
 *    durationSec?: number,
 *    blocks: Array<SectionBlock | QuestionBlock>
 *  }
 */

// -------- Types kept minimal & app-friendly ----------

type SectionBlock = {
  type: 'section';
  title: string;
  instructions?: string;
  marks?: number; // optional header total
};

type QuestionPart = {
  label: string;     // e.g. "(a)" or "1.1"
  marks: number;
  prompt: string;
};

type QuestionResource = {
  kind: 'image' | 'table' | 'formula';
  uri?: string;
  text?: string;
};

type QuestionBlock = {
  type: 'question';
  number: string;    // "1", "1.1", etc.
  marks: number;     // total for this question (or sub-question if using parts)
  prompt: string;
  parts?: QuestionPart[];
  resources?: QuestionResource[];
};

type TestBlock = SectionBlock | QuestionBlock;

// ------------- Helpers -----------------

const sec = (title: string, instructions?: string, marks?: number): SectionBlock => ({
  type: 'section',
  title,
  instructions,
  marks,
});

const q = (
  number: string,
  marks: number,
  prompt: string,
  parts?: QuestionPart[],
  resources?: QuestionResource[],
): QuestionBlock => ({
  type: 'question',
  number,
  marks,
  prompt,
  parts,
  resources,
});

const sumMarks = (blocks: TestBlock[]) =>
  blocks.reduce((acc, b) => acc + (b.type === 'question' ? b.marks : 0), 0);

// Simple CAPS Paper 1 skeleton for Grade 12 Mathematics (adjust later as needed)
function buildCapsMathsG12Paper1(): { title: string; blocks: TestBlock[]; totalMarks: number } {
  const title = 'Mathematics Paper 1';
  const blocks: TestBlock[] = [];

  // Section A — Algebra and Patterns (example structure)
  blocks.push(
    sec('SECTION A: ALGEBRA & PATTERNS', 'Answer ALL questions in this section. Show all working.')
  );

  blocks.push(
    q('1', 20,
      'Simplify and solve where applicable.',
      [
        { label: '(a)', marks: 6, prompt: 'Simplify: (2x^2y^-1) · (3x^-1y^3) ÷ (6xy).' },
        { label: '(b)', marks: 6, prompt: 'Solve for x: 3x^2 - 7x - 6 = 0.' },
        { label: '(c)', marks: 8, prompt: 'Given f(x) = ax^2 + bx + c with f(1)=0, f(2)=3, f(-1)=-3. Determine a, b, c.' },
      ])
  );

  blocks.push(
    q('2', 15,
      'Number patterns and sequences.',
      [
        { label: '(a)', marks: 7, prompt: 'Given a_n = 3n^2 - 5n. Find the 10th term and the general difference Δa_n.' },
        { label: '(b)', marks: 8, prompt: 'A geometric series has first term 6 and common ratio r. The sum of the first 5 terms is 186. Find r.' },
      ])
  );

  // Section B — Functions & Graphs
  blocks.push(
    sec('SECTION B: FUNCTIONS & GRAPHS', 'Sketch neatly. Indicate intercepts and asymptotes where relevant.')
  );

  blocks.push(
    q('3', 20,
      'Consider f(x) = x^2 - 4x - 5 and g(x) = 2x - 3.',
      [
        { label: '(a)', marks: 6, prompt: 'Find the coordinates of the turning point of f and the intercepts with axes.' },
        { label: '(b)', marks: 8, prompt: 'Solve f(x) = g(x). Hence, determine points of intersection.' },
        { label: '(c)', marks: 6, prompt: 'Sketch f and g on the same set of axes and shade the region where f(x) ≥ g(x).' },
      ])
  );

  // Section C — Calculus (Differentiation & Intro Integration)
  blocks.push(
    sec('SECTION C: CALCULUS', 'Unless stated otherwise, use first principles only when requested.')
  );

  blocks.push(
    q('4', 25,
      'Differentiation and applications.',
      [
        { label: '(a)', marks: 7, prompt: 'Differentiate with respect to x: h(x) = 3x^3 - 5x^2 + 7x - 2.' },
        { label: '(b)', marks: 8, prompt: 'Find the equation of the tangent to y = x^3 - 4x at x = 2.' },
        { label: '(c)', marks: 10, prompt: 'A rectangle has perimeter 40. Express area A in terms of x and determine dimensions for maximum area.' },
      ])
  );

  // Section D — Probability (adjust if you prefer this in Paper 2)
  blocks.push(
    sec('SECTION D: PROBABILITY', 'Give answers in simplest fractional form unless stated otherwise.')
  );

  blocks.push(
    q('5', 20,
      'Basic probability and counting principles.',
      [
        { label: '(a)', marks: 8, prompt: 'A box has 4 red, 5 blue, 3 green marbles. Two are drawn without replacement. Find P(both red).' },
        { label: '(b)', marks: 12, prompt: 'How many 5-digit codes can be formed from digits 0–9 if repetition is allowed and the code must be odd?' },
      ])
  );

  const total = sumMarks(blocks); // 100
  return { title, blocks, totalMarks: total };
}

// Topic-based section test (count × 5 marks default)
function buildSectionTest(subject: string, grade: string | number, topic: string, count = 10, timed?: boolean) {
  const title = `${subject} • ${topic}`;
  const blocks: TestBlock[] = [];

  blocks.push(
    sec(`TOPIC TEST: ${topic}`, 'Answer all questions. Show working where applicable.')
  );

  for (let i = 1; i <= count; i++) {
    blocks.push(
      q(
        String(i),
        5,
        `Question ${i} on ${topic}. Provide a complete solution.`
      )
    );
  }

  const totalMarks = sumMarks(blocks);
  const durationSec = timed ? count * 120 : undefined; // 2 min per question
  return {
    message: `Generated ${count}-question section test for ${subject} (${grade})`,
    title,
    subject,
    totalMarks,
    timed: !!timed,
    durationSec,
    blocks,
  };
}

// Full exam (Paper 1 default) for CAPS Grade 12 Mathematics
function buildFullExam(subject: string, grade: string | number, examType = 'Paper 1', timed?: boolean) {
  const caps = buildCapsMathsG12Paper1();
  const durationSec = timed ? 3 * 60 * 60 : undefined; // default 3 hours

  return {
    message: `Generated full test for ${subject} (${grade})`,
    title: caps.title,
    subject,
    totalMarks: caps.totalMarks, // 100 with this template
    timed: !!timed,
    durationSec,
    blocks: caps.blocks,
  };
}

// ------------- Callable -----------------

export const buildTest = onCall(async (req) => {
  const data = (req.data ?? {}) as {
    mode?: 'full' | 'section';
    subject?: string;
    grade?: string | number;
    examType?: string;
    topic?: string;
    count?: number;
    timed?: boolean;
  };

  const { mode, subject, grade, examType, topic, count, timed } = data;

  if (!subject || !grade) {
    throw new HttpsError('invalid-argument', 'Both subject and grade are required.');
  }

  if (mode === 'section') {
    if (!topic) {
      throw new HttpsError('invalid-argument', 'Topic is required for section tests.');
    }
    const c = typeof count === 'number' && count > 0 ? Math.min(count, 60) : 10;
    return buildSectionTest(subject, grade, topic, c, timed);
  }

  // Default to full exam if mode is 'full' or missing
  return buildFullExam(subject, grade, examType || 'Paper 1', timed);
});

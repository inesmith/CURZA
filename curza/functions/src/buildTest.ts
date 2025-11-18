// functions/src/buildTest.ts
import { onCall } from 'firebase-functions/v2/https';

// ---------- shared types (align with app & generateTestAI) -------------

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

interface BuildTestRequest {
  subject?: string;
  grade?: number | string;
  mode?: 'full' | 'section';
  examType?: string;        // "Paper 1", "Paper 2", etc.
  topic?: string;
  count?: number;
  timed?: boolean;
  durationSec?: number | null;
}

interface BuildTestResponse {
  message?: string;
  title: string;
  subject: string;
  totalMarks: number;
  timed: boolean;
  durationSec: number | null;
  blocks: Block[];
}

// ---------- small helpers ----------------------------------------------

const toNumber = (v: any, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const normalisePaperKey = (examType?: string): 'paper1' | 'paper2' | 'paper3' => {
  const key = (examType ?? 'Paper 1').toString().toLowerCase().replace(/\s+/g, '');
  if (key.includes('2')) return 'paper2';
  if (key.includes('3')) return 'paper3';
  return 'paper1';
};

// ---------- BLUEPRINTS --------------------------------------------------

// Senior phase (Grades 8–9) – single 100-mark paper
const buildSeniorMathsPaper = (grade: number, examType: string): { blocks: Block[]; totalMarks: number } => {
  const totalMarks = 100;

  const blocks: Block[] = [
    {
      type: 'section',
      title: 'SECTION A: NUMBER, ALGEBRA & PATTERNS',
      instructions: 'Answer ALL questions in this section. Show ALL working.',
      marks: null,
    },
    {
      type: 'question',
      number: '1',
      prompt: 'Whole numbers, integers and basic algebraic manipulation.',
      marks: 25,
      parts: [
        {
          label: '(a)',
          text: 'Perform basic operations with integers and whole numbers.',
          marks: 8,
        },
        {
          label: '(b)',
          text: 'Simplify an algebraic expression in one variable.',
          marks: 8,
        },
        {
          label: '(c)',
          text: 'Solve a simple linear equation or word problem.',
          marks: 9,
        },
      ],
      resources: null,
    },
    {
      type: 'question',
      number: '2',
      prompt: 'Patterns, sequences and simple functions.',
      marks: 20,
      parts: [
        {
          label: '(a)',
          text: 'Describe and extend a numeric pattern.',
          marks: 7,
        },
        {
          label: '(b)',
          text: 'Determine a rule for a simple pattern or function table.',
          marks: 7,
        },
        {
          label: '(c)',
          text: 'Apply the rule to find a missing term or value.',
          marks: 6,
        },
      ],
      resources: null,
    },

    {
      type: 'section',
      title: 'SECTION B: GEOMETRY & MEASUREMENT',
      instructions: 'Show all construction lines and give reasons where appropriate.',
      marks: null,
    },
    {
      type: 'question',
      number: '3',
      prompt: '2D shapes, perimeter, area and basic geometry.',
      marks: 25,
      parts: [
        {
          label: '(a)',
          text: 'Work with angles in triangles or intersecting lines.',
          marks: 8,
        },
        {
          label: '(b)',
          text: 'Calculate perimeter and/or area of basic shapes.',
          marks: 8,
        },
        {
          label: '(c)',
          text: 'Solve a word problem involving measurement.',
          marks: 9,
        },
      ],
      resources: null,
    },

    {
      type: 'section',
      title: 'SECTION C: DATA HANDLING & PROBABILITY',
      instructions: 'Read all graphs carefully and give answers in simplest form.',
      marks: null,
    },
    {
      type: 'question',
      number: '4',
      prompt: 'Data handling, graphs and basic probability.',
      marks: 30,
      parts: [
        {
          label: '(a)',
          text: 'Interpret a bar graph, pie chart or line graph.',
          marks: 10,
        },
        {
          label: '(b)',
          text: 'Calculate mean, median or mode from given data.',
          marks: 10,
        },
        {
          label: '(c)',
          text: 'Answer simple probability questions from a familiar context.',
          marks: 10,
        },
      ],
      resources: null,
    },
  ];

  return { blocks, totalMarks };
};

// FET Maths Paper 1 (Grades 10–12, CAPS-style)
const buildFETMathsPaper1 = (grade: number): { blocks: Block[]; totalMarks: number } => {
  const totalMarks = 150;
  const includeCalculus = grade >= 12; // only Grade 12 has Calculus as a full section

  const blocks: Block[] = [
    {
      type: 'section',
      title: 'SECTION A: ALGEBRA & PATTERNS',
      instructions: 'Answer ALL questions in this section. Show all working.',
      marks: null,
    },
    {
      type: 'question',
      number: '1',
      prompt: 'Algebraic manipulation, factorisation and equations.',
      marks: 40,
      parts: [
        {
          label: '(a)',
          text: 'Simplify and factorise algebraic expressions.',
          marks: 12,
        },
        {
          label: '(b)',
          text: 'Solve linear and quadratic equations/inequalities.',
          marks: 14,
        },
        {
          label: '(c)',
          text: 'Apply algebra in a contextual or word problem.',
          marks: 14,
        },
      ],
      resources: null,
    },
    {
      type: 'question',
      number: '2',
      prompt: 'Number patterns, sequences and series.',
      marks: 30,
      parts: [
        {
          label: '(a)',
          text: 'Work with arithmetic or geometric sequences.',
          marks: 10,
        },
        {
          label: '(b)',
          text: 'Determine general terms and use them to solve problems.',
          marks: 10,
        },
        {
          label: '(c)',
          text: 'Apply patterns in a contextual situation.',
          marks: 10,
        },
      ],
      resources: null,
    },

    {
      type: 'section',
      title: 'SECTION B: FUNCTIONS & GRAPHS',
      instructions:
        'Sketch neatly on the provided axes. Indicate intercepts, turning points and asymptotes where relevant.',
      marks: null,
    },
    {
      type: 'question',
      number: '3',
      prompt: 'Functions, graphs and transformations.',
      marks: 40,
      parts: [
        {
          label: '(a)',
          text: 'Determine key features of given functions (domain, range, intercepts).',
          marks: 12,
        },
        {
          label: '(b)',
          text: 'Solve equations and inequalities using graphs.',
          marks: 14,
        },
        {
          label: '(c)',
          text: 'Sketch and interpret transformations of basic functions.',
          marks: 14,
        },
      ],
      resources: null,
    },
  ];

  if (includeCalculus) {
    // Grade 12 Paper 1 includes Calculus
    blocks.push(
      {
        type: 'section',
        title: 'SECTION C: CALCULUS',
        instructions: 'Use first principles only when explicitly requested.',
        marks: null,
      },
      {
        type: 'question',
        number: '4',
        prompt: 'Differentiation and applications.',
        marks: 40,
        parts: [
          {
            label: '(a)',
            text: 'Differentiate basic polynomial functions.',
            marks: 12,
          },
          {
            label: '(b)',
            text: 'Apply derivatives to tangents and rates of change.',
            marks: 14,
          },
          {
            label: '(c)',
            text: 'Solve an optimisation or maximum/minimum problem.',
            marks: 14,
          },
        ],
        resources: null,
      }
    );
  } else {
    // Grades 10–11: use Probability / Financial Maths instead of full Calculus section
    blocks.push(
      {
        type: 'section',
        title: 'SECTION C: PROBABILITY & FINANCIAL MATHEMATICS',
        instructions: 'Give answers in simplest form. Round where appropriate.',
        marks: null,
      },
      {
        type: 'question',
        number: '4',
        prompt: 'Basic probability and/or financial mathematics.',
        marks: 40,
        parts: [
          {
            label: '(a)',
            text: 'Answer questions involving simple probability rules.',
            marks: 12,
          },
          {
            label: '(b)',
            text: 'Work with interest, depreciation or growth formulae.',
            marks: 14,
          },
          {
            label: '(c)',
            text: 'Solve a contextual problem involving probability or finance.',
            marks: 14,
          },
        ],
        resources: null,
      }
    );
  }

  return { blocks, totalMarks };
};

// FET Maths Paper 2 (Grades 10–12, CAPS-style topics)
const buildFETMathsPaper2 = (grade: number): { blocks: Block[]; totalMarks: number } => {
  const totalMarks = 150;

  const blocks: Block[] = [
    {
      type: 'section',
      title: 'SECTION A: TRIGONOMETRY',
      instructions: 'Answer ALL questions in this section. Show all working and round answers appropriately.',
      marks: null,
    },
    {
      type: 'question',
      number: '1',
      prompt: 'Trig ratios, identities and equations.',
      marks: 40,
      parts: [
        {
          label: '(a)',
          text: 'Apply trig ratios in right-angled triangles or the unit circle (grade-appropriate).',
          marks: 12,
        },
        {
          label: '(b)',
          text: 'Use trig identities to simplify expressions.',
          marks: 14,
        },
        {
          label: '(c)',
          text: 'Solve trig equations and interpret solutions.',
          marks: 14,
        },
      ],
      resources: null,
    },

    {
      type: 'section',
      title: 'SECTION B: ANALYTICAL GEOMETRY',
      instructions: 'Sketch where necessary and show all reasoning.',
      marks: null,
    },
    {
      type: 'question',
      number: '2',
      prompt: 'Analytical geometry of straight lines and circles/parabolas (grade-appropriate).',
      marks: 35,
      parts: [
        {
          label: '(a)',
          text: 'Work with gradients, distances or midpoints.',
          marks: 11,
        },
        {
          label: '(b)',
          text: 'Determine equations of lines or circles from given information.',
          marks: 12,
        },
        {
          label: '(c)',
          text: 'Solve a contextual analytic geometry problem.',
          marks: 12,
        },
      ],
      resources: null,
    },

    {
      type: 'section',
      title: 'SECTION C: EUCLIDEAN GEOMETRY',
      instructions: 'Give clear reasons for all statements. Use the correct theorem names.',
      marks: null,
    },
    {
      type: 'question',
      number: '3',
      prompt: 'Euclidean geometry and circle geometry.',
      marks: 40,
      parts: [
        {
          label: '(a)',
          text: 'Prove or use properties of triangles and quadrilaterals.',
          marks: 14,
        },
        {
          label: '(b)',
          text: 'Apply circle geometry theorems.',
          marks: 12,
        },
        {
          label: '(c)',
          text: 'Solve a multi-step geometry problem with reasons.',
          marks: 14,
        },
      ],
      resources: null,
    },

    {
      type: 'section',
      title: 'SECTION D: STATISTICS & PROBABILITY',
      instructions: 'Round answers appropriately and comment on context where asked.',
      marks: null,
    },
    {
      type: 'question',
      number: '4',
      prompt: 'Statistics and probability (grade-appropriate).',
      marks: 35,
      parts: [
        {
          label: '(a)',
          text: 'Interpret or draw statistical graphs.',
          marks: 11,
        },
        {
          label: '(b)',
          text: 'Calculate measures of central tendency or dispersion.',
          marks: 12,
        },
        {
          label: '(c)',
          text: 'Solve probability questions in a contextual setting.',
          marks: 12,
        },
      ],
      resources: null,
    },
  ];

  return { blocks, totalMarks };
};

// Fallback generic blueprint (non-Maths subjects or anything unexpected)
const buildGenericFullPaper = (subject: string): { blocks: Block[]; totalMarks: number } => {
  const totalMarks = 100;
  const blocks: Block[] = [
    {
      type: 'section',
      title: 'SECTION A',
      instructions: 'Answer ALL questions in this section.',
      marks: null,
    },
    {
      type: 'question',
      number: '1',
      prompt: `Short questions on ${subject}.`,
      marks: 30,
      parts: [
        { label: '(a)', text: `Short question 1 on ${subject}.`, marks: 10 },
        { label: '(b)', text: `Short question 2 on ${subject}.`, marks: 10 },
        { label: '(c)', text: `Short question 3 on ${subject}.`, marks: 10 },
      ],
      resources: null,
    },
    {
      type: 'section',
      title: 'SECTION B',
      instructions: 'Answer ALL questions in this section.',
      marks: null,
    },
    {
      type: 'question',
      number: '2',
      prompt: `Longer response questions on ${subject}.`,
      marks: 70,
      parts: [
        { label: '(a)', text: `Longer response 1 on ${subject}.`, marks: 25 },
        { label: '(b)', text: `Longer response 2 on ${subject}.`, marks: 25 },
        { label: '(c)', text: `Longer response 3 on ${subject}.`, marks: 20 },
      ],
      resources: null,
    },
  ];

  return { blocks, totalMarks };
};

// Section-only tests (topic drills)
const buildSectionTest = (req: BuildTestRequest): BuildTestResponse => {
  const subject = req.subject ?? 'Mathematics';
  const gradeNum = toNumber(req.grade, 12);
  const topic = req.topic || 'Mixed Practice';
  const count = toNumber(req.count, 10);
  const timed = !!req.timed;
  const durationSec =
    timed && typeof req.durationSec === 'number'
      ? req.durationSec
      : timed
      ? count * 90
      : null;

  const questionMarks = 5;
  const totalMarks = count * questionMarks;

  const blocks: Block[] = [
    {
      type: 'section',
      title: `SECTION: ${topic}`,
      instructions: 'Answer ALL questions in this section. Show ALL working.',
      marks: null,
    },
  ];

  for (let i = 0; i < count; i++) {
    blocks.push({
      type: 'question',
      number: i + 1,
      prompt: `Question on ${topic} (grade ${gradeNum}).`,
      marks: questionMarks,
      parts: [
        {
          label: '(a)',
          text: `Solve or simplify a ${topic} question appropriate for grade ${gradeNum}.`,
          marks: questionMarks,
        },
      ],
      resources: null,
    });
  }

  return {
    message: `Generated section test for ${subject} (Grade ${gradeNum}) – ${topic}`,
    title: `${subject}: ${topic}`,
    subject,
    totalMarks,
    timed,
    durationSec,
    blocks,
  };
};

// ---------- MAIN CLOUD FUNCTION ----------------------------------------

export const buildTest = onCall(
  {
    region: 'us-central1',
  },
  async (req): Promise<BuildTestResponse> => {
    const data = (req.data || {}) as BuildTestRequest;
    const subject = data.subject || 'Mathematics';
    const gradeNum = toNumber(data.grade, 12);
    const mode: 'full' | 'section' = data.mode === 'section' ? 'section' : 'full';
    const paperKey = normalisePaperKey(data.examType);
    const timed = !!data.timed;

    // SECTION TESTS (topic-based)
    if (mode === 'section') {
      return buildSectionTest(data);
    }

    // FULL EXAMS
    let blocks: Block[];
    let totalMarks: number;

    if (subject.toLowerCase().includes('math')) {
      if (gradeNum <= 9) {
        // Grades 8–9: single senior-phase style paper
        ({ blocks, totalMarks } = buildSeniorMathsPaper(gradeNum, data.examType || 'Paper'));
      } else {
        // Grades 10–12: split into Paper 1 / Paper 2
        if (paperKey === 'paper2') {
          ({ blocks, totalMarks } = buildFETMathsPaper2(gradeNum));
        } else {
          ({ blocks, totalMarks } = buildFETMathsPaper1(gradeNum));
        }
      }
    } else {
      // Non-maths fallback
      ({ blocks, totalMarks } = buildGenericFullPaper(subject));
    }

    const title =
      subject.toLowerCase().includes('math') && gradeNum >= 10
        ? `${subject} ${paperKey === 'paper2' ? 'Paper 2' : 'Paper 1'}`
        : `${subject} Paper`;

    const durationSec =
      timed && typeof data.durationSec === 'number'
        ? data.durationSec
        : timed
        ? 3 * 60 * 60
        : null;

    return {
      message: `Generated full test for ${subject} (Grade ${gradeNum}) – ${data.examType ?? 'Paper'}`,
      title,
      subject,
      totalMarks,
      timed,
      durationSec,
      blocks,
    };
  }
);

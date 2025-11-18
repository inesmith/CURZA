// curza/src/utils/chapterTopics.ts
import { listOptionsAI, summariseAI } from "../../firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { ensureAuthReady } from "./ensureAuthReady";
import { app } from "../../firebase";

export type TopicSection = {
  title: string;
  keyConcepts?: string[];
  formulas?: string[];
  exampleSteps?: string[];
  tips?: string[];
};

type CloudTopic = {
  name?: string;
  keyConcepts?: string[];
  formulas?: string[];
  exampleSteps?: string[];
  tips?: string[];
};

async function fetchTopicsFromCloudFn(params: {
  curriculum?: string;
  grade?: string | number;
  subject?: string;
  chapter?: string | number;
  chapterName?: string;
}): Promise<TopicSection[]> {
  await ensureAuthReady();
  const functions = getFunctions(app, "us-central1");
  const fn = httpsCallable<any, { topics: CloudTopic[] }>(
    functions,
    "chapterTopics"
  );

  const res = await fn({
    curriculum: params.curriculum || "CAPS",
    grade: params.grade,
    subject: params.subject,
    chapterNumber: params.chapter,
    chapterName: params.chapterName || "",
  });

  const arr = (res.data?.topics ?? []) as CloudTopic[];

  return (Array.isArray(arr) ? arr : []).map((t, i) => ({
    title: String(t?.name || `Topic ${i + 1}`),
    keyConcepts: Array.isArray(t?.keyConcepts) ? t.keyConcepts : [],
    formulas: Array.isArray(t?.formulas) ? t.formulas : [],
    exampleSteps: Array.isArray(t?.exampleSteps) ? t.exampleSteps : [],
    tips: Array.isArray(t?.tips) ? t.tips : [],
  }));
}

type GradeChapters = Record<string, string[]>;
type LocalCanon = Record<string, { chapters: GradeChapters }>;

// -------- LOCAL CAPS TOPICS (deterministic order, *titles only*) --------
const CAPS_LOCAL: LocalCanon = {
  "12": {
    chapters: {
      "1": [
        "Domain and Range",
        "Inverse Functions",
        "Exponential Functions",
        "Logarithmic Functions",
      ],
      "2": [
        "Trigonometric Identities",
        "General Solutions",
        "Trigonometric Equations",
        "Trigonometric Graphs",
        "Applications of Trigonometry",
      ],
      "3": ["Arithmetic Sequences", "Geometric Sequences", "Sigma Notation"],
      "4": [
        "First Principles",
        "Rules of Differentiation",
        "Tangents and Normals",
        "Optimization",
        "Rates of Change",
      ],
      "5": [
        "Anti-derivatives",
        "Definite Integrals",
        "Area Under a Curve",
        "Area Between Curves",
      ],
      "6": [
        "Distance & Midpoint",
        "Gradient & Intercepts",
        "Equation of a Line",
      ],
      "7": [
        "Counting Principles",
        "Venn Diagrams",
        "Conditional Probability",
        "Independence & Mutual Exclusivity",
      ],
      "8": [
        "Simple & Compound Interest",
        "Annuities",
        "Loan Repayments",
        "Depreciation",
        "Future & Present Value",
      ],
    },
  },
};

// ------------- utils -------------
const norm = (s: any) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
const sameish = (a?: string, b?: string) => norm(a) === norm(b);

function cleanGrade(g: any) {
  const n = String(g ?? "").replace(/\D+/g, "");
  return n || "12";
}
function cleanChapter(ch: any) {
  return String(ch ?? "").replace(/\D+/g, "");
}

function stripPlaceholders(arr: string[]): string[] {
  const bad = new Set([
    "intro",
    "introduction",
    "overview",
    "general overview",
    "chapter intro",
    "chapter introduction",
    "intro concepts",
  ]);
  return arr
    .map((s) => String(s ?? "").trim())
    .filter((s) => s && !bad.has(s.toLowerCase()));
}

function stripChapterPrefix(s: string) {
  return String(s).replace(/^chapter\s*\d+\s*[:\-–]\s*/i, "").trim();
}

function dedupe(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of arr) {
    const k = norm(t);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(t);
    }
  }
  return out;
}

function neutralTemplate(): TopicSection[] {
  return [
    { title: "Overview & Key Ideas" },
    { title: "Core Definitions" },
    { title: "Formulas & Rules" },
    { title: "Worked Example" },
    { title: "Common Mistakes & Tips" },
  ];
}

const stripLead = (s: string) =>
  String(s ?? "")
    .replace(/^[•\-\d\.\)\s]+/, "")
    .trim();

/**
 * Turn an AI or callable response into a string list.
 * Still used for topic-name AI fallback; *not* for keyConcepts/formulas anymore.
 */
function toList(raw: any, keys: string[]): string[] {
  const arr: any[] = keys.reduce<any[]>(
    (acc, k) => (Array.isArray(raw?.data?.[k]) ? raw.data[k] : acc),
    raw?.data?.items ?? raw?.data ?? raw
  );
  const list = Array.isArray(arr) ? arr : [];
  return dedupe(
    list
      .map((x) =>
        typeof x === "string"
          ? x
          : x?.title ?? x?.name ?? x?.text ?? x?.step ?? ""
      )
      .map((s) => stripLead(String(s)))
      .filter(Boolean)
      .filter((s) => s.length <= 160)
  ).slice(0, 8);
}

/** Local enrichment is now a NO-OP – everything comes from AI summarise */
function enrichTopicsWithLocal(
  _grade: string,
  _chapter: string,
  topics: TopicSection[]
): TopicSection[] {
  return topics;
}

/**
 * Core helper: for a given topic title, call the summariseAI function
 * and map its JSON into the shape used by your UI.
 */
async function hydrateTopicFromAI(
  ctx: {
    curriculum?: string;
    grade?: string | number;
    subject?: string;
    chapter?: string | number;
    chapterName?: string;
  },
  title: string
): Promise<TopicSection> {
  const g = cleanGrade(ctx.grade);

  try {
    await ensureAuthReady();

    const res: any = await summariseAI({
      topic: title,
      grade: g,
    } as any);

    // 🔎 DEBUG: log exactly what comes back from the function
    console.log(
      "[hydrateTopicFromAI] raw summariseAI result for",
      title,
      JSON.stringify(res, null, 2)
    );

    // Be generous with the shape: some SDKs give {data: {...}}, some just {...}
    const payload: any = res?.data ?? res ?? {};

    if (!payload || typeof payload !== "object") {
      console.log(
        "[hydrateTopicFromAI] payload not an object for topic:",
        title
      );
      return { title };
    }

    const keyConcepts: string[] = Array.isArray(payload.keyConcepts)
      ? payload.keyConcepts.map((c: any) => stripLead(String(c))).slice(0, 8)
      : [];

    const formulasRaw: any[] = Array.isArray(payload.formulas)
      ? payload.formulas
      : [];

    const formulas: string[] = formulasRaw
      .map((f: any) => {
        if (typeof f === "string") return stripLead(f);
        const parts = [f.name, f.expr, f.note]
          .map((p) => (p ? String(p).trim() : ""))
          .filter(Boolean);
        return stripLead(parts.join(" – "));
      })
      .slice(0, 8);

    const exampleSteps: string[] = Array.isArray(payload.workedExample?.steps)
      ? payload.workedExample.steps
          .map((s: any) => stripLead(String(s)))
          .slice(0, 8)
      : [];

    const tips: string[] = Array.isArray(payload.tips)
      ? payload.tips.map((t: any) => stripLead(String(t))).slice(0, 8)
      : [];

    return {
      title,
      keyConcepts,
      formulas,
      exampleSteps,
      tips,
    };
  } catch (e) {
    console.log("[hydrateTopicFromAI] summariseAI failed for", title, e);
    return { title };
  }
}


// --------- MAIN API (LOCAL/CHAPTER FN → AI hydrate) ----------
export async function getTopicsForChapter(params: {
  curriculum?: string;
  grade?: string | number;
  subject?: string;
  chapter?: string | number;
  chapterName?: string;
}): Promise<TopicSection[]> {
  const { curriculum, grade, subject, chapter, chapterName } = params || {};
  const g = cleanGrade(grade);
  const ch = cleanChapter(chapter);
  const chapNameClean = stripChapterPrefix(String(chapterName ?? ""));

  // 1) Grade 12 CAPS local topic titles → hydrate via summariseAI
  const localForChapter = CAPS_LOCAL[g]?.chapters?.[ch];

  if (localForChapter && localForChapter.length) {
    const cleaned = stripPlaceholders(localForChapter);
    const titles = dedupe(
      cleaned
        .map(stripChapterPrefix)
        .filter((t) => t && !sameish(t, chapNameClean))
    );

    if (titles.length) {
      console.log("[getTopicsForChapter] LOCAL topics used:", titles);

      const hydrated = await Promise.all(
        titles.map((title) =>
          hydrateTopicFromAI(
            { curriculum, grade: g, subject, chapter: ch, chapterName },
            title
          )
        )
      );

      return enrichTopicsWithLocal(g, ch, hydrated);
    }
  }

  // 2) chapterTopics Cloud Function → keep titles, AI for content
  try {
    const viaFnRaw = await fetchTopicsFromCloudFn({
      curriculum,
      grade: g,
      subject,
      chapter: ch,
      chapterName,
    });

    const bad = new Set([
      "intro",
      "introduction",
      "overview",
      "general overview",
      "chapter intro",
      "chapter introduction",
      "intro concepts",
    ]);

    const titles = viaFnRaw
      .map((t) => stripChapterPrefix(t.title ?? ""))
      .filter((t) => t && !sameish(t, chapNameClean))
      .filter((t) => !bad.has(norm(t)));

    if (titles.length) {
      console.log(
        "[getTopicsForChapter] chapterTopics cloud function used:",
        titles
      );

      const hydrated = await Promise.all(
        titles.map((title) =>
          hydrateTopicFromAI(
            { curriculum, grade: g, subject, chapter: ch, chapterName },
            title
          )
        )
      );

      return enrichTopicsWithLocal(g, ch, hydrated);
    } else {
      console.log(
        "[getTopicsForChapter] chapterTopics returned only placeholders; falling back to AI topics"
      );
    }
  } catch (e) {
    console.log("[getTopicsForChapter] chapterTopics cloud function failed:", e);
  }

  // 3) AI fallback for topic *titles* via listOptionsAI → summariseAI per title
  try {
    const res: any = await listOptionsAI({
      type: "topics",
      curriculum: curriculum || "CAPS",
      grade: g,
      subject: subject || "Mathematics",
      chapter: ch,
      chapterName: chapterName || "",
    } as any);

    const items: any[] = res?.data?.items || res?.data?.topics || [];
    if (Array.isArray(items) && items.length) {
      const raw = items.map((x) =>
        typeof x === "string"
          ? x
          : x?.title ?? x?.name ?? x?.topic ?? x?.heading ?? ""
      );

      const titles = dedupe(
        stripPlaceholders(raw)
          .map(stripChapterPrefix)
          .map((t) => t.trim())
          .filter(Boolean)
          .filter((t) => !sameish(t, chapNameClean))
      );

      if (titles.length) {
        console.log("[getTopicsForChapter] AI topics used:", titles);

        const hydrated = await Promise.all(
          titles.map((title) =>
            hydrateTopicFromAI(
              { curriculum, grade: g, subject, chapter: ch, chapterName },
              title
            )
          )
        );

        return enrichTopicsWithLocal(g, ch, hydrated);
      }
    }
  } catch (e) {
    console.log("[getTopicsForChapter] listOptionsAI failed:", e);
  }

  // 4) Neutral fallback (generic titles) → summariseAI per title
  console.log("[getTopicsForChapter] No topics found; using neutral template");
  const neutral = neutralTemplate();

  const hydrated = await Promise.all(
    neutral.map((t) =>
      hydrateTopicFromAI(
        { curriculum, grade: g, subject, chapter: ch, chapterName },
        t.title
      )
    )
  );

  return enrichTopicsWithLocal(g, ch, hydrated);
}

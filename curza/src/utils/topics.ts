// src/utils/topics.ts
// Maps curriculum + grade + subject -> total number of topics.
// Expand this list as you add support for other grades/subjects.

type Key = `${string}::${string}::${string}`;

const TOPIC_TOTALS: Record<Key, number> = {
  // CAPS Grade 12
  'CAPS::12::Mathematics': 12,
  'CAPS::12::Mathematical Literacy': 10,
  'CAPS::12::Physical Sciences': 12,
  'CAPS::12::Life Sciences': 10,
  'CAPS::12::Geography': 10,
  'CAPS::12::History': 8,
  'CAPS::12::Accounting': 12,
  'CAPS::12::Business Studies': 10,
  'CAPS::12::Economics': 10,
  'CAPS::12::Afrikaans': 9,
  'CAPS::12::English': 9,
};

export function getSubjectTopicTotal(
  c_curriculum: string,
  c_grade: number | string,
  c_subject: string
): number {
  const key: Key = `${String(c_curriculum).toUpperCase()}::${String(c_grade)}::${String(
    c_subject
  )}`;
  return TOPIC_TOTALS[key] ?? 12;
}

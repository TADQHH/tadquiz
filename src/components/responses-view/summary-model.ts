import type { Question, ResponseRow } from '../../lib/types';

export type ChoiceRow = { label: string; count: number; pct: number };

export type QuestionSummary = { question: Question; answered: number; skipped: number } & (
  | { kind: 'choice'; rows: ChoiceRow[] }
  | { kind: 'rating'; rows: ChoiceRow[]; average: number | null }
  | { kind: 'text'; answers: string[] }
);

function rawOf(row: ResponseRow, id: number) {
  return row.answers[String(id)] ?? row.answers[id as unknown as string];
}

function empty(value: unknown) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function pct(count: number, total: number) {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

function choiceOf(question: Question, values: unknown[]): QuestionSummary {
  const answered = values.filter((value) => !empty(value)).length;
  const rows = question.options.map((label) => {
    let count = 0;
    for (const value of values) {
      if (Array.isArray(value) && value.includes(label)) count += 1;
      else if (value === label) count += 1;
    }
    return { label, count, pct: pct(count, answered) };
  });
  return { question, answered, skipped: values.length - answered, kind: 'choice', rows };
}

function ratingOf(question: Question, values: unknown[]): QuestionSummary {
  const nums: number[] = [];
  for (const value of values) {
    if (empty(value)) continue;
    const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
    if (n >= 1 && n <= 5) nums.push(n);
  }
  const answered = nums.length;
  const rows = [1, 2, 3, 4, 5].map((n) => {
    const count = nums.filter((value) => value === n).length;
    return { label: String(n), count, pct: pct(count, answered) };
  });
  const average =
    answered === 0 ? null : Math.round((nums.reduce((sum, n) => sum + n, 0) / answered) * 10) / 10;
  return { question, answered, skipped: values.length - answered, kind: 'rating', rows, average };
}

function textOf(question: Question, rows: ResponseRow[]): QuestionSummary {
  const answers: string[] = [];
  for (const row of rows) {
    const value = rawOf(row, question.id);
    if (typeof value === 'string' && value.trim() !== '') answers.push(value);
  }
  return {
    question,
    answered: answers.length,
    skipped: rows.length - answers.length,
    kind: 'text',
    answers,
  };
}

export function summarize(questions: Question[], rows: ResponseRow[]): QuestionSummary[] {
  return questions.map((question) => {
    const values = rows.map((row) => rawOf(row, question.id));
    if (question.type === 'single_choice' || question.type === 'multi_choice') {
      return choiceOf(question, values);
    }
    if (question.type === 'rating') return ratingOf(question, values);
    return textOf(question, rows);
  });
}

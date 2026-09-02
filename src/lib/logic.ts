/** Conditional-display engine — shared by the public stepper (client) and the
 * submit API (server). A question with `logic` is shown only when its condition
 * on an EARLIER question's answer holds; if the referenced question is hidden,
 * the dependent question is hidden too (Google-Forms-style cascade). */
import type { AnswerValue, Question, QuestionLogic, QuestionType, LogicOperator } from './types.ts';

export const OPERATORS_BY_TYPE: Record<QuestionType, readonly LogicOperator[]> = {
  single_choice: ['eq', 'neq'],
  multi_choice: ['includes', 'not_includes', 'answered', 'not_answered'],
  rating: ['eq', 'neq', 'lt', 'lte', 'gt', 'gte'],
  text: ['contains', 'not_contains', 'answered', 'not_answered'],
  textarea: ['contains', 'not_contains', 'answered', 'not_answered'],
};

export const OPERATOR_LABELS: Record<LogicOperator, string> = {
  eq: 'bằng đáp án',
  neq: 'khác đáp án',
  lt: 'nhỏ hơn',
  lte: 'nhỏ hơn hoặc bằng',
  gt: 'lớn hơn',
  gte: 'lớn hơn hoặc bằng',
  contains: 'chứa chữ',
  not_contains: 'không chứa chữ',
  includes: 'có chọn',
  not_includes: 'không chọn',
  answered: 'đã được trả lời',
  not_answered: 'chưa được trả lời',
};

/** Does this operator compare against a value the admin must pick/enter? */
export function opNeedsValue(op: LogicOperator): boolean {
  return op !== 'answered' && op !== 'not_answered';
}

function isAnswered(answer: AnswerValue | undefined): boolean {
  if (answer === undefined || answer === null || answer === '') return false;
  return !(Array.isArray(answer) && answer.length === 0);
}

/** Evaluate one condition. `ref` is the question the condition points at. */
export function evaluateLogic(
  logic: QuestionLogic,
  ref: Question,
  answer: AnswerValue | undefined,
): boolean {
  const answered = isAnswered(answer);
  if (logic.op === 'answered') return answered;
  if (logic.op === 'not_answered') return !answered;
  if (!answered) return false;

  switch (ref.type) {
    case 'single_choice':
      if (logic.op === 'eq') return answer === logic.value;
      if (logic.op === 'neq') return answer !== logic.value;
      return false;
    case 'multi_choice': {
      const list = Array.isArray(answer) ? answer : [String(answer)];
      if (logic.op === 'includes') return list.includes(String(logic.value));
      if (logic.op === 'not_includes') return !list.includes(String(logic.value));
      return false;
    }
    case 'rating': {
      const num = typeof answer === 'number' ? answer : Number.parseInt(String(answer), 10);
      const target = typeof logic.value === 'number' ? logic.value : Number.parseInt(String(logic.value), 10);
      if (!Number.isFinite(num) || !Number.isFinite(target)) return false;
      if (logic.op === 'eq') return num === target;
      if (logic.op === 'neq') return num !== target;
      if (logic.op === 'lt') return num < target;
      if (logic.op === 'lte') return num <= target;
      if (logic.op === 'gt') return num > target;
      if (logic.op === 'gte') return num >= target;
      return false;
    }
    default: {
      const haystack = String(answer).toLowerCase();
      const needle = String(logic.value ?? '').toLowerCase();
      if (logic.op === 'contains') return needle !== '' && haystack.includes(needle);
      if (logic.op === 'not_contains') return needle === '' || !haystack.includes(needle);
      return false;
    }
  }
}

function keyOf(question: Question): string {
  return question.key || `id:${question.id}`;
}

/**
 * Forward pass over ordered questions. `answers` is keyed by String(question.id)
 * exactly like submission payloads. Only answers to visible questions influence
 * later conditions.
 */
export function visibleQuestions(
  questions: Question[],
  answers: Record<string, unknown>,
): Question[] {
  const byKey = new Map(questions.map((q) => [keyOf(q), q]));
  const visibleKeys = new Set<string>();
  const out: Question[] = [];
  for (const question of questions) {
    let show = true;
    if (question.logic) {
      const ref = byKey.get(question.logic.questionKey);
      const refVisible = ref !== undefined && visibleKeys.has(keyOf(ref));
      show = refVisible && evaluateLogic(question.logic, ref, answers[String(ref.id)] as AnswerValue | undefined);
    }
    if (show) {
      visibleKeys.add(keyOf(question));
      out.push(question);
    }
  }
  return out;
}

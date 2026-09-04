import { opNeedsValue } from '../../lib/logic';
import type { FormDetail, FormStatus, LogicOperator, QuestionLogic, QuestionType } from '../../lib/types';

export type DraftLogic = {
  questionKey: string;
  op: LogicOperator;
  value?: string | number;
};

export type DraftQuestion = {
  key: string;
  type: QuestionType;
  label: string;
  description: string;
  options: string[];
  required: boolean;
  maxChars: number | null;
  logic: DraftLogic | null;
};

let seed = 0;

export function fromForm(form: FormDetail): DraftQuestion[] {
  return form.questions.map((q) => ({
    key: q.key || String(q.id),
    type: q.type,
    label: q.label,
    description: q.description,
    options: q.options,
    required: q.required,
    maxChars: q.maxChars,
    logic: q.logic ?? null,
  }));
}

export function newQuestion(): DraftQuestion {
  seed += 1;
  return {
    key: `new-${Date.now()}-${seed}`,
    type: 'text',
    label: '',
    description: '',
    options: [],
    required: true,
    maxChars: null,
    logic: null,
  };
}

export function applyType(question: DraftQuestion, type: QuestionType): DraftQuestion {
  const next = { ...question, type };
  if ((type === 'single_choice' || type === 'multi_choice') && next.options.length < 2) {
    next.options = [...next.options, '', ''].slice(0, 2);
  }
  return next;
}

function logicPayload(logic: DraftLogic | null, earlierKeys: Set<string>): QuestionLogic | null {
  if (!logic?.questionKey || !logic.op) return null;
  if (!earlierKeys.has(logic.questionKey)) return null;
  if (opNeedsValue(logic.op) && (logic.value === undefined || logic.value === '')) return null;
  return logic;
}

export function snapshot(
  title: string,
  slug: string,
  description: string,
  completionUrl: string,
  responseLimit: string,
  questions: DraftQuestion[],
) {
  return JSON.stringify({
    title,
    slug,
    description,
    completionUrl,
    responseLimit,
    questions: questions.map(({ key, type, label, description: d, options, required, maxChars, logic }) => ({
      key,
      type,
      label,
      description: d,
      options,
      required,
      maxChars,
      logic,
    })),
  });
}

export function payloadOf(
  title: string,
  slug: string,
  description: string,
  completionUrl: string,
  responseLimit: string,
  questions: DraftQuestion[],
) {
  return {
    title,
    slug,
    description,
    completionUrl,
    responseLimit: responseLimit === '' ? null : Number(responseLimit),
    questions: questions.map((q, i) => ({
      key: q.key,
      type: q.type,
      label: q.label,
      description: q.description,
      options: q.options,
      required: q.required,
      maxChars: q.maxChars,
      logic: logicPayload(q.logic, new Set(questions.slice(0, i).map((item) => item.key))),
    })),
  };
}

export type NextStatus = Extract<FormStatus, 'published' | 'closed'>;

export function statusAction(status: FormStatus): { label: string; next: NextStatus } {
  if (status === 'published') return { label: 'Đóng form', next: 'closed' };
  return { label: status === 'closed' ? 'Mở lại' : 'Xuất bản', next: 'published' };
}

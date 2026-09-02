import type { FormDetail, FormStatus, QuestionType } from '../../lib/types';

export type DraftQuestion = {
  key: string;
  type: QuestionType;
  label: string;
  description: string;
  options: string[];
  required: boolean;
  maxChars: number | null;
};

let seed = 0;

export function fromForm(form: FormDetail): DraftQuestion[] {
  return form.questions.map((q) => ({
    key: String(q.id),
    type: q.type,
    label: q.label,
    description: q.description,
    options: q.options,
    required: q.required,
    maxChars: q.maxChars,
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
  };
}

export function applyType(question: DraftQuestion, type: QuestionType): DraftQuestion {
  const next = { ...question, type };
  if ((type === 'single_choice' || type === 'multi_choice') && next.options.length < 2) {
    next.options = [...next.options, '', ''].slice(0, 2);
  }
  return next;
}

export function snapshot(
  title: string,
  slug: string,
  description: string,
  questions: DraftQuestion[],
) {
  return JSON.stringify({
    title,
    slug,
    description,
    questions: questions.map(({ type, label, description: d, options, required, maxChars }) => ({
      type,
      label,
      description: d,
      options,
      required,
      maxChars,
    })),
  });
}

export function payloadOf(
  title: string,
  slug: string,
  description: string,
  questions: DraftQuestion[],
) {
  return {
    title,
    slug,
    description,
    questions: questions.map((q) => ({
      type: q.type,
      label: q.label,
      description: q.description,
      options: q.options,
      required: q.required,
      maxChars: q.maxChars,
    })),
  };
}

export type NextStatus = Extract<FormStatus, 'published' | 'closed'>;

export function statusAction(status: FormStatus): { label: string; next: NextStatus } {
  if (status === 'published') return { label: 'Đóng form', next: 'closed' };
  return { label: status === 'closed' ? 'Mở lại' : 'Xuất bản', next: 'published' };
}

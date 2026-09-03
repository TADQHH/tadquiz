/** Shared DTOs — the contract between server (db/api) and UI components. */

export type QuestionType =
  | 'text'
  | 'textarea'
  | 'single_choice'
  | 'multi_choice'
  | 'rating';

export type FormStatus = 'draft' | 'published' | 'closed';

export const QUESTION_TYPES: readonly QuestionType[] = [
  'text',
  'textarea',
  'single_choice',
  'multi_choice',
  'rating',
] as const;

/** Conditional-display operators ("chỉ hiện khi…"). */
export type LogicOperator =
  | 'eq'
  | 'neq'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'contains'
  | 'not_contains'
  | 'includes'
  | 'not_includes'
  | 'answered'
  | 'not_answered';

/** A question is shown only when this condition on an EARLIER question holds. */
export interface QuestionLogic {
  /** `key` of the referenced earlier question. */
  questionKey: string;
  op: LogicOperator;
  /** Option text, rating 1–5 or text fragment depending on the operator. */
  value?: string | number;
}

/** Question as stored in DB / served to UI. */
export interface Question {
  id: number;
  formId: number;
  /** Stable client key — logic references and edits survive reordering. */
  key: string;
  type: QuestionType;
  label: string;
  description: string;
  /** Present for single_choice / multi_choice. */
  options: string[];
  required: boolean;
  position: number;
  maxChars: number | null;
  /** Conditional display rule, or null for always-visible. */
  logic: QuestionLogic | null;
}

/** Input accepted from the admin editor when saving a form. */
export interface QuestionInput {
  key: string;
  type: QuestionType;
  label: string;
  description?: string;
  options?: string[];
  required?: boolean;
  maxChars?: number | null;
  logic?: QuestionLogic | null;
}

export interface FormInput {
  title: string;
  slug: string;
  description?: string;
  /** Optional http(s) URL opened in a new tab from the thank-you page. */
  completionUrl?: string | null;
  questions: QuestionInput[];
}

export interface FormSummary {
  id: number;
  slug: string;
  completionUrl: string | null;
  description: string;
  status: FormStatus;
  responseCount: number;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormDetail extends FormSummary {
  questions: Question[];
}

/** Answer value shapes per question type:
 *  text/textarea/single_choice → string; multi_choice → string[]; rating → number. */
export type AnswerValue = string | string[] | number;

export interface ResponseRow {
  id: number;
  submittedAt: string;
  answers: Record<string, unknown>;
}

export const MAX_LABEL_CHARS = 500;
export const MAX_OPTION_CHARS = 200;
export const MAX_OPTIONS = 20;
export const MAX_ANSWER_CHARS = 5000;

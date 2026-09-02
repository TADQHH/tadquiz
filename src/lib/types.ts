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

/** Question as stored in DB / served to UI. */
export interface Question {
  id: number;
  formId: number;
  type: QuestionType;
  label: string;
  description: string;
  /** Present for single_choice / multi_choice. */
  options: string[];
  required: boolean;
  position: number;
  maxChars: number | null;
}

/** Input accepted from the admin editor when saving a form. */
export interface QuestionInput {
  type: QuestionType;
  label: string;
  description?: string;
  options?: string[];
  required?: boolean;
  maxChars?: number | null;
}

export interface FormInput {
  title: string;
  slug: string;
  description?: string;
  questions: QuestionInput[];
}

export interface FormSummary {
  id: number;
  slug: string;
  title: string;
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
  answers: Record<string, AnswerValue>;
}

export const MAX_LABEL_CHARS = 500;
export const MAX_OPTION_CHARS = 200;
export const MAX_OPTIONS = 20;
export const MAX_ANSWER_CHARS = 5000;

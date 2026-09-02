/** Server-side answer validation — the single source of truth for what a valid
 * submission is. The quiz UI mirrors these rules for instant feedback. */
import type { AnswerValue, Question } from './types.ts';
import { MAX_ANSWER_CHARS } from './types.ts';

export type ValidationResult =
  | { ok: true; values: Record<number, AnswerValue> }
  | { ok: false; errors: Record<number, string> };

const RATING_MIN = 1;
const RATING_MAX = 5;


function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((item) => typeof item === 'string') ? (value as string[]) : null;
}

function asRating(value: unknown): number | null {
  const num = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(num)) return null;
  return num;
}

/**
 * @param questions form questions (ordered)
 * @param submitted raw parsed JSON body: { [questionId]: value }
 */
export function validateAnswers(
  questions: Question[],
  submitted: Record<string, unknown>,
): ValidationResult {
  /** @type {Record<number, AnswerValue>} */
  const values: Record<number, AnswerValue> = {};
  /** @type {Record<number, string>} */
  const errors: Record<number, string> = {};

  for (const question of questions) {
    const raw = submitted[String(question.id)];
    const isEmpty =
      raw === undefined ||
      raw === null ||
      raw === '' ||
      (Array.isArray(raw) && raw.length === 0);

    if (isEmpty) {
      if (question.required) errors[question.id] = 'Câu hỏi này là bắt buộc.';
      continue;
    }

    switch (question.type) {
      case 'text':
      case 'textarea': {
        if (typeof raw !== 'string') {
          errors[question.id] = 'Câu trả lời không hợp lệ.';
          break;
        }
        const trimmed = raw.trim();
        const cap = Math.min(question.maxChars ?? MAX_ANSWER_CHARS, MAX_ANSWER_CHARS);
        if (trimmed.length > cap) {
          errors[question.id] = `Tối đa ${cap} ký tự.`;
          break;
        }
        if (question.required && trimmed === '') {
          errors[question.id] = 'Câu hỏi này là bắt buộc.';
          break;
        }
        values[question.id] = trimmed;
        break;
      }
      case 'single_choice': {
        if (typeof raw !== 'string' || !question.options.includes(raw)) {
          errors[question.id] = 'Vui lòng chọn một đáp án trong danh sách.';
          break;
        }
        values[question.id] = raw;
        break;
      }
      case 'multi_choice': {
        const choices = asStringArray(raw);
        if (choices === null || choices.length === 0) {
          errors[question.id] = 'Đáp án không hợp lệ.';
          break;
        }
        const invalid = choices.find((c) => !question.options.includes(c));
        if (invalid !== undefined) {
          errors[question.id] = 'Có đáp án nằm ngoài danh sách cho phép.';
          break;
        }
        const unique = [...new Set(choices)];
        values[question.id] = unique;
        break;
      }
      case 'rating': {
        const rating = asRating(raw);
        if (rating === null || rating < RATING_MIN || rating > RATING_MAX) {
          errors[question.id] = `Chọn mức từ ${RATING_MIN} đến ${RATING_MAX}.`;
          break;
        }
        values[question.id] = rating;
        break;
      }
      default:
        errors[question.id] = 'Loại câu hỏi không được hỗ trợ.';
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, values };
}

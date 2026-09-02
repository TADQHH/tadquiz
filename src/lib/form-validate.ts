/** Server-side validation for admin-authored form payloads (PUT /api/forms/:id). */
import type { FormInput, QuestionInput, QuestionLogic, LogicOperator } from './types.ts';
import { QUESTION_TYPES, MAX_LABEL_CHARS, MAX_OPTION_CHARS, MAX_OPTIONS } from './types.ts';
import { OPERATORS_BY_TYPE, opNeedsValue } from './logic.ts';
import { validateSlug } from './slug.ts';

const KEY_PATTERN = /^[A-Za-z0-9:_-]{1,100}$/;

export interface FormPayloadResult {
  ok: boolean
  error?: string
  value?: { title: string; slug: string; description: string; questions: QuestionInput[] }
}

function checkQuestion(q: unknown): string | null {
  if (typeof q !== 'object' || q === null) return 'Câu hỏi không hợp lệ.';
  const item = q as Record<string, unknown>;
  if (!QUESTION_TYPES.includes(item.type as never)) {
    return `Loại câu hỏi "${String(item.type)}" không hợp lệ.`;
  }
  const label = typeof item.label === 'string' ? item.label.trim() : '';
  if (label === '') return 'Mỗi câu hỏi cần nội dung (label).';
  if (label.length > MAX_LABEL_CHARS) return `Label câu hỏi tối đa ${MAX_LABEL_CHARS} ký tự.`;
  const type = item.type as QuestionInput['type'];
  if (type === 'single_choice' || type === 'multi_choice') {
    const options = Array.isArray(item.options) ? item.options : [];
    if (options.length < 2 || options.length > MAX_OPTIONS) {
      return `Câu chọn lựa cần 2–${MAX_OPTIONS} phương án.`;
    }
    for (const opt of options) {
      if (typeof opt !== 'string' || opt.trim() === '') return 'Phương án không được rỗng.';
      if (opt.length > MAX_OPTION_CHARS) {
        return `Phương án tối đa ${MAX_OPTION_CHARS} ký tự.`;
      }
    }
  }
  if (item.maxChars !== undefined && item.maxChars !== null) {
    const max = Number(item.maxChars);
    if (!Number.isInteger(max) || max < 1 || max > 5000) {
      return 'maxChars phải là số nguyên 1–5000.';
    }
  }
  return null;
}

/** Normalize + validate one condition against its earlier reference question. */
function checkLogic(
  raw: unknown,
  earlier: QuestionInput[],
): QuestionLogic | null | string {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object') return 'Điều kiện hiển thị không hợp lệ.';
  const item = raw as Record<string, unknown>;
  const questionKey = typeof item.questionKey === 'string' ? item.questionKey : '';
  const ref = earlier.find((q) => q.key === questionKey);
  if (!ref) return 'Điều kiện chỉ được tham chiếu câu hỏi ĐẦU TRƯỚC nó.';
  const op = item.op as LogicOperator;
  if (!OPERATORS_BY_TYPE[ref.type].includes(op)) {
    return `Toán tử "${String(item.op)}" không dùng được cho loại câu hỏi đó.`;
  }
  if (!opNeedsValue(op)) return { questionKey, op };
  const value = item.value;
  if (ref.type === 'single_choice' || ref.type === 'multi_choice') {
    if (typeof value !== 'string' || !(ref.options ?? []).includes(value)) {
      return 'Giá trị điều kiện phải là một phương án của câu hỏi tham chiếu.';
    }
    return { questionKey, op, value };
  }
  if (ref.type === 'rating') {
    const num = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
    if (!Number.isInteger(num) || num < 1 || num > 5) {
      return 'Giá trị điều kiện thang đo phải là số nguyên 1–5.';
    }
    return { questionKey, op, value: num };
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return 'Điều kiện "chứa/không chứa" cần nội dung để so sánh.';
  }
  return { questionKey, op, value: value.trim().slice(0, 200) };
}

export function validateFormPayload(input: unknown): FormPayloadResult {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'Payload không hợp lệ.' };
  }
  const body = input as Partial<FormInput>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (title === '') return { ok: false, error: 'Form cần tiêu đề.' };
  if (title.length > 200) return { ok: false, error: 'Tiêu đề tối đa 200 ký tự.' };

  const slugCheck = validateSlug(typeof body.slug === 'string' ? body.slug : '');
  if (!slugCheck.ok) return { ok: false, error: slugCheck.error ?? 'Slug không hợp lệ.' };

  const description = typeof body.description === 'string' ? body.description.slice(0, 1000) : '';
  if (!Array.isArray(body.questions)) {
    return { ok: false, error: 'Thiếu danh sách câu hỏi.' };
  }
  if (body.questions.length > 100) return { ok: false, error: 'Tối đa 100 câu hỏi.' };

  const seenKeys = new Set<string>();
  const questions: QuestionInput[] = [];
  for (const q of body.questions) {
    const err = checkQuestion(q);
    if (err) return { ok: false, error: err };
    const key = typeof q.key === 'string' ? q.key : '';
    if (!KEY_PATTERN.test(key)) {
      return { ok: false, error: `Key câu hỏi "${key.slice(0, 30)}" không hợp lệ (1–100 ký tự A–z 0–9 : _ -).` };
    }
    if (seenKeys.has(key)) return { ok: false, error: `Key câu hỏi "${key}" bị trùng.` };
    seenKeys.add(key);
    const logic = checkLogic(q.logic, questions);
    if (typeof logic === 'string') return { ok: false, error: logic };
    questions.push({
      key,
      type: q.type,
      label: q.label.trim(),
      description: (q.description ?? '').slice(0, 500),
      options: (q.options ?? []).map((o) => o.trim()),
      required: Boolean(q.required),
      maxChars: q.maxChars ?? null,
      logic,
    });
  }

  return {
    ok: true,
    value: { title, slug: slugCheck.slug, description, questions },
  };
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAnswers } from '../../src/lib/validate.ts';
import type { Question } from '../../src/lib/types.ts';

let nextId = 100;

function q(partial: Partial<Question>): Question {
  nextId += 1;
  return {
    id: nextId,
    formId: 1,
    key: `k${nextId}`,
    type: 'text',
    label: 'Câu hỏi',
    description: '',
    options: [],
    required: false,
    position: 0,
    maxChars: null,
    logic: null,
    ...partial,
  };
}

test('text bắt buộc thiếu → lỗi đúng câu', () => {
  const question = q({ type: 'text', required: true });
  const result = validateAnswers([question], {});
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.errors[question.id], 'Câu hỏi này là bắt buộc.');
});

test('text thừa khoảng trắng được trim', () => {
  const question = q({ type: 'text' });
  const result = validateAnswers([question], { [String(question.id)]: '  hello  ' });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.values[question.id], 'hello');
});

test('text trống không bắt buộc → bỏ qua, không lỗi', () => {
  const question = q({ type: 'text' });
  const result = validateAnswers([question], {});
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(question.id in result.values, false);
});

test('text vượt maxChars → lỗi', () => {
  const question = q({ type: 'text', maxChars: 5 });
  const result = validateAnswers([question], { [String(question.id)]: '123456' });
  assert.equal(result.ok, false);
});

test('text sai kiểu (số) → lỗi', () => {
  const question = q({ type: 'text' });
  const result = validateAnswers([question], { [String(question.id)]: 42 });
  assert.equal(result.ok, false);
});

test('single_choice ngoài options → lỗi', () => {
  const question = q({ type: 'single_choice', options: ['A', 'B'] });
  assert.equal(validateAnswers([question], { [String(question.id)]: 'C' }).ok, false);
  const ok = validateAnswers([question], { [String(question.id)]: 'A' });
  assert.equal(ok.ok, true);
});

test('multi_choice lọc trùng và chặn ngoài options', () => {
  const question = q({ type: 'multi_choice', options: ['x', 'y'] });
  const ok = validateAnswers([question], { [String(question.id)]: ['x', 'x'] });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.deepEqual(ok.values[question.id], ['x']);
  assert.equal(validateAnswers([question], { [String(question.id)]: ['x', 'z'] }).ok, false);
});

test('multi_choice rỗng nhưng bắt buộc → lỗi', () => {
  const question = q({ type: 'multi_choice', options: ['x'], required: true });
  assert.equal(validateAnswers([question], { [String(question.id)]: [] }).ok, false);
});

test('rating ngoài 1–5 → lỗi, số nguyên hợp lệ ok', () => {
  const question = q({ type: 'rating' });
  assert.equal(validateAnswers([question], { [String(question.id)]: 0 }).ok, false);
  assert.equal(validateAnswers([question], { [String(question.id)]: 6 }).ok, false);
  assert.equal(validateAnswers([question], { [String(question.id)]: 2.5 }).ok, false);
  const ok = validateAnswers([question], { [String(question.id)]: 4 });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.values[question.id], 4);
});

test('question id lạ trong payload bị bỏ qua', () => {
  const question = q({ type: 'text' });
  const result = validateAnswers([question], { '99999': 'hack', [String(question.id)]: 'ok' });
  assert.equal(result.ok, true);
});

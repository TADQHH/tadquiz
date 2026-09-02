import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLogic, visibleQuestions, OPERATORS_BY_TYPE, opNeedsValue } from '../../src/lib/logic.ts';
import { validateFormPayload } from '../../src/lib/form-validate.ts';
import type { Question } from '../../src/lib/types.ts';

let nextId = 0;

function q(partial: Partial<Question>): Question {
  nextId += 1;
  return {
    id: nextId,
    formId: 1,
    key: `k${nextId}`,
    type: 'text',
    label: `Câu ${nextId}`,
    description: '',
    options: [],
    required: false,
    position: 0,
    maxChars: null,
    logic: null,
    ...partial,
  };
}

const choice = q({
  key: 'nhan-tin',
  type: 'single_choice',
  options: ['Có', 'Không'],
});
const email = q({
  key: 'email',
  type: 'text',
  logic: { questionKey: 'nhan-tin', op: 'eq', value: 'Có' },
});
const rating = q({ key: 'sao', type: 'rating' });
const multi = q({ key: 'chon', type: 'multi_choice', options: ['a', 'b', 'c'] });
const questions = [choice, email, rating, multi];

test('evaluateLogic: eq / neq trên single_choice', () => {
  assert.equal(evaluateLogic({ questionKey: 'x', op: 'eq', value: 'Có' }, choice, 'Có'), true);
  assert.equal(evaluateLogic({ questionKey: 'x', op: 'neq', value: 'Có' }, choice, 'Không'), true);
  assert.equal(evaluateLogic({ questionKey: 'x', op: 'neq', value: 'Có' }, choice, 'Có'), false);
  // chưa trả lời → mọi phép so sánh đều false
  assert.equal(evaluateLogic({ questionKey: 'x', op: 'neq', value: 'Có' }, choice, undefined), false);
});

test('evaluateLogic: so sánh số trên rating, includes trên multi_choice, contains trên text', () => {
  assert.equal(evaluateLogic({ questionKey: 'x', op: 'gte', value: 4 }, rating, 4), true);
  assert.equal(evaluateLogic({ questionKey: 'x', op: 'lt', value: 3 }, rating, 4), false);
  assert.equal(evaluateLogic({ questionKey: 'x', op: 'includes', value: 'b' }, multi, ['a', 'b']), true);
  assert.equal(evaluateLogic({ questionKey: 'x', op: 'not_includes', value: 'c' }, multi, ['a', 'b']), true);
  assert.equal(
    evaluateLogic({ questionKey: 'x', op: 'contains', value: 'tad' }, email, 'CLB TAD đáng yêu'),
    true,
  );
});

test('evaluateLogic: answered / not_answered', () => {
  assert.equal(evaluateLogic({ questionKey: 'x', op: 'answered' }, rating, undefined), false);
  assert.equal(evaluateLogic({ questionKey: 'x', op: 'answered' }, rating, 3), true);
  assert.equal(evaluateLogic({ questionKey: 'x', op: 'not_answered' }, email, ''), true);
});

test('visibleQuestions: câu có điều kiện ẩn/hiện theo đáp án', () => {
  const none = visibleQuestions(questions, {});
  assert.deepEqual(none.map((x) => x.key), ['nhan-tin', 'sao', 'chon']);

  const withYes = visibleQuestions(questions, { [String(choice.id)]: 'Có' });
  assert.deepEqual(withYes.map((x) => x.key), ['nhan-tin', 'email', 'sao', 'chon']);

  const withNo = visibleQuestions(questions, { [String(choice.id)]: 'Không' });
  assert.equal(withNo.find((x) => x.key === 'email'), undefined);
});

test('visibleQuestions: chuỗi điều kiện — câu ẩn làm ẩn cả câu phụ thuộc', () => {
  const a = q({ key: 'a', type: 'single_choice', options: ['x', 'y'] });
  const b = q({ key: 'b', type: 'text', logic: { questionKey: 'a', op: 'eq', value: 'x' } });
  const c = q({ key: 'c', type: 'text', logic: { questionKey: 'b', op: 'answered' } });
  // a = y → b ẩn → c ẩn dù logic của c chỉ xét b "đã trả lời"
  const visible = visibleQuestions([a, b, c], { [String(a.id)]: 'y' });
  assert.deepEqual(visible.map((x) => x.key), ['a']);
  // a = x, b trả lời → c hiện
  const visible2 = visibleQuestions([a, b, c], { [String(a.id)]: 'x', [String(b.id)]: 'OK' });
  assert.deepEqual(visible2.map((x) => x.key), ['a', 'b', 'c']);
});

test('OPERATORS_BY_TYPE + opNeedsValue khớp nhau', () => {
  assert.deepEqual([...OPERATORS_BY_TYPE.single_choice], ['eq', 'neq']);
  assert.equal(opNeedsValue('answered'), false);
  assert.equal(opNeedsValue('eq'), true);
});

function payload(questions: unknown[]) {
  return validateFormPayload({ title: 'T', slug: 'test-form', questions });
}
test('form payload: key bắt buộc và duy nhất', () => {
  const bad = payload([{ type: 'text', label: 'Q', key: '' }]);
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.match(bad.error ?? '', /Key/);

  const dup = payload([
    { type: 'text', label: 'Q1', key: 'q1' },
    { type: 'text', label: 'Q2', key: 'q1' },
  ]);
  assert.equal(dup.ok, false);
  if (!dup.ok) assert.match(dup.error ?? '', /trùng/);
});

test('form payload: logic phải tham chiếu câu ĐẦU TRƯỚC', () => {
  const forward = payload([
    { type: 'text', label: 'Q1', key: 'q1', logic: { questionKey: 'q2', op: 'answered' } },
    { type: 'text', label: 'Q2', key: 'q2' },
  ]);
  assert.equal(forward.ok, false);
  if (!forward.ok) assert.match(forward.error ?? '', /ĐẦU TRƯỚC/);

  const self = payload([
    { type: 'text', label: 'Q1', key: 'q1', logic: { questionKey: 'q1', op: 'answered' } },
  ]);
  assert.equal(self.ok, false);
});

test('form payload: giá trị logic phải hợp lệ theo loại câu tham chiếu', () => {
  const notOption = payload([
    { type: 'single_choice', label: 'Q1', key: 'q1', options: ['Có', 'Không'] },
    { type: 'text', label: 'Q2', key: 'q2', logic: { questionKey: 'q1', op: 'eq', value: 'Maybe' } },
  ]);
  assert.equal(notOption.ok, false);

  const badOp = payload([
    { type: 'single_choice', label: 'Q1', key: 'q1', options: ['Có', 'Không'] },
    { type: 'text', label: 'Q2', key: 'q2', logic: { questionKey: 'q1', op: 'gte', value: 'Có' } },
  ]);
  assert.equal(badOp.ok, false);

  const badRating = payload([
    { type: 'rating', label: 'Q1', key: 'q1' },
    { type: 'text', label: 'Q2', key: 'q2', logic: { questionKey: 'q1', op: 'gte', value: 9 } },
  ]);
  assert.equal(badRating.ok, false);

  const ok = payload([
    { type: 'single_choice', label: 'Q1', key: 'q1', options: ['Có', 'Không'] },
    { type: 'text', label: 'Q2', key: 'q2', logic: { questionKey: 'q1', op: 'eq', value: 'Có' } },
  ]);
  assert.equal(ok.ok, true);
  if (ok.ok && ok.value) assert.deepEqual(ok.value.questions[1].logic, { questionKey: 'q1', op: 'eq', value: 'Có' });
});

test('form payload: op không cần value được chuẩn hóa không có value', () => {
  const ok = payload([
    { type: 'text', label: 'Q1', key: 'q1' },
    { type: 'text', label: 'Q2', key: 'q2', logic: { questionKey: 'q1', op: 'answered', value: 'bị bỏ' } },
  ]);
  assert.equal(ok.ok, true);
  if (ok.ok && ok.value) assert.deepEqual(ok.value.questions[1].logic, { questionKey: 'q1', op: 'answered' });
});

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initDb, resetDb } from '../../src/db/client.mjs';
import { upsertAdmin, findByUsername } from '../../src/db/admins.mjs';
import {
  createForm,
  getForm,
  getFormBySlug,
  listForms,
  syncQuestions,
  setStatus,
  slugExists,
  updateFormMeta,
  deleteForm,
} from '../../src/db/forms.mjs';
import { insertResponse, listResponses, responseStats, countResponses } from '../../src/db/responses.mjs';
import { cloneForm } from '../../src/db/clone.mjs';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'tadquiz-db-'));
  initDb(join(dir, 'test.sqlite'));
});

afterEach(() => {
  resetDb();
  rmSync(dir, { recursive: true, force: true });
});

test('upsertAdmin tạo mới rồi reset mật khẩu', () => {
  const first = upsertAdmin('root', 'scrypt$aa$bb');
  assert.equal(first.created, true);
  const second = upsertAdmin('ROOT', 'scrypt$cc$dd');
  assert.equal(second.created, false);
  assert.equal(second.id, first.id);
  const row = findByUsername('root');
  if (row === undefined) throw new Error('thiếu admin row');
  assert.equal(row.password_hash, 'scrypt$cc$dd');
});

test('form CRUD + slug duy nhất', () => {
  const admin = upsertAdmin('root', 'scrypt$aa$bb');
  const id = createForm({ slug: 'khao-sat', title: 'Khảo sát', createdBy: admin.id });
  assert.ok(slugExists('khao-sat'));
  assert.ok(!slugExists('khao-sat', id));

  syncQuestions(id, [
    { key: 'q1', type: 'text', label: 'Tên bạn?', required: true },
    { key: 'q2', type: 'rating', label: 'Đánh giá?', required: false },
  ]);
  const form = getForm(id);
  if (form === null) throw new Error('thiếu form');
  assert.equal(form.questions.length, 2);
  assert.equal(form.questions[0].type, 'text');
  assert.equal(form.status, 'draft');

  updateFormMeta(id, { title: 'Khảo sát 2026' });
  const renamed = getForm(id);
  if (renamed === null) throw new Error('thiếu form sau rename');
  assert.equal(renamed.title, 'Khảo sát 2026');
  const bySlug = getFormBySlug('khao-sat');
  if (bySlug === null) throw new Error('thiếu form theo slug');
  assert.equal(bySlug.id, id);

  setStatus(id, 'published');
  const published = getForm(id);
  if (published === null) throw new Error('thiếu form sau publish');
  assert.equal(published.status, 'published');
});

test('syncQuestions đồng bộ theo key: cập nhật, thêm, xóa đúng', () => {
  const admin = upsertAdmin('root', 'scrypt$aa$bb');
  const id = createForm({ slug: 's', title: 'S', createdBy: admin.id });
  syncQuestions(id, [
    { key: 'q1', type: 'text', label: 'Q1' },
    { key: 'q2', type: 'text', label: 'Q2' },
  ]);
  syncQuestions(id, [
    { key: 'q1', type: 'text', label: 'Q1 (đã sửa)' },
    { key: 'q3', type: 'textarea', label: 'Only' },
  ]);
  const form = getForm(id);
  if (form === null) throw new Error('thiếu form');
  assert.equal(form.questions.length, 2);
  assert.deepEqual(
    form.questions.map((q) => q.label),
    ['Q1 (đã sửa)', 'Only'],
  );
  assert.equal(form.questions[0].key, 'q1');
  assert.equal(form.questions[1].type, 'textarea');
});

test('syncQuestions giữ nguyên id câu hỏi → answers không mất khi sửa form', () => {
  const admin = upsertAdmin('root', 'scrypt$aa$bb');
  const id = createForm({ slug: 's2', title: 'S2', createdBy: admin.id });
  syncQuestions(id, [
    { key: 'q1', type: 'text', label: 'Tên' },
    { key: 'q2', type: 'rating', label: 'Sao?' },
  ]);
  const before = getForm(id)!.questions;
  insertResponse(id, [
    { questionId: before[0].id, value: '"An"' },
    { questionId: before[1].id, value: '5' },
  ]);

  syncQuestions(id, [
    { key: 'q1', type: 'text', label: 'Tên (sửa)' },
    { key: 'q2', type: 'rating', label: 'Sao? (sửa)' },
  ]);
  const after = getForm(id)!.questions;
  assert.equal(after[0].id, before[0].id);
  assert.equal(after[1].id, before[1].id);
  assert.equal(after[0].label, 'Tên (sửa)');
  const rows = listResponses(id);
  assert.equal(rows.length, 1);
  assert.equal(Object.keys(rows[0].answers).length, 2);
});

test('syncQuestions lưu và đọc lại logic điều kiện', () => {
  const admin = upsertAdmin('root', 'scrypt$aa$bb');
  const id = createForm({ slug: 's3', title: 'S3', createdBy: admin.id });
  syncQuestions(id, [
    { key: 'q9', type: 'single_choice', label: 'Nhận tin?', options: ['Có', 'Không'] },
    {
      key: 'q10',
      type: 'text',
      label: 'Email',
      logic: { questionKey: 'q9', op: 'eq', value: 'Có' },
    },
  ]);
  const form = getForm(id)!;
  assert.equal(form.questions[1].logic?.questionKey, 'q9');
  assert.equal(form.questions[1].logic?.op, 'eq');
  assert.equal(form.questions[1].logic?.value, 'Có');
  assert.equal(form.questions[0].logic, null);
});

test('responses: insert + list + stats + count trong listForms', () => {
  const admin = upsertAdmin('root', 'scrypt$aa$bb');
  const id = createForm({ slug: 's', title: 'S', createdBy: admin.id });
  syncQuestions(id, [
    { key: 'q1', type: 'text', label: 'Tên' },
    { key: 'q2', type: 'multi_choice', label: 'Chọn', options: ['a', 'b'] },
  ]);
  const withQs = getForm(id);
  if (withQs === null) throw new Error('thiếu form');
  const questions = withQs.questions;

  const rid = insertResponse(
    id,
    [
      { questionId: questions[0].id, value: JSON.stringify('An') },
      { questionId: questions[1].id, value: JSON.stringify(['a', 'b']) },
    ],
    { ip: '127.0.0.1' },
  );
  assert.ok(rid > 0);

  const rows = listResponses(id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].answers[String(questions[0].id)], 'An');
  assert.deepEqual(rows[0].answers[String(questions[1].id)], ['a', 'b']);

  const stats = responseStats(id);
  assert.equal(stats.total, 1);
  assert.ok(stats.latest);

  const summaries = listForms();
  assert.equal(summaries.find((f) => f.id === id)?.responseCount, 1);
});

test('deleteForm cascade responses + questions', () => {
  const admin = upsertAdmin('root', 'scrypt$aa$bb');
  const id = createForm({ slug: 's', title: 'S', createdBy: admin.id });
  syncQuestions(id, [{ key: 'q1', type: 'text', label: 'Q1' }]);
  insertResponse(id, [{ questionId: getForm(id)!.questions[0].id, value: '"x"' }]);
  deleteForm(id);
  assert.equal(getForm(id), null);
  assert.equal(listResponses(id).length, 0);
  assert.equal(slugExists('s'), false);
});

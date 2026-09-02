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
  replaceQuestions,
  setStatus,
  slugExists,
  updateFormMeta,
  deleteForm,
} from '../../src/db/forms.mjs';
import { insertResponse, listResponses, responseStats } from '../../src/db/responses.mjs';

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
  assert.equal(row.password_hash, 'scrypt$cc$dd');
});

test('form CRUD + slug duy nhất', () => {
  const admin = upsertAdmin('root', 'scrypt$aa$bb');
  const id = createForm({ slug: 'khao-sat', title: 'Khảo sát', createdBy: admin.id });
  assert.ok(slugExists('khao-sat'));
  assert.ok(!slugExists('khao-sat', id));

  replaceQuestions(id, [
    { type: 'text', label: 'Tên bạn?', required: true },
    { type: 'rating', label: 'Đánh giá?', required: false },
  ]);
  const form = getForm(id);
  assert.equal(form.questions.length, 2);
  assert.equal(form.questions[0].type, 'text');
  assert.equal(form.status, 'draft');

  updateFormMeta(id, { title: 'Khảo sát 2026' });
  assert.equal(getForm(id).title, 'Khảo sát 2026');
  assert.equal(getFormBySlug('khao-sat').id, id);

  setStatus(id, 'published');
  assert.equal(getForm(id).status, 'published');
});

test('replaceQuestions thay thế hoàn toàn theo thứ tự', () => {
  const admin = upsertAdmin('root', 'scrypt$aa$bb');
  const id = createForm({ slug: 's', title: 'S', createdBy: admin.id });
  replaceQuestions(id, [{ type: 'text', label: 'Q1' }, { type: 'text', label: 'Q2' }]);
  replaceQuestions(id, [{ type: 'textarea', label: 'Only' }]);
  const form = getForm(id);
  assert.equal(form.questions.length, 1);
  assert.equal(form.questions[0].label, 'Only');
  assert.equal(form.questions[0].type, 'textarea');
});

test('responses: insert + list + stats + count trong listForms', () => {
  const admin = upsertAdmin('root', 'scrypt$aa$bb');
  const id = createForm({ slug: 's', title: 'S', createdBy: admin.id });
  replaceQuestions(id, [
    { type: 'text', label: 'Tên' },
    { type: 'multi_choice', label: 'Chọn', options: ['a', 'b'] },
  ]);
  const questions = getForm(id).questions;

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
  replaceQuestions(id, [{ type: 'text', label: 'Q1' }]);
  insertResponse(id, [{ questionId: getForm(id).questions[0].id, value: '"x"' }]);
  deleteForm(id);
  assert.equal(getForm(id), null);
  assert.equal(listResponses(id).length, 0);
  assert.equal(slugExists('s'), false);
});

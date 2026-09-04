import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initDb, resetDb } from '../../src/db/client.mjs';
import { upsertAdmin } from '../../src/db/admins.mjs';
import { createForm, getForm, syncQuestions } from '../../src/db/forms.mjs';
import { insertResponse, countResponses } from '../../src/db/responses.mjs';
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

test('cloneForm: copy câu hỏi + logic + setting, slug không đụng, status draft', () => {
  const admin = upsertAdmin('root', 'scrypt$aa$bb');
  const id = createForm({ slug: 'goc', title: 'Gốc', createdBy: admin.id });
  syncQuestions(id, [
    { key: 'a', type: 'single_choice', label: 'Chọn?', options: ['Có', 'Không'], required: true },
    { key: 'b', type: 'text', label: 'Tên?', logic: { questionKey: 'a', op: 'eq', value: 'Có' } },
  ]);
  insertResponse(id, [{ questionId: getForm(id)!.questions[0].id, value: '"Có"' }]);

  const newId = cloneForm(id, admin.id);
  assert.ok(newId && newId !== id);
  const copy = getForm(newId)!;
  assert.equal(copy.status, 'draft');
  assert.equal(copy.slug, 'goc-copy');
  assert.equal(copy.title, 'Gốc (bản sao)');
  assert.equal(copy.responseCount, 0); // responses không theo bản sao
  assert.equal(copy.questions.length, 2);
  assert.equal(copy.questions[0].options.length, 2);
  assert.deepEqual(copy.questions[1].logic, { questionKey: 'a', op: 'eq', value: 'Có' });

  // Clone lần nữa → slug -2
  const second = cloneForm(id, admin.id);
  assert.equal(getForm(second)!.slug, 'goc-copy-2');

  // Form gốc nguyên vẹn
  assert.equal(getForm(id)!.responseCount, 1);
});

test('countResponses đếm đúng số phản hồi đã nhận', () => {
  const admin = upsertAdmin('root', 'scrypt$aa$bb');
  const id = createForm({ slug: 'dem', title: 'Đếm', createdBy: admin.id });
  syncQuestions(id, [{ key: 'q1', type: 'text', label: 'Q1' }]);
  assert.equal(countResponses(id), 0);
  insertResponse(id, [{ questionId: getForm(id)!.questions[0].id, value: '"1"' }]);
  insertResponse(id, [{ questionId: getForm(id)!.questions[0].id, value: '"2"' }]);
  assert.equal(countResponses(id), 2);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSlug, slugify, suggestUniqueSlug, RESERVED_SLUGS } from '../../src/lib/slug.ts';

test('validateSlug chấp nhận slug hợp lệ', () => {
  const result = validateSlug('khao-sat-gen-ix');
  assert.equal(result.ok, true);
  assert.equal(result.slug, 'khao-sat-gen-ix');
});

test('validateSlug normalize khoảng trắng và chữ hoa', () => {
  const result = validateSlug('  Khao Sat  ');
  assert.equal(result.slug, 'khao-sat');
  assert.equal(result.ok, true);
});

test('validateSlug từ chối quá ngắn', () => {
  assert.equal(validateSlug('ab').ok, false);
  assert.equal(validateSlug('').ok, false);
});

test('validateSlug từ chối ký tự lạ', () => {
  assert.equal(validateSlug('khao_sát').ok, false);
  assert.equal(validateSlug('-khao-sat').ok, false);
  assert.equal(validateSlug('khao-sat-').ok, false);
  assert.equal(validateSlug('khao--sat').ok, false);
});

test('validateSlug từ chối quá dài', () => {
  assert.equal(validateSlug('a'.repeat(65)).ok, false);
});

test('validateSlug từ chối reserved slugs', () => {
  for (const slug of ['admin', 'api', 'q', 'login']) {
    assert.ok(RESERVED_SLUGS.has(slug));
    assert.equal(validateSlug(slug).ok, false);
  }
});

test('slugify bỏ dấu tiếng Việt', () => {
  assert.equal(slugify('Khảo sát Thành viên Mới'), 'khao-sat-thanh-vien-moi');
  assert.equal(slugify('Đào Tạo Đội Hình'), 'dao-tao-doi-hinh');
});

test('slugify xử lý chuỗi rác', () => {
  assert.equal(slugify('!!!###'), '');
  assert.equal(slugify('  --a--  '), 'a');
});

test('suggestUniqueSlug trả base khi chưa trùng', () => {
  const exists = (s: string) => s === 'club-survey' || s === 'club-survey-2';
  assert.equal(suggestUniqueSlug('club-survey', exists), 'club-survey-3');
  assert.equal(suggestUniqueSlug('moi', () => false), 'moi');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvEscape, toCsv, answerToCell } from '../../src/lib/csv.ts';

test('csvEscape không đổi cell thường', () => {
  assert.equal(csvEscape('hello'), 'hello');
  assert.equal(csvEscape('Số 10'), 'Số 10');
});

test('csvEscape quote dấu phẩy, ngoặc kép, xuống dòng', () => {
  assert.equal(csvEscape('a,b'), '"a,b"');
  assert.equal(csvEscape('say "hi"'), '"say ""hi"""');
  assert.equal(csvEscape('line1\nline2'), '"line1\nline2"');
});

test('toCsv tạo BOM + CRLF', () => {
  const out = toCsv(['A', 'B'], [['1', '2']], true);
  assert.ok(out.startsWith('﻿'));
  assert.ok(out.includes('A,B\r\n1,2\r\n'));
});

test('toCsv không BOM khi tắt', () => {
  const out = toCsv(['A'], [['1']], false);
  assert.equal(out.codePointAt(0), 65 /* 'A' */);
});

test('answerToCell join mảng bằng " | "', () => {
  assert.equal(answerToCell(['a', 'b']), 'a | b');
  assert.equal(answerToCell(5), '5');
  assert.equal(answerToCell(null), '');
});

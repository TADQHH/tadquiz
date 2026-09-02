#!/usr/bin/env node
/** smoke-e2e.mjs — full-flow check against a RUNNING TADQuiz server.
 *
 *   E2E_BASE_URL=http://localhost:4321 E2E_USER=admin E2E_PASS=pass12345 \
 *     node scripts/smoke-e2e.mjs
 *
 * Flow: login → tạo form → sửa câu hỏi → publish → submit hợp lệ → submit lỗi
 * → CSV → middleware redirect → xóa form → logout.
 */
const BASE = (process.env.E2E_BASE_URL ?? 'http://localhost:4321').replace(/\/$/, '');
const USER = process.env.E2E_USER ?? 'admin';
const PASS = process.env.E2E_PASS ?? '';

let cookie = '';
let failures = 0;

function ok(name, cond, extra = '') {
  const mark = cond ? '✓' : '✗';
  console.log(`${mark} ${name}${extra ? ` — ${extra}` : ''}`);
  if (!cond) failures += 1;
}

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      // JSON content-type mọi request thay đổi — Astro checkOrigin chặn
      // POST/PUT/DELETE kiểu form (kể cả không có content-type).
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { res, json, text };
}

async function main() {
  if (!PASS) {
    console.error('Thiếu E2E_PASS (mật khẩu admin).');
    process.exit(1);
  }

  // 1. Middleware bảo vệ /admin khi chưa login
  const guard = await call('GET', '/admin');
  ok('middleware redirect /admin → /admin/login', guard.res.status === 302 && String(guard.res.headers.get('location') ?? '').startsWith('/admin/login'));

  // 2. Login sai
  const badLogin = await call('POST', '/api/auth/login', { username: USER, password: 'wrong-password' });
  ok('login sai bị từ chối 401', badLogin.res.status === 401);
  cookie = '';

  // 3. Login đúng
  const login = await call('POST', '/api/auth/login', { username: USER, password: PASS });
  ok('login đúng 200 + cookie', login.res.status === 200 && cookie.includes('tadquiz_session'));

  // 4. Tạo form
  const slug = `e2e-${Date.now().toString(36)}`;
  const created = await call('POST', '/api/forms', { title: 'E2E Khảo sát kiểm thử', slug });
  ok('tạo form 201', created.res.status === 201 && Boolean(created.json?.id));
  const id = created.json.id;

  // 5. PUT câu hỏi đủ 5 loại
  const put = await call('PUT', `/api/forms/${id}`, {
    title: 'E2E Khảo sát kiểm thử',
    slug,
    description: 'Kiểm thử tự động',
    questions: [
      { type: 'text', label: 'Tên bạn?', required: true },
      { type: 'textarea', label: 'Ý kiến thêm?', maxChars: 100 },
      { type: 'single_choice', label: 'Chọn một', options: ['A', 'B'], required: true },
      { type: 'multi_choice', label: 'Chọn nhiều', options: ['X', 'Y', 'Z'] },
      { type: 'rating', label: 'Đánh giá', required: true },
    ],
  });
  ok('PUT câu hỏi 200, 5 câu', put.res.status === 200 && put.json?.questions?.length === 5);
  const questions = put.json.questions;

  // 6. Publish
  const pub = await call('POST', `/api/forms/${id}/status`, { status: 'published' });
  ok('publish 200', pub.res.status === 200);

  // 7. Trang public render
  const quizPage = await call('GET', `/q/${slug}`);
  ok('trang /q/slug render 200', quizPage.res.status === 200 && quizPage.text.includes('E2E'));

  // 8. Submit hợp lệ
  const submit = await call('POST', `/api/q/${slug}/submit`, {
    answers: {
      [questions[0].id]: 'Robot E2E',
      [questions[1].id]: 'Không có',
      [questions[2].id]: 'A',
      [questions[3].id]: ['X', 'Z'],
      [questions[4].id]: 5,
    },
  });
  ok('submit hợp lệ 201', submit.res.status === 201 && submit.json?.redirect === `/q/${slug}/done`);

  // 9. Submit thiếu bắt buộc
  const badSubmit = await call('POST', `/api/q/${slug}/submit`, {
    answers: { [questions[2].id]: 'A' },
  });
  ok(
    'submit thiếu câu bắt buộc → 400 + fields',
    badSubmit.res.status === 400 && Boolean(badSubmit.json?.fields),
  );

  // 10. Slug trùng
  const dup = await call('PUT', `/api/forms/${id}`, {
    title: 'x', slug: 'admin', description: '', questions: [],
  });
  // 11. CSV — BOM check bằng bytes (res.text() tự strip BOM khi decode)
  const csvRes = await fetch(`${BASE}/api/forms/${id}/responses.csv`, {
    headers: { Cookie: cookie },
  });
  const csvBytes = new Uint8Array(await csvRes.arrayBuffer());
  const csvText = new TextDecoder('utf-8', { ignoreBOM: true }).decode(csvBytes);
  ok(
    'CSV có BOM + dữ liệu',
    csvRes.status === 200 &&
      csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf &&
      csvText.includes('Robot E2E') &&
      csvText.includes('X | Z'),
  );

  // 12. Logout + guard lại
  await call('POST', '/api/auth/logout');
  cookie = '';
  const guard2 = await call('GET', '/admin');
  ok('logout xong /admin redirect về login', guard2.res.status === 302);

  // 13. Dọn form e2e (login lại)
  await call('POST', '/api/auth/login', { username: USER, password: PASS });
  const del = await call('DELETE', `/api/forms/${id}`);
  ok('xóa form 200', del.res.status === 200);

  console.log(failures === 0 ? '\nE2E PASS — toàn bộ flow OK' : `\nE2E FAIL — ${failures} bước lỗi`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('E2E lỗi không mong đợi:', err);
  process.exit(1);
});

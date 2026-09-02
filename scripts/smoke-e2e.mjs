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

  // 5. PUT câu hỏi đủ 5 loại + 1 câu điều kiện (chỉ hiện khi câu 3 chọn 'A')
  const payload = {
    title: 'E2E Khảo sát kiểm thử',
    slug,
    description: 'Kiểm thử tự động',
    questions: [
      { key: 'q1', type: 'text', label: 'Tên bạn?', required: true },
      { key: 'q2', type: 'textarea', label: 'Ý kiến thêm?', maxChars: 100 },
      { key: 'q3', type: 'single_choice', label: 'Chọn một', options: ['A', 'B'], required: true },
      { key: 'q4', type: 'multi_choice', label: 'Chọn nhiều', options: ['X', 'Y', 'Z'] },
      { key: 'q5', type: 'rating', label: 'Đánh giá', required: true },
      {
        key: 'q6',
        type: 'text',
        label: 'Email (khi chọn A)',
        required: true,
        logic: { questionKey: 'q3', op: 'eq', value: 'A' },
      },
    ],
  };
  const put = await call('PUT', `/api/forms/${id}`, payload);
  ok(
    'PUT câu hỏi 200, 6 câu + logic',
    put.res.status === 200 && put.json?.questions?.length === 6 && put.json.questions[5].logic?.op === 'eq',
  );
  const questions = put.json.questions;

  // 6. Publish
  const pub = await call('POST', `/api/forms/${id}/status`, { status: 'published' });
  ok('publish 200', pub.res.status === 200);

  // 7. Trang public render
  const quizPage = await call('GET', `/q/${slug}`);
  ok('trang /q/slug render 200', quizPage.res.status === 200 && quizPage.text.includes('E2E'));

  // 8. Submit hợp lệ
  // 8. Submit hợp lệ — Q3='B' làm Q6 ẩn: required Q6 được bỏ qua,
  //    answer cố tình gửi cho Q6 ẩn phải bị server drop.
  const submit = await call('POST', `/api/q/${slug}/submit`, {
    answers: {
      [questions[0].id]: 'Robot E2E',
      [questions[1].id]: 'Không có',
      [questions[2].id]: 'B',
      [questions[3].id]: ['X', 'Z'],
      [questions[4].id]: 5,
      [questions[5].id]: 'an@hidden.dev',
    },
  });
  ok('submit hợp lệ 201 (câu điều kiện ẩn)', submit.res.status === 201 && submit.json?.redirect === `/q/${slug}/done`);

  // 9. Submit khi Q3='A' → Q6 hiện + bắt buộc → thiếu phải 400
  const badSubmit = await call('POST', `/api/q/${slug}/submit`, {
    answers: {
      [questions[0].id]: 'Robot E2E 2',
      [questions[2].id]: 'A',
      [questions[4].id]: 4,
    },
  });
  ok(
    'submit thiếu câu điều kiện bắt buộc → 400 + fields',
    badSubmit.res.status === 400 && Boolean(badSubmit.json?.fields?.[String(questions[5].id)]),
  );

  // 10. Slug trùng
  await call('PUT', `/api/forms/${id}`, {
    title: 'x', slug: 'admin', description: '', questions: [],
  });
  // 11. CSV — BOM check bằng bytes (res.text() tự strip BOM khi decode);
  //     answer của câu ẩn (an@hidden.dev) phải KHÔNG xuất hiện.
  const csvRes = await fetch(`${BASE}/api/forms/${id}/responses.csv`, {
    headers: { Cookie: cookie },
  });
  const csvBytes = new Uint8Array(await csvRes.arrayBuffer());
  const csvText = new TextDecoder('utf-8', { ignoreBOM: true }).decode(csvBytes);
  ok(
    'CSV có BOM + dữ liệu, đã drop answer câu ẩn',
    csvRes.status === 200 &&
      csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf &&
      csvText.includes('Robot E2E') &&
      csvText.includes('X | Z') &&
      !csvText.includes('an@hidden.dev'),
  );

  // 11b. Sửa form giữ nguyên key → id câu hỏi + response cũ phải còn nguyên
  const rePut = await call('PUT', `/api/forms/${id}`, payload);
  ok(
    're-PUT giữ id câu hỏi (answers không mất)',
    rePut.res.status === 200 &&
      rePut.json?.questions?.map((q) => q.id).join(',') === questions.map((q) => q.id).join(','),
  );
  const csvRes2 = await fetch(`${BASE}/api/forms/${id}/responses.csv`, {
    headers: { Cookie: cookie },
  });
  const csvText2 = await csvRes2.text();
  ok('response cũ còn sau khi sửa form', csvText2.includes('Robot E2E'));



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

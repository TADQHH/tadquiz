# TADQuiz

Nền tảng quiz/khảo sát tự host — form public qua slug tùy chỉnh, admin quản lý form + xem/xuất phản hồi. Design system **TAD** (đỏ/đen/paper — brutalist). Stack: Astro 5 (SSR, Node adapter) + React 19 islands + Tailwind v4 + SQLite (better-sqlite3).

## Tính năng

- 5 loại câu hỏi: text, textarea, chọn một, chọn nhiều, thang đo 1–5; điều khiển toàn bộ bằng bàn phím (phím số/chữ chọn đáp án, Enter chuyển câu).
- **Câu hỏi điều kiện** kiểu Google Forms: mỗi câu có thể đặt "chỉ hiển thị khi" một câu trước đó thỏa điều kiện (bằng/khác đáp án, so sánh thang đo, chứa chữ, đã/chưa trả lời…). Câu ẩn không hiện, không bắt buộc; chuỗi phụ thuộc tự cascade. Server tự lọc lại visibility khi submit — client gian lận bị drop answer.
- Sửa form **không mất phản hồi cũ**: câu hỏi đồng bộ theo key ổn định, id câu hỏi giữ nguyên qua mỗi lần lưu.
- Xem phản hồi 3 chế độ: **Tổng hợp** (thống kê từng câu: bar chart + %, trung bình thang đo, danh sách câu trả lời text), **Từng phản hồi** (bảng + card + modal chi tiết, tìm kiếm), **Bảng tính** (grid full-width sticky header kiểu Google Sheets). Xuất CSV (có BOM cho Excel).
- Quản trị: dashboard, editor kéo thứ tự, publish/close, slug tùy chỉnh, rate-limit submit 10/phút/IP.

## Chạy nhanh (Docker)

```bash
# tạo admin lần đầu:
docker compose exec web ./scripts/create-admin.sh
# nhập username + mật khẩu khi được hỏi
# mở http://localhost:8090 — admin: http://localhost:8090/admin
```

Dữ liệu SQLite nằm trong volume `tadquiz-data` (`/data/tadquiz.sqlite`).


## Chạy dev (không Docker)

```bash
npm install
npm run dev          # tự chạy gen-env → http://localhost:4321
node scripts/create-admin.mjs admin --password <pw>   # tạo admin
```

## .env tự sinh

`scripts/gen-env.mjs` sinh `.env` **idempotent**: key nào chưa có trong `.env` (và không nằm trong process env) mới được ghi — key đã tồn tại thì giữ nguyên giá trị. Chạy bằng `npm run gen:env`; container tự chạy ở entrypoint.

| Key | Mặc định |
|---|---|
| `PORT` / `HOST` | `4321` / `0.0.0.0` |
| `SITE_URL` | `http://localhost:4321` |
| `DATABASE_PATH` | `./data/tadquiz.sqlite` |
| `SESSION_SECRET` | random 64 hex |
| `SESSION_TTL_HOURS` | `72` |
| `PUBLIC_SITE_NAME` | `TADQuiz` |

## Tài khoản admin

Không có tính năng đăng ký. Duy nhất qua script trên server:

```bash
node scripts/create-admin.mjs <username> [--password <pw>] [--yes]
# hoặc: TADQUIZ_ADMIN_PASSWORD=<pw> node scripts/create-admin.mjs <username>
```

Tài khoản tồn tại → script đặt lại mật khẩu (hỏi xác nhận trừ khi `--yes`).

## Kiểm thử

```bash
npm test              # unit + integration (node:test)
npm run build         # build production
npm run check         # astro check + giới hạn 200 dòng/file
# e2e chống server đang chạy:
E2E_USER=admin E2E_PASS=<pw> npm run test:e2e
```

## Cấu trúc

```
src/
  components/<feature>/   # mỗi component 1 folder, file ≤200 dòng
  layouts/  pages/  pages/api/
  db/       # SQLite: client, admins, forms, responses (.mjs — chia sẻ với scripts)
  lib/      # session, password (scrypt), slug, validation, csv, ratelimit, logic (điều kiện hiển thị)
scripts/    # gen-env.mjs, create-admin.mjs|sh, smoke-e2e.mjs, check-line-limit.mjs
docker/     # Dockerfile + entrypoint (gen-env)
```

## API

- `POST /api/auth/login|logout`
- `POST /api/forms` · `GET/PUT/DELETE /api/forms/:id` · `POST /api/forms/:id/status`
- `GET /api/forms/:id/responses.csv`
- `POST /api/q/:slug/submit` (public, rate-limit 10/phút/IP)

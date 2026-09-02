# TADQuiz

Nền tảng quiz/khảo sát tự host — form public qua slug tùy chỉnh, admin quản lý form + xem/xuất phản hồi. Design system **TAD** (đỏ/đen/paper — brutalist). Stack: Astro 5 (SSR, Node adapter) + React 19 islands + Tailwind v4 + SQLite (better-sqlite3).

## Chạy nhanh (Docker)

```bash
# tạo admin lần đầu:
docker compose exec web node scripts/create-admin.mjs admin
# nhập mật khẩu 2 lần khi được hỏi (hoặc thêm --password <pw>)
# mở http://localhost:8080 — admin: http://localhost:8080/admin
```

Dữ liệu SQLite nằm trong volume `tadquiz-data` (`/data/tadquiz.sqlite`).

Bootstrap admin ngay từ đầu (không cần lệnh riêng):

```yaml
# docker-compose.yml
environment:
  TADQUIZ_ADMIN_USER: admin
  TADQUIZ_ADMIN_PASSWORD: change-me-please
```

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
  lib/      # session, password (scrypt), slug, validation, csv, ratelimit
scripts/    # gen-env.mjs, create-admin.mjs, smoke-e2e.mjs, check-line-limit.mjs
docker/     # Dockerfile + entrypoint (gen-env + optional admin bootstrap)
```

## API

- `POST /api/auth/login|logout`
- `POST /api/forms` · `GET/PUT/DELETE /api/forms/:id` · `POST /api/forms/:id/status`
- `GET /api/forms/:id/responses.csv`
- `POST /api/q/:slug/submit` (public, rate-limit 10/phút/IP)

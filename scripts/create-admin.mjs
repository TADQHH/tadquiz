#!/usr/bin/env node
/** create-admin.mjs — non-interactive engine: scrypt hash + ghi SQLite.
 * Tương tác (hỏi user/pass) dùng scripts/create-admin.sh.
 *
 * Usage:
 *   node scripts/create-admin.mjs <username> --password <pw> [--yes]
 *   TADQUIZ_ADMIN_PASSWORD=<pw> node scripts/create-admin.mjs <username>
 *
 * Tài khoản đã tồn tại → đặt lại mật khẩu (hỏi xác nhận khi có TTY, trừ --yes).
 */
import { createInterface } from 'node:readline/promises';
import { stdout, stdin, argv, exit } from 'node:process';
import { hashPassword } from '../src/lib/password.mjs';
import { initDb } from '../src/db/client.mjs';
import { upsertAdmin, findByUsername } from '../src/db/admins.mjs';
import { validateUsername, validatePassword } from './lib/validate-credentials.mjs';

function parseArgs(args) {
  const out = { username: '', password: '', yes: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--password') {
      out.password = args[i + 1] ?? '';
      i += 1;
    } else if (args[i] === '--yes') {
      out.yes = true;
    } else if (!out.username) {
      out.username = args[i];
    }
  }
  return out;
}

async function main() {
  const { username, password: pwArg, yes } = parseArgs(argv.slice(2));
  const password = pwArg || process.env.TADQUIZ_ADMIN_PASSWORD || '';

  const usernameCheck = validateUsername(username);
  if (!usernameCheck.ok) {
    console.error(`Lỗi: ${usernameCheck.error}`);
    console.error('Tương tác: chạy scripts/create-admin.sh (không tham số).');
    exit(1);
  }
  const pwCheck = validatePassword(password);
  if (!pwCheck.ok) {
    console.error(`Lỗi: ${pwCheck.error}`);
    exit(1);
  }

  initDb();
  const existing = findByUsername(username);
  if (existing && !yes && stdin.isTTY) {
    const rl = createInterface({ input: stdin, output: stdout });
    const answer = await rl.question(`Admin "${username}" đã tồn tại — đặt lại mật khẩu? (y/N) `);
    rl.close();
    if (!/^y(es)?$/i.test(answer.trim())) {
      console.log('Đã hủy.');
      exit(0);
    }
  }

  const result = upsertAdmin(username, hashPassword(password));
  console.log(
    result.created
      ? `Đã tạo admin "${result.username}" (id ${result.id}).`
      : `Đã đặt lại mật khẩu admin "${result.username}" (id ${result.id}).`,
  );
  exit(0);
}

main().catch((err) => {
  console.error('Lỗi:', err instanceof Error ? err.message : err);
  exit(1);
});

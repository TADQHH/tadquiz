#!/usr/bin/env node
/** create-admin.mjs — the ONLY way admin accounts are created (no signup UI).
 *
 * Usage:
 *   node scripts/create-admin.mjs <username> [--password <pw>] [--yes]
 *   TADQUIZ_ADMIN_PASSWORD=<pw> node scripts/create-admin.mjs <username>
 *
 * With no --password/env value and a TTY it prompts twice (input hidden).
 * Existing account: password is reset after confirmation (or immediately with --yes).
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

async function promptPassword() {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const first = await rl.question('Mật khẩu (min 8 ký tự): ', { hideEchoBack: true });
    const second = await rl.question('Nhập lại mật khẩu: ', { hideEchoBack: true });
    return first === second ? first : null;
  } finally {
    rl.close();
  }
}

async function main() {
  const { username, password: pwArg, yes } = parseArgs(argv.slice(2));
  const envPw = process.env.TADQUIZ_ADMIN_PASSWORD ?? '';

  const usernameCheck = validateUsername(username);
  if (!usernameCheck.ok) {
    console.error(`Lỗi: ${usernameCheck.error}`);
    exit(1);
  }

  let password = pwArg || envPw;
  if (!password) {
    if (stdin.isTTY) {
      const prompted = await promptPassword();
      if (prompted === null) {
        console.error('Lỗi: hai lần nhập mật khẩu không khớp.');
        exit(1);
      }
      password = prompted;
    } else {
      console.error('Lỗi: truyền --password hoặc set TADQUIZ_ADMIN_PASSWORD khi chạy non-interactive.');
      exit(1);
    }
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
    const answer = await rl.question(
      `Admin "${username}" đã tồn tại — đặt lại mật khẩu? (y/N) `,
    );
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

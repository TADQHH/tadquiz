#!/bin/sh
# create-admin.sh — tạo admin TƯƠNG TÁC (chạy không cần tham số).
#   ./scripts/create-admin.sh   |   npm run admin   |   docker compose exec web ./scripts/create-admin.sh
# POSIX sh (alpine-compatible); phần scrypt + ghi SQLite do create-admin.mjs đảm nhận.
set -eu

HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ENGINE="$HERE/create-admin.mjs"

# Truyền tham số → chuyển thẳng sang engine non-interactive.
if [ "$#" -gt 0 ]; then
  exec node "$ENGINE" "$@"
fi

if [ ! -t 0 ]; then
  echo "Lỗi: chế độ tương tác cần terminal. Non-interactive: create-admin.sh <username> --password <pw>" >&2
  exit 1
fi

USERNAME=''
i=0
while [ "$i" -lt 3 ]; do
  i=$((i + 1))
  printf 'Tên đăng nhập admin (3–32 ký tự, a–z 0–9 _ . -): '
  read -r USERNAME
  if printf '%s' "$USERNAME" | grep -qE '^[a-zA-Z0-9_.-]{3,32}$'; then
    break
  fi
  echo '  ✗ Tên đăng nhập không hợp lệ.' >&2
  USERNAME=''
done
if [ -z "$USERNAME" ]; then
  echo 'Đã thử 3 lần — hủy.' >&2
  exit 1
fi

PASSWORD=''
i=0
while [ "$i" -lt 3 ]; do
  printf 'Mật khẩu (tối thiểu 8 ký tự): '
  stty -echo 2>/dev/null || true
  read -r PW1
  stty echo 2>/dev/null || true
  echo >&2
  printf 'Nhập lại mật khẩu: '
  stty -echo 2>/dev/null || true
  read -r PW2
  stty echo 2>/dev/null || true
  echo >&2
  if [ "$PW1" != "$PW2" ]; then
    echo '  ✗ Hai lần nhập không khớp.' >&2
    continue
  fi
  if [ "${#PW1}" -lt 8 ]; then
    echo '  ✗ Mật khẩu cần tối thiểu 8 ký tự.' >&2
    continue
  fi
  PASSWORD=$PW1
  break
done
if [ -z "$PASSWORD" ]; then
  echo 'Đã thử 3 lần — hủy.' >&2
  exit 1
fi

exec node "$ENGINE" "$USERNAME" --password "$PASSWORD"

#!/bin/sh
set -e

# Idempotent .env generation — only appends keys missing from .env AND process env.
node scripts/gen-env.mjs

# Optional first-run admin bootstrap (non-interactive).
if [ -n "$TADQUIZ_ADMIN_USER" ] && [ -n "$TADQUIZ_ADMIN_PASSWORD" ]; then
  node scripts/create-admin.mjs "$TADQUIZ_ADMIN_USER" --password "$TADQUIZ_ADMIN_PASSWORD" --yes
fi

exec node dist/server/entry.mjs

#!/bin/sh
set -e

# Idempotent .env generation — only appends keys missing from .env AND process env.
node scripts/gen-env.mjs

# Export .env into the environment so the server (and the node adapter's
# HOST/PORT bootstrap) sees every key regardless of module load order.
# With compose env_file everything is already in the process environment;
# gen-env then skips writing the file — only source it when present.
if [ -f ./.env ]; then
  set -a
  . ./.env
  set +a
fi
exec node dist/server/entry.mjs

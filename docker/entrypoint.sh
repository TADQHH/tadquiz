#!/bin/sh
set -e

# Idempotent .env generation — only appends keys missing from .env AND process env.
node scripts/gen-env.mjs

# Export .env into the environment so the server (and the node adapter's
# HOST/PORT bootstrap) sees every key regardless of module load order.
set -a
. ./.env
set +a

exec node dist/server/entry.mjs

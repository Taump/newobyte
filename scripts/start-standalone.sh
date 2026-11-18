#!/bin/sh
# Production without Docker: serves the standalone build made by `pnpm build`.
#   pnpm build && pnpm start:prod
# Reads .env (the environment wins) and fills an empty installation from seed/. The static files
# are put next to server.js by `pnpm build` (scripts/postbuild.mjs); relative database / uploads
# paths mean the project folder (src/payload/paths.ts); a development database is refused.
set -eu
cd "$(dirname "$0")/.."
[ -f .next/standalone/server.js ] || { echo 'No build found: run pnpm build first' >&2; exit 1; }

# .env fills in what the environment doesn't set (the environment wins)
if [ -f .env ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in '' | \#*) continue ;; esac
    key=${line%%=*}
    case "$key" in '' | *[!A-Za-z0-9_]*) continue ;; esac
    value=${line#*=}
    value=${value#\"}; value=${value%\"}
    if eval "[ -z \"\${$key+set}\" ]"; then export "$key=$value"; fi
  done < .env
fi
case "${DATABASE_URL:-}" in
  file:./*) DATABASE_URL="file:$PWD/${DATABASE_URL#file:./}" ;;
  file:/*) ;;
  file:*) DATABASE_URL="file:$PWD/${DATABASE_URL#file:}" ;;
esac
export DATABASE_URL
export MEDIA_DIR="${MEDIA_DIR:-$PWD/media}"
export NODE_ENV=production

# a new installation starts with the content the site ships with (seed/)
sh scripts/seed-data.sh "${DATABASE_URL#file:}" "$MEDIA_DIR"

export PORT="${PORT:-3000}"
exec node .next/standalone/server.js

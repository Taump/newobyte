#!/bin/sh
# Local development: start from the content the site ships with (seed/) — the database from
# DATABASE_URL in .env (default ./.db) and ./media, if they don't exist yet.
set -eu
cd "$(dirname "$0")/.."
url=$(grep -E '^DATABASE_URL=' .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"')
db=${url#file:}
db=${db:-./.db}
sh scripts/seed-data.sh "$db" ./media

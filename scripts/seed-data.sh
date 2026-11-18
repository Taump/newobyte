#!/bin/sh
# Fills an empty installation with the content the site ships with (seed/, see pnpm db:export):
#   scripts/seed-data.sh <database file> <uploads dir> [seed dir]
# The database is copied only if the file doesn't exist, the uploads only into an empty folder —
# a live site is never touched. Used by the Docker entrypoint, scripts/start-standalone.sh and
# `pnpm db:init` (local development).
set -eu
DB=$1
MEDIA=$2
SEED=${3:-$(dirname "$0")/../seed}

if [ ! -s "$DB" ]; then
  mkdir -p "$(dirname "$DB")"
  cp "$SEED/payload.db" "$DB"
  echo "seed: database → $DB"
fi
mkdir -p "$MEDIA"
if [ -z "$(ls -A "$MEDIA")" ]; then
  cp -R "$SEED/media/." "$MEDIA/"
  echo "seed: uploads → $MEDIA"
fi

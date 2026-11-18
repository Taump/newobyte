#!/bin/sh
# Build and (re)start the site on the VPS, from a checkout of this repository:
#   deploy/deploy.sh            # data in /srv/obyte (OBYTE_ROOT)
# - first deploy (no database yet): pages are pre-rendered from the shipped content (seed/), and
#   the container fills the empty data folders with it on start;
# - later deploys: pre-rendered from a snapshot of the live database, so admin edits are kept.
# Pending migrations run when the container starts.
set -eu
ROOT=${OBYTE_ROOT:-/srv/obyte}
. "$ROOT/.env" # NEXT_PUBLIC_SERVER_URL
mkdir -p "$ROOT/data" "$ROOT/media"

set --
if [ -s "$ROOT/data/payload.db" ]; then
  mkdir -p "$ROOT/build-snapshot"
  sqlite3 "$ROOT/data/payload.db" ".backup '$ROOT/build-snapshot/payload.db'"
  set -- --build-context data="$ROOT/build-snapshot"
fi

docker build "$@" --build-arg NEXT_PUBLIC_SERVER_URL="$NEXT_PUBLIC_SERVER_URL" -t obyte-site:latest .
rm -f "$ROOT/build-snapshot/payload.db"

docker compose -f deploy/docker-compose.yml up -d
docker image prune -f >/dev/null
echo "deployed: $(docker compose -f deploy/docker-compose.yml ps --format '{{.Status}}')"

#!/bin/sh
# Daily backup (cron: `15 3 * * * /srv/obyte/app/deploy/backup.sh`): a consistent SQLite copy
# + the uploads, kept 14 days. Copy /srv/obyte/backups off the server as well.
# The copy holds no accounts: the admin comes from ADMIN_EMAIL / ADMIN_PASSWORD and is recreated
# on start after a restore (src/payload/seed/envAdmin.ts).
set -eu
ROOT=${OBYTE_ROOT:-/srv/obyte}
DEST="$ROOT/backups"
STAMP=$(date +%Y-%m-%d)
mkdir -p "$DEST"
sqlite3 "$ROOT/data/payload.db" ".backup '$DEST/payload-$STAMP.db'"
sqlite3 "$DEST/payload-$STAMP.db" <<'SQL'
DELETE FROM payload_locked_documents_rels;
DELETE FROM payload_locked_documents;
DELETE FROM payload_preferences_rels;
DELETE FROM payload_preferences;
DELETE FROM users_sessions;
DELETE FROM users;
VACUUM;
SQL
gzip -f "$DEST/payload-$STAMP.db"
tar -czf "$DEST/media-$STAMP.tar.gz" -C "$ROOT" media
find "$DEST" -type f -mtime +14 -delete

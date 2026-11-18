#!/bin/sh
# Container start: a new installation gets the shipped content, then the server starts
# (pending migrations run on start, the admin account is synced from ADMIN_EMAIL/ADMIN_PASSWORD).
set -eu
sh /app/scripts/seed-data.sh "${DATABASE_URL#file:}" /app/media /app/seed
exec node server.js

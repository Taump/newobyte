# Deploying obyte.org (VPS + Docker + Cloudflare)

The site is one container: Next.js (standalone) + Payload with SQLite. The image ships with the site's content (`seed/`). The data lives on the host and survives re-deploys:

```
/srv/obyte/
  .env              secrets (below), chmod 600
  app/              checkout of this repository
  data/payload.db   database (volume /app/data)
  media/            uploads (volume /app/media)
  backups/          daily copies (deploy/backup.sh)
```

## First deploy

1. Create `/srv/obyte/.env`:
   ```sh
   PAYLOAD_SECRET=…            # openssl rand -hex 32; the app refuses to start without it
   NEXT_PUBLIC_SERVER_URL=https://obyte.org
   ADMIN_EMAIL=…               # the only admin account: created on every start, or its password
   ADMIN_PASSWORD=…            # reset to this one (≥ 12 characters); any other account is removed
   ADMIN_PATH=/…               # optional hidden admin URL (/admin then answers 404); keep it private
   ```
2. Prepare the data folders. The container runs as uid 1001:
   ```sh
   mkdir -p /srv/obyte/data /srv/obyte/media
   chown 1001:1001 /srv/obyte/data /srv/obyte/media
   ```
3. Run `cd /srv/obyte/app && deploy/deploy.sh`.

With no database yet, the pages are pre-rendered from the shipped content, and the container copies it into the empty `data/` and `media/` on start. The site comes up with all its content and no accounts; the admin is created from `ADMIN_*`.

To ship newer content, run `pnpm db:export` locally and commit `seed/` before the first deploy.

**Note:** the old site is still being edited. Changes made there after the last `pnpm db:export` must be carried over by hand. Don't run `pnpm migrate:grav` on production: it overwrites pages edited in the admin. Better to freeze edits on the old site around the switch.

## Updates

```sh
cd /srv/obyte/app && git pull && deploy/deploy.sh
```

`deploy.sh` does three things:
1. takes a snapshot of the live database (`sqlite3 .backup`) and pre-renders the pages from it (the database is mounted for the build only, never stored in the image);
2. builds the image;
3. restarts the container.

Live data is never replaced by `seed/`. Migrations added by the release run on start and keep the data. Admin edits rebuild the affected pages immediately, without a deploy.

To change the admin password or e-mail: edit `/srv/obyte/.env`, then run `docker compose -f deploy/docker-compose.yml up -d --force-recreate`.

Without Docker (Node + systemd): see "Production → Option B" in the main [`README.md`](../README.md).

## Backups

Add to cron: `15 3 * * * /srv/obyte/app/deploy/backup.sh`.

Every day it saves a consistent copy of the database (`sqlite3 .backup`, accounts removed) and an archive of the uploads, keeping 14 days. Also copy `/srv/obyte/backups` off the server.

To restore:
1. stop the container;
2. unpack `payload-<date>.db.gz` to `data/payload.db` (and the media archive, if needed);
3. start the container. The admin is created from `ADMIN_*` on start.

## Reverse proxy and Cloudflare

The container listens on `127.0.0.1:3000`. A proxy on the host terminates TLS — e.g. Caddy: `obyte.org { reverse_proxy 127.0.0.1:3000 }`. Cloudflare SSL mode: **Full (strict)**.

Cache:
- **`/_next/static/*` and `/fonts/*`:** cache forever (versioned names; the server sends `immutable`).
- **HTML:** don't cache it at the edge, or cache it per `Accept` header. The same URL serves HTML, or Markdown for AI agents (`Accept: text/markdown`), and a shared cache would mix them up. Pages update on the server right after an edit; if HTML is cached in Cloudflare, purge it after edits.
- **`/api/media/file/*`, `/animation/*`, `/user/*`, `/Byteball.pdf`:** the server sends `max-age=86400`, and Cloudflare may follow it.

Security:
- WAF rate limit on `/api/users/login` (e.g. 10/min per IP).
- Recommended: Cloudflare Access (zero trust) in front of the admin path (`ADMIN_PATH`, default `/admin`) and `/api/users*`.
- Registration is closed in production (`src/proxy.ts`), and accounts can't be created at all.

## DNS switch checklist

1. Archive the old site's reference capture `tests/fixtures/baseline/old` — after the switch obyte.org serves the new site.
2. Update the shipped content if needed (`pnpm db:export`, commit `seed/`), then deploy (see above).
3. Check the new site by IP or a temporary host:
   - `pnpm check:links --base https://<temp>`;
   - `E2E_BASE_URL=https://<temp> pnpm test:e2e`;
   - `PERF_BASE_URL=https://<temp> pnpm perf`.
4. Point the DNS at the VPS in Cloudflare.
5. Check `https://obyte.org/`, `/faq`, `/downloads/Obyte-win64.exe`, `/platform.md` and `/sitemap.xml`, then submit the sitemap in Google Search Console.

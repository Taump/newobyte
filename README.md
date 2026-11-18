# obyte.org

The [obyte.org](https://obyte.org) website: **Payload CMS 3** + **Next.js 16** (App Router), **Tailwind v4**, **SQLite**. Ported from the old Grav site — it looks the same pixel for pixel, but every page is static (SSG), all content is edited in the admin panel, and every page has a Markdown twin for AI agents.

**The site ships with its content.** `seed/` holds the content snapshot: the database without any accounts, plus the uploaded images. A new installation — local, Docker or bare Node — starts with every page, list, setting and image in place.

- Migration plan and history: [`docs/MIGRATION_PLAN.md`](docs/MIGRATION_PLAN.md)
- Server deployment (VPS, Cloudflare, backups, DNS switch): [`deploy/README.md`](deploy/README.md)

## Requirements

- Node.js 22.23+ (or 24.22+); pnpm via `corepack enable` (the version is pinned in `package.json` → `packageManager`)
- Docker — for the container setups
- `sqlite3` CLI — on the server, for backups

## Environment

`cp .env.example .env`

| Variable | Needed | What it is |
|---|---|---|
| `DATABASE_URL` | always | SQLite file: `file:./.db` locally; in Docker it is set by the image |
| `PAYLOAD_SECRET` | always | random string (`openssl rand -hex 32`); the app refuses to start without it |
| `NEXT_PUBLIC_SERVER_URL` | production, **at build time** | `https://obyte.org` — canonical URLs, Open Graph, sitemap, CORS/CSRF. Inlined into the build: set it before `pnpm build` (Docker: `--build-arg`). Leave empty locally |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | production | the only admin-panel account (see [Admin account](#admin-account)) |
| `ADMIN_PATH` | optional | hidden admin URL, e.g. `/k3x9-panel-7q2m` (default `/admin`) |
| `MEDIA_DIR` | production without Docker | absolute uploads directory (default `./media`) |

## Local development

### Without Docker

```sh
cp .env.example .env          # set PAYLOAD_SECRET
pnpm install
pnpm db:init                  # the shipped content → ./.db and ./media (only if they don't exist)
pnpm dev                      # http://localhost:3000, admin panel at /admin
```

To log in locally, set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (the seed has no accounts). In development Payload syncs the database schema on start (push).

### In Docker (development)

```sh
pnpm db:init                  # once, if ./.db doesn't exist yet
docker compose up             # http://localhost:3000
```

A Node container mounts the project folder: the same `.env`, `./.db` and `./media` as `pnpm dev`.

## Production

- **Content.** A new installation starts from `seed/`. Later deploys keep the live database: admin edits are never rolled back.
- **Schema changes.** In production the schema changes only through migrations (`src/migrations`). They run when the server starts and keep the data.
- **Accounts.** There are no accounts in the database files or in backups; the admin comes from the environment.

### Option A: Docker (recommended)

The full guide is in [`deploy/README.md`](deploy/README.md). In short, on the server:

```sh
cd /srv/obyte/app && deploy/deploy.sh      # data in /srv/obyte/{data,media}, secrets in /srv/obyte/.env
```

To build and run the image manually:

```sh
docker build --build-arg NEXT_PUBLIC_SERVER_URL=https://obyte.org -t obyte-site .
docker run -p 3000:3000 \
  -e PAYLOAD_SECRET=… -e ADMIN_EMAIL=… -e ADMIN_PASSWORD=… \
  -v /srv/obyte/data:/app/data -v /srv/obyte/media:/app/media obyte-site
```

On start, empty `data` / `media` volumes are filled from the shipped content. Pages are pre-rendered at build time:
- from `seed/` by default;
- from a live database with `--build-context data=<folder with a payload.db snapshot>`. `deploy.sh` does this automatically once the site is running.

### Option B: without Docker (Node + systemd)

```sh
# on the server, in a checkout of this repository
corepack enable && pnpm install --frozen-lockfile
NEXT_PUBLIC_SERVER_URL=https://obyte.org pnpm build
pnpm start:prod               # node .next/standalone/server.js on $PORT (3000)
```

`pnpm start:prod` (`scripts/start-standalone.sh`):
- fills an empty database / uploads folder from `seed/`;
- copies the static files next to the standalone server;
- reads `.env` (the environment wins);
- makes the database and uploads paths absolute;
- refuses to run on a development database.

Example `/etc/systemd/system/obyte.service`:

```ini
[Unit]
Description=obyte.org
After=network.target

[Service]
User=obyte
WorkingDirectory=/srv/obyte/app
# PAYLOAD_SECRET, ADMIN_*, DATABASE_URL=file:/srv/obyte/data/payload.db, MEDIA_DIR=/srv/obyte/media
EnvironmentFile=/srv/obyte/.env
ExecStart=/usr/bin/sh scripts/start-standalone.sh
Restart=always

[Install]
WantedBy=multi-user.target
```

To update:

```sh
git pull && pnpm install --frozen-lockfile && pnpm build && systemctl restart obyte
```

The build pre-renders the pages from `DATABASE_URL`, so build with the live database. If a release adds migrations, run `pnpm payload migrate` against it first. Backups: `deploy/backup.sh`. Reverse proxy and Cloudflare: see `deploy/README.md`.

`pnpm build` also puts `public/` and the static assets next to the standalone server (`scripts/postbuild.mjs`), so `node .next/standalone/server.js` works directly as well. Relative paths in `DATABASE_URL` / `MEDIA_DIR` always mean the project folder.

### Trying the production build locally

Production refuses the development database (`./.db`, its schema is pushed by `pnpm dev`): the server would otherwise stop at a migration prompt. Use a separate database, filled from the shipped content:

```sh
pnpm build
DATABASE_URL=file:./prod-test.db pnpm start:prod     # creates prod-test.db from seed/ on first run
```

With `ADMIN_EMAIL` / `ADMIN_PASSWORD` set (password: at least 12 characters) you can log in to the admin panel. *.db files are gitignored.

> `pnpm start` (`next start`) also serves the build, but Next does not support it with `output: 'standalone'` — use `pnpm start:prod`.

## Admin account

The admin panel has exactly one account, defined by `ADMIN_EMAIL` / `ADMIN_PASSWORD`. On every start it is created, or its password is reset to the env value, and every other account is deleted.

- There is no registration. Nobody — not even the admin — can create, edit or delete accounts. To change the password or e-mail, change the env and restart.
- The first-register endpoints are closed in production (`src/proxy.ts`).
- After 5 failed logins the account is locked for 15 minutes.
- Without `ADMIN_*` (local development) existing accounts are left alone.

Database exports (`pnpm db:export`), the shipped `seed/` and daily backups (`deploy/backup.sh`) contain no accounts. After a restore the admin is created again on start.

**Hidden admin URL.** With `ADMIN_PATH=/k3x9-panel-7q2m` the admin panel answers only there:
- Payload builds every admin link from it, and `src/proxy.ts` maps it onto the internal `/admin` route;
- `/admin` itself answers 404;
- the path is not listed anywhere on the site (not in `robots.txt`, not in the sitemap).

This keeps scanners away, but it is obscurity, not access control: keep the path private, and use Cloudflare Access + a login rate limit (`deploy/README.md`) for real protection.

## Content in the admin panel

| Section | What's there |
|---|---|
| **Pages** | Pages built from blocks (Hero, Technology, Timeline, Team, Download, Exchanges, Article …). Inside articles: content blocks — page intro, image + text rows, card grids, callouts, distribution table, videos… Drafts and preview. |
| **Lists** | Team, Exchanges, Coin trackers, Social links, Timeline, Events, FAQ. Drag-and-drop order and a "Show on site" switch. FAQ is also the source of the FAQPage structured data. |
| **Header / Footer** | Menu, the "Download wallet" button, footer columns, MailerLite newsletter, copyright lines. |
| **Wallet releases** | Wallet builds per platform (mainnet / testnet), app store links, and the `/downloads/<file>` names (old links → 303 to the current build). |
| **Site settings** | Site title and description, default og:image, the `llms.txt` intro, contact e-mails, and the GitHub / explorer / Discord / Telegram addresses. |

- **Link tokens.** Any link may use them: `{github}/ocore`, `{explorer}/address/…`, `{testnetExplorer}`, `{discord}`, `{telegram}`. They are resolved from Site settings, so changing an address there updates every link.
- **E-mail addresses** in text are the inline "Email link" block.
- **Rebuilds.** An edit rebuilds the affected pages at once (on-demand revalidation). Header, footer, settings and lists rebuild the whole site.

## Updating the shipped content

```sh
pnpm db:export        # current content → seed/payload.db + seed/media/
```

The export:
1. takes a consistent snapshot of the database;
2. checks that its schema matches the migrations;
3. marks the migrations as applied;
4. removes every account and wipes them from the file (`VACUUM`);
5. collects every referenced upload.

Commit `seed/` afterwards. Existing installations are not affected — only new ones start from it.

## SEO and AI agents

Indexing:
- **Pages** are indexable: no `noindex`, canonical URL on each, all of them in the sitemap, real 404s for unknown URLs.
- **Admin panel and CMS API** are not indexed (`<meta name="robots" content="noindex">` + `X-Robots-Tag: noindex, nofollow`), except the uploaded images under `/api/media/file/`.
- **Markdown twins** send `Link: <page URL>; rel="canonical"`, so search engines index the HTML page instead.
- **`/llms*.txt`** are `noindex` (they are for agents, not search results).

- **Meta tags.** Same as the old site: `{page} | {site}`, description, Open Graph / Twitter, canonical.
- **JSON-LD.** Organization, WebSite and SoftwareApplication on the home page; FAQPage on /faq; BreadcrumbList elsewhere.
- **Crawlers.** `/sitemap.xml`, and `/robots.txt` with AI crawlers welcome.
- **Markdown twins.** `/platform.md`, `/index.md`, or `Accept: text/markdown`; plus `/llms.txt` and `/llms-full.txt`.
- **Old URLs.** `/downloads/*`, `/discord`, `/coin_info.json`, `/milan*`, `*.html`.

## Code layout

```
src/
  app/              Next routes (thin): (frontend) site, (payload) admin + API, md/, llms*.txt, sitemap, robots
  blocks/           page blocks: <Block>/{config.ts, <Block>.tsx, toMarkdown.ts}
  content-blocks/   blocks inside rich text, same layout; RichText.tsx, editors
  widgets/          Header, MobileNav, Footer, TextcoinBanner, Quote…
  payload/          CMS schema (collections, globals, hooks), queries, page meta, JSON-LD, page markdown
  shared/           ui, lib, cms (fields, access), styles (legacy CSS of the old pages), assets
  migrations/       production schema migrations (generated by Payload)
seed/               the content the site ships with (pnpm db:export)
scripts/            Grav migration, legacy CSS generator, export/seed, checks
deploy/             production: compose, deploy.sh, backup.sh, README
```

- **Imports flow downwards:** `app → payload → blocks / content-blocks / widgets → shared`. `eslint-plugin-boundaries` checks this (`pnpm lint`).
- **Styling:**
  - Tailwind for the layout, the home page and the components.
  - The inner pages use the old theme's CSS, ported to `src/shared/styles/legacy.css`. It is generated by `pnpm extract:legacy-css` (don't edit by hand); content blocks render the old markup and class names.

## Changing the schema (collections, fields, blocks)

1. Change the config. In development the schema is applied on restart.
2. Run `pnpm generate:types`. Also run `pnpm generate:importmap` if admin components were added.
3. Run `pnpm payload migrate:create <name>` and commit the file in `src/migrations/`.
4. Deploy: production applies the migration on start and keeps the data.

`pnpm db:export` refuses to export until the schema and the migrations match.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | development server |
| `pnpm db:init` | the shipped content → local database and `./media` (if missing) |
| `pnpm build` | production build (pre-renders every page from `DATABASE_URL`) |
| `pnpm start:prod` | production server without Docker (standalone) |
| `pnpm lint` | ESLint incl. the architecture layer rules |
| `pnpm test:int` | Vitest: access control and security, Grav migration, markdown, URLs |
| `pnpm test:e2e` | Playwright; against a running server: `E2E_BASE_URL=http://localhost:3000 pnpm test:e2e` |
| `pnpm generate:types` / `generate:importmap` | Payload types / admin import map |
| `pnpm payload migrate:create <name>` | migration after a schema change |
| `pnpm db:export` | update the shipped content `seed/` (no accounts) |
| `pnpm check:links --base <url>` | every link and resource of every page (`--no-external`: own URLs only) |
| `pnpm perf` | Lighthouse CI with budgets (`PERF_BASE_URL`, `PERF_PRESET=desktop`) |
| `pnpm migrate:grav` | import the content from Grav (`old-site/`) |
| `pnpm extract:legacy-css` | regenerate `legacy.css` + its images (WebP, phone crops) from the old theme |
| `pnpm media:sizes` | generate missing image sizes for older uploads |
| `pnpm baseline`, `visual:diff`, `baseline:query`, `compare:animation` | pixel comparison with the old site (screenshots, styles, animation frames) |

## The old site

The old Grav site lives in `old-site/` (gitignored). The site itself, its build and the Docker image don't need it. It is needed only by these tools:

- **`pnpm migrate:grav`** — content import.
  - Idempotent: pages are upserted by path, media matched by hash.
  - **Don't run it after content was edited in the admin**: it overwrites pages with their Grav version.
- **`pnpm extract:legacy-css`** — inner page styles and images.
- **`scripts/build-fonts.sh`** — webfonts.

The pixel-parity reference (`pnpm baseline` → `tests/fixtures/baseline/old`) was captured from the live obyte.org. Archive it before the DNS switch.

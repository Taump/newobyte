# Payload CMS + Next.js (SQLite)

Payload 3 app running inside Next.js, using SQLite (`@payloadcms/db-sqlite`) as the database. The database is a single file on disk, so no separate database server is needed.

## Local development

1. `cp .env.example .env` and set `PAYLOAD_SECRET` to a random string. `DATABASE_URL=file:./.db` stores the database in `./.db` in the project root.
2. `pnpm install && pnpm dev`
3. Open `http://localhost:3000/admin` and create the first admin user.

In development Payload syncs the database schema automatically, so changes in `./src/collections` apply on restart.

### Docker (optional)

`docker-compose.yml` runs the dev server in a Node container with the project directory mounted, so it uses the same `.env` and the same `./.db` file:

```sh
docker compose up
```

## Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details.

- **Users**: auth-enabled collection with access to the admin panel. See the [Authentication](https://payloadcms.com/docs/authentication/overview) docs.
- **Media**: upload-enabled collection with pre-configured image sizes and focal point.

## Useful scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` |
| `pnpm generate:importmap` | Regenerate the admin import map |
| `pnpm payload migrate:create` | Create a migration from schema changes |
| `pnpm payload migrate` | Apply pending migrations |
| `pnpm test` | Integration (Vitest) and e2e (Playwright) tests |

## Production

Schema auto-sync is disabled in production. Create migrations with `pnpm payload migrate:create` during development and run `pnpm payload migrate` before starting the production server.

### Docker image

The `Dockerfile` builds a Next.js standalone image (`output: 'standalone'` in `next.config.ts`):

```sh
docker build -t payload-app .
docker run -p 3000:3000 \
  -e PAYLOAD_SECRET=... \
  -v payload-data:/app/data \
  payload-app
```

The SQLite database is stored at `/app/data/payload.db` (`DATABASE_URL` is set in the image). Mount a volume on `/app/data` so data survives container re-creation.

Uploaded media files are written to the container filesystem by default. For production, either point the `Media` collection's `staticDir` at a mounted volume or use a storage adapter such as S3.

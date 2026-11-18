# syntax=docker/dockerfile:1.7
#
# Production image (Next.js standalone + Payload, SQLite) that ships with the site's content:
#
#   docker build --build-arg NEXT_PUBLIC_SERVER_URL=https://obyte.org -t obyte-site .
#
# - Pages are pre-rendered at build time from the content snapshot in seed/ — or, on a server
#   with a live database, from a snapshot of it: `--build-context data=<folder with payload.db>`
#   (deploy/deploy.sh does this, so admin edits are not rolled back by a rebuild). The database
#   is mounted for the build step only; the release's new migrations are applied to that
#   throwaway copy first, the live database gets them when the container starts.
# - A new installation (empty data volume) starts with seed/: database + uploads.
# - Afterwards edits in the admin rebuild the affected pages at runtime (on-demand revalidation).

# the content snapshot the site ships with (replaced by --build-context data=…)
FROM scratch AS data
COPY seed/payload.db /payload.db

FROM node:22.23.5-alpine AS base
# build hosts with broken IPv6: Node would try the registry's IPv6 address first and time out
# (corepack/pnpm UND_ERR_CONNECT_TIMEOUT) — prefer IPv4 addresses
ENV NODE_OPTIONS=--dns-result-order=ipv4first
# Optional mirrors for hosts that can't reach the default CDNs (e.g. foreign CDNs throttled in
# Russia): --build-arg ALPINE_MIRROR=https://mirror.yandex.ru/mirrors/alpine
#            --build-arg NPM_REGISTRY=https://npm-mirror.gitverse.ru/
# Defaults: the official sources. NPM_REGISTRY is used by corepack (pnpm download) and pnpm —
# pnpm ≥ 11 reads only pnpm_config_* (it ignores npm_config_registry).
ARG ALPINE_MIRROR=
ARG NPM_REGISTRY=https://registry.npmjs.org/
ENV COREPACK_NPM_REGISTRY=${NPM_REGISTRY} \
  pnpm_config_registry=${NPM_REGISTRY} \
  npm_config_registry=${NPM_REGISTRY}
# The network check prints the sources and whether they answer (see the build log when a step
# hangs); timeouts turn a hang into an error instead of a build that never ends.
RUN --mount=type=bind,source=scripts/docker-netcheck.sh,target=/tmp/netcheck.sh \
  if [ -n "$ALPINE_MIRROR" ]; then \
  sed -i "s|https\?://dl-cdn.alpinelinux.org/alpine|${ALPINE_MIRROR%/}|" /etc/apk/repositories; \
  fi \
  && sh /tmp/netcheck.sh \
  "$(head -1 /etc/apk/repositories)/$(apk --print-arch)/APKINDEX.tar.gz" \
  "${npm_config_registry%/}/pnpm" \
  && timeout 180 apk add --no-cache libc6-compat
RUN corepack enable

# ── dependencies ──
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# append-only: one line per event in the build log (no progress bar redraws)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
  echo "pnpm: downloading $(node -p 'require("./package.json").packageManager') via corepack" \
  && timeout 300 pnpm --version \
  && timeout 900 pnpm install --frozen-lockfile --reporter=append-only

# ── build ──
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# inlined into the bundles: canonical URLs, Open Graph, sitemap, CORS/CSRF
ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
# the build only reads content; the real secret is given to the running container
RUN --mount=type=bind,from=data,target=/data \
  test -n "$NEXT_PUBLIC_SERVER_URL" || (echo 'NEXT_PUBLIC_SERVER_URL build arg is required' && exit 1); \
  cp /data/payload.db /tmp/build.db \
  && export DATABASE_URL=file:/tmp/build.db PAYLOAD_SECRET=build-only \
  && pnpm payload migrate \
  && pnpm run build \
  && rm -f /tmp/build.db*

# ── runtime ──
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=3000 \
  HOSTNAME=0.0.0.0 \
  DATABASE_URL=file:/app/data/payload.db

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 -G nodejs nextjs
# SQLite database and uploads live on volumes (they survive re-deploys)
RUN mkdir -p /app/data /app/media /app/.next && chown nextjs:nodejs /app/data /app/media /app/.next
VOLUME ["/app/data", "/app/media"]

# the server + public/ + .next/static (completed by scripts/postbuild.mjs)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# shipped content for a new installation (copied into empty volumes by the entrypoint)
COPY --from=builder --chown=nextjs:nodejs /app/seed ./seed
COPY --from=builder --chown=nextjs:nodejs /app/scripts/seed-data.sh /app/scripts/docker-entrypoint.sh ./scripts/

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/robots.txt || exit 1
CMD ["sh", "/app/scripts/docker-entrypoint.sh"]

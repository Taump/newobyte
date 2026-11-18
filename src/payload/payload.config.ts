import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { seoPlugin } from '@payloadcms/plugin-seo'

import { ADMIN_PATH } from '@/shared/lib/adminPath'

import { migrations } from '../migrations'
import { assertProductionDatabase, resolveDatabaseUrl } from './paths'
import { Media } from './collections/Media'
import { HOME_SLUG, Pages } from './collections/Pages'
import { Events } from './collections/Events'
import { Faq } from './collections/Faq'
import { CoinTrackers, Exchanges } from './collections/Exchanges'
import { SocialLinks } from './collections/SocialLinks'
import { TeamMembers } from './collections/TeamMembers'
import { TimelineEvents } from './collections/TimelineEvents'
import { Users } from './collections/Users'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { Releases } from './globals/Releases'
import { SiteSettings } from './globals/SiteSettings'
import { syncEnvAdmin } from './seed/envAdmin'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const secret = process.env.PAYLOAD_SECRET
if (!secret) {
  throw new Error('PAYLOAD_SECRET is not set')
}

/*
 * Public origin (https://obyte.org). Unset in local development → Payload uses relative URLs, so
 * the admin (and its image previews) works on whatever port the dev server runs on. Production
 * must set it: CORS/CSRF are limited to it and absolute media URLs (OG images) derive from it.
 */
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || undefined
if (!serverURL && process.env.NODE_ENV === 'production') {
  console.warn(
    'NEXT_PUBLIC_SERVER_URL is not set — CORS/CSRF are not restricted to the site origin',
  )
}

const databaseUrl = resolveDatabaseUrl(process.env.DATABASE_URL)
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
if (process.env.NODE_ENV === 'production' && !isBuild) assertProductionDatabase(databaseUrl)

export default buildConfig({
  serverURL,
  // public admin URL (ADMIN_PATH, default /admin) — mapped onto the /admin route by src/proxy.ts
  routes: { admin: ADMIN_PATH },
  admin: {
    user: Users.slug,
    importMap: {
      // `src/` — component paths in configs are resolved relative to it
      baseDir: path.resolve(dirname, '..'),
    },
  },
  collections: [
    Pages,
    Events,
    Faq,
    TimelineEvents,
    TeamMembers,
    Exchanges,
    CoinTrackers,
    SocialLinks,
    Media,
    Users,
  ],
  globals: [Header, Footer, Releases, SiteSettings],
  editor: lexicalEditor(),
  secret,
  cors: serverURL ? [serverURL] : [],
  csrf: serverURL ? [serverURL] : [],
  graphQL: {
    disable: true,
  },
  typescript: {
    outputFile: path.resolve(dirname, '../payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: databaseUrl,
    },
    // development: the schema is pushed on start. Production: committed migrations
    // (`pnpm payload migrate:create <name>` after a schema change) run when the server starts —
    // not during `next build`, which only reads (and must not stop to ask about a dev database).
    prodMigrations: isBuild ? undefined : migrations,
  }),
  sharp,
  onInit: async (payload) => {
    await syncEnvAdmin(payload)
  },
  plugins: [
    nestedDocsPlugin({
      collections: ['pages'],
      generateLabel: (_, doc) => String(doc.menuTitle || doc.title),
      generateURL: (docs) =>
        docs.reduce((url, doc) => (doc.slug === HOME_SLUG ? url : `${url}/${doc.slug}`), '') || '/',
    }),
    seoPlugin({
      collections: ['pages'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => doc?.title ?? '',
    }),
  ],
})

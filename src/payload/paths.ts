import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

/**
 * The project folder. The standalone server (`node .next/standalone/server.js`) changes its
 * working directory into .next/standalone — relative paths from .env (`file:./.db`, `media`)
 * still mean the project folder, as in development. In Docker the working directory is /app.
 */
export const PROJECT_ROOT = process.cwd().replace(/[\\/]\.next[\\/]standalone[\\/]?$/, '')

/** SQLite URL with a relative file path resolved against the project folder. */
export function resolveDatabaseUrl(url: string | undefined): string {
  if (!url) return ''
  const m = /^file:(?!\/)(.+)$/.exec(url)
  return m ? `file:${path.resolve(PROJECT_ROOT, m[1])}` : url
}

/** Uploads directory: MEDIA_DIR (absolute or relative to the project) or ./media. */
export const MEDIA_DIR = path.resolve(PROJECT_ROOT, process.env.MEDIA_DIR || 'media')

/**
 * Production applies migrations on start. On a database whose schema was *pushed* by `pnpm dev`
 * Payload would stop and wait for an answer to a prompt — fail with a clear message instead.
 */
export function assertProductionDatabase(url: string) {
  const file = url.replace(/^file:/, '')
  if (!file || file === url) return
  let dev = false
  try {
    const db = new DatabaseSync(file, { readOnly: true })
    try {
      const row = db.prepare('SELECT count(*) AS n FROM payload_migrations WHERE batch = -1').get()
      dev = Number((row as { n: number }).n) > 0
    } finally {
      db.close()
    }
  } catch {
    return // no file yet, or no migrations table: a new database, migrations will create it
  }
  if (dev) {
    throw new Error(
      `${file} is a development database (its schema was pushed by pnpm dev). Production needs ` +
        'one prepared for migrations: pnpm db:init (from seed/) or pnpm db:export.',
    )
  }
}

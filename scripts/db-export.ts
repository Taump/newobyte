/**
 * Exports the current content as the snapshot the site ships with (`seed/`, committed):
 *
 *   pnpm db:export                  # → seed/payload.db + seed/media/
 *   pnpm db:export --out /tmp/x
 *
 * A new installation starts from it (Docker entrypoint / scripts/start-standalone.sh copy it into
 * an empty data folder) with every page, list, setting, release and image already in place. Locally the schema is *pushed* (Payload dev mode); production applies
 * committed migrations (src/migrations, `prodMigrations`). So the export:
 * 1. takes a consistent snapshot of the database (`VACUUM INTO`);
 * 2. builds a reference database from the migrations alone and compares the structure (tables,
 *    columns, foreign keys, indexes) — they must match, otherwise a migration is missing
 *    (`pnpm payload migrate:create <name>`);
 * 3. replaces the "dev push" marker with the applied migrations, so production starts without
 *    running (or asking about) anything;
 * 4. removes every admin account and its traces (sessions, preferences, document locks): the
 *    production admin comes only from ADMIN_EMAIL / ADMIN_PASSWORD (src/payload/seed/envAdmin.ts),
 *    and VACUUM wipes the deleted rows from the file;
 * 5. copies every media file the database references and checks none is missing.
 *
 * Later schema changes: create a migration; production applies it on start and keeps the data.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { parseArgs } from 'node:util'

import 'dotenv/config'

const { values: args } = parseArgs({
  options: { out: { type: 'string', default: 'seed' } },
})
const OUT = path.resolve(args.out!)
const sourceDb = (process.env.DATABASE_URL ?? '').replace(/^file:/, '')
if (!sourceDb || !fs.existsSync(sourceDb)) throw new Error(`database not found: ${sourceDb}`)
const MEDIA_DIR = path.resolve(process.env.MEDIA_DIR || 'media')
/** Accounts and everything tied to them, children first. */
const ACCOUNT_TABLES = [
  'payload_locked_documents_rels',
  'payload_locked_documents',
  'payload_preferences_rels',
  'payload_preferences',
  'users_sessions',
  'users',
]

fs.mkdirSync(OUT, { recursive: true })
const tmp = fs.mkdtempSync(path.join(OUT, '.tmp-'))
const snapshot = path.join(tmp, 'snapshot.db')
const reference = path.join(tmp, 'reference.db')

try {
  // 1. consistent copy, even while the dev server writes
  new DatabaseSync(sourceDb, { readOnly: true }).exec(
    `VACUUM INTO '${snapshot.replace(/'/g, "''")}'`,
  )

  // 2. the schema the migrations create
  execFileSync('pnpm', ['-s', 'payload', 'migrate'], {
    env: { ...process.env, DATABASE_URL: `file:${reference}`, NODE_OPTIONS: '--no-deprecation' },
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  const diff = compareSchemas(new DatabaseSync(reference), new DatabaseSync(snapshot))
  if (diff.length) {
    console.error('✗ The database schema differs from the migrations:')
    for (const d of diff) console.error(`  ${d}`)
    console.error('Create a migration for the change: pnpm payload migrate:create <name>')
    process.exit(1)
  }

  // 3. mark the migrations as applied
  const ref = new DatabaseSync(reference)
  const applied = ref
    .prepare('SELECT name, batch, updated_at, created_at FROM payload_migrations ORDER BY id')
    .all() as { name: string; batch: number; updated_at: string; created_at: string }[]
  const db = new DatabaseSync(snapshot)
  db.exec('DELETE FROM payload_migrations')
  const insert = db.prepare(
    'INSERT INTO payload_migrations (name, batch, updated_at, created_at) VALUES (?, ?, ?, ?)',
  )
  for (const m of applied) insert.run(m.name, m.batch, m.updated_at, m.created_at)

  // no accounts in the export (deploy/backup.sh strips the same tables)
  db.exec(ACCOUNT_TABLES.map((t) => `DELETE FROM "${t}";`).join('\n'))
  db.exec('VACUUM')

  // 5. media files
  const files = new Set<string>()
  for (const row of db.prepare('SELECT * FROM media').all() as Record<string, unknown>[]) {
    for (const [key, value] of Object.entries(row)) {
      if ((key === 'filename' || key.endsWith('_filename')) && typeof value === 'string' && value) {
        files.add(value)
      }
    }
  }
  const missing = [...files].filter((f) => !fs.existsSync(path.join(MEDIA_DIR, f)))
  if (missing.length) {
    console.error(`✗ ${missing.length} media files are missing in ${MEDIA_DIR}:`)
    for (const f of missing.slice(0, 20)) console.error(`  ${f}`)
    process.exit(1)
  }
  fs.rmSync(path.join(OUT, 'media'), { recursive: true, force: true })
  fs.mkdirSync(path.join(OUT, 'media'), { recursive: true })
  for (const f of files) fs.copyFileSync(path.join(MEDIA_DIR, f), path.join(OUT, 'media', f))

  const count = (table: string) =>
    (db.prepare(`SELECT count(*) AS n FROM "${table}"`).get() as { n: number }).n
  const summary = ['pages', 'media', 'users', 'faq', 'events', 'team_members', 'exchanges']
    .map((t) => `${t} ${count(t)}`)
    .join(', ')
  db.close()
  fs.renameSync(snapshot, path.join(OUT, 'payload.db'))
  console.log(`✓ ${path.relative(process.cwd(), OUT)}/payload.db (${summary})`)
  console.log(`✓ ${path.relative(process.cwd(), OUT)}/media/ (${files.size} files)`)
  console.log(`  migrations marked as applied: ${applied.map((m) => m.name).join(', ')}`)
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}

/** Differences in tables, columns, foreign keys and indexes (Payload's own bookkeeping aside). */
function compareSchemas(expected: DatabaseSync, actual: DatabaseSync): string[] {
  const describe = (db: DatabaseSync) => {
    const out = new Map<string, string>()
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[]
    for (const { name } of tables) {
      const q = (pragma: string) => db.prepare(`PRAGMA ${pragma}("${name}")`).all()
      const columns = (q('table_info') as Record<string, unknown>[]).map(
        (c) => `${c.name} ${c.type} notnull=${c.notnull} default=${c.dflt_value} pk=${c.pk}`,
      )
      const fks = (q('foreign_key_list') as Record<string, unknown>[]).map(
        (f) => `fk ${f.from} → ${f.table}.${f.to} on delete ${f.on_delete}`,
      )
      const indexes = (q('index_list') as Record<string, unknown>[])
        .filter((i) => !String(i.name).startsWith('sqlite_autoindex'))
        .map((i) => {
          const cols = (
            db.prepare(`PRAGMA index_info("${i.name}")`).all() as { name: string }[]
          ).map((c) => c.name)
          return `index ${i.name} unique=${i.unique} (${cols.join(', ')})`
        })
      out.set(name, [...columns.sort(), ...fks.sort(), ...indexes.sort()].join('\n'))
    }
    return out
  }
  const a = describe(expected)
  const b = describe(actual)
  const diff: string[] = []
  for (const [table, def] of a) {
    if (!b.has(table)) diff.push(`missing table ${table}`)
    else if (b.get(table) !== def) {
      const want = new Set(def.split('\n'))
      const have = new Set(b.get(table)!.split('\n'))
      for (const l of want) if (!have.has(l)) diff.push(`${table}: expected ${l}`)
      for (const l of have) if (!want.has(l)) diff.push(`${table}: unexpected ${l}`)
    }
  }
  for (const table of b.keys()) if (!a.has(table)) diff.push(`extra table ${table}`)
  return diff
}

/**
 * Grav → Payload content migration. Idempotent: pages are upserted by path, media by file hash,
 * globals are overwritten. Safe to re-run right before the DNS switch to pick up late edits.
 *
 *   pnpm migrate:grav                                # all pages + globals
 *   pnpm migrate:grav --only /,/faq                  # subset of routes
 *   pnpm migrate:grav --source path/to/docroot --report migration-report.md
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'

import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import type { Page } from '../../src/payload-types'

import type { Collected, Ctx } from './content'
import { importLists, upsert } from './lists'
import { tokenizeSiteLinks } from './siteLinks'
import {
  buildFooter,
  buildHeader,
  buildReleaseApps,
  buildReleases,
  buildSiteSettings,
  readThemeFiles,
} from './globals'
import { readPages, type GravPage } from './grav'
import { loadEditors, type Editors } from './lexical'
import { MediaImporter } from './media'
import { moduleToBlock } from './modules'
import { Report } from './report'

const { values: args } = parseArgs({
  options: {
    source: { type: 'string', default: 'old-site/docroot' },
    only: { type: 'string' },
    report: { type: 'string', default: 'migration-report.md' },
    'skip-globals': { type: 'boolean', default: false },
  },
})

const context = { disableRevalidate: true }

const findPageByPath = async (payload: Payload, route: string) =>
  (
    await payload.find({
      collection: 'pages',
      where: { path: { equals: route } },
      limit: 1,
      depth: 0,
      draft: true,
    })
  ).docs[0]

async function upsertPage(
  payload: Payload,
  page: GravPage,
  ids: Map<string, number>,
  editors: Editors,
  media: MediaImporter,
  report: Report,
  collected: Collected,
) {
  const ctx: Ctx = { page: page.route, editors, media, report, collected }
  const layout = []
  for (const m of page.modules) layout.push(await moduleToBlock(m, ctx))

  const data = {
    title: page.route === '/' ? 'Home' : String(page.header.title),
    slug: page.slug,
    parent: page.parentRoute ? (ids.get(page.parentRoute) ?? null) : null,
    menuTitle: page.header.menu ?? null,
    sitemapPriority: page.header.sitemap?.priority ?? 0.8,
    layout: tokenizeSiteLinks(layout),
    meta: {
      description: page.header.metadata?.description ?? null,
    },
    _status: page.published ? ('published' as const) : ('draft' as const),
  }

  // block data is assembled from untyped Grav frontmatter; Payload validates it on save
  const existing = await findPageByPath(payload, page.route)
  const doc: Page = existing
    ? await payload.update({ collection: 'pages', id: existing.id, data: data as never, context })
    : await payload.create({ collection: 'pages', data: data as never, context })
  if (existing) report.stats.pagesUpdated++
  else report.stats.pagesCreated++

  if (doc.path !== page.route) {
    throw new Error(`path mismatch: expected ${page.route}, got ${doc.path}`)
  }
  ids.set(page.route, doc.id)
  console.log(`✓ ${page.route} (${page.modules.map((m) => m.template).join(', ')})`)
}

async function main() {
  const docroot = path.resolve(args.source!)
  const payload = await getPayload({ config: await config })
  const editors = await loadEditors(payload.config)
  const report = new Report()
  const media = new MediaImporter(payload, docroot, report)

  const pages = await readPages(path.join(docroot, 'user/pages'))
  const only = args.only?.split(',')
  const ids = new Map<string, number>()
  const collected: Collected = { events: [], faq: [] }

  // Existing pages are updated deepest first: updating a parent makes the nested-docs plugin
  // re-save (and re-validate) its children, which must already have their new content. New
  // pages are created parents first (a child needs its parent's id).
  const existing = new Set<string>()
  for (const page of pages) {
    const found = await findPageByPath(payload, page.route)
    if (found) {
      ids.set(page.route, found.id)
      existing.add(page.route)
    }
  }
  const depth = (route: string) => route.split('/').filter(Boolean).length
  const ordered = [
    ...pages.filter((p) => existing.has(p.route)).sort((a, b) => depth(b.route) - depth(a.route)),
    ...pages.filter((p) => !existing.has(p.route)),
  ]
  for (const page of ordered) {
    if (only && !only.includes(page.route)) continue // --only: other pages keep their content
    await upsertPage(payload, page, ids, editors, media, report, collected)
  }

  if (!only) {
    const n = await importLists(payload, pages, media, collected)
    console.log(
      `✓ lists: ${n.faq} FAQ, ${n.events} events, ${n.timeline} timeline events, ${n.team} team members, ${n.exchanges} exchanges, ${n.trackers} coin trackers`,
    )
  }

  if (!args['skip-globals'] && !only) {
    const files = await readThemeFiles(docroot)
    await payload.updateGlobal({
      slug: 'header',
      data: tokenizeSiteLinks(buildHeader(pages, files.base)),
      context,
    })
    // social icons are an orderable collection; the rest of the footer is a global
    const { socialLinks, ...footer } = await buildFooter(files.footer, media)
    await payload.updateGlobal({
      slug: 'footer',
      data: tokenizeSiteLinks(footer) as never,
      context,
    })
    for (const { id: _id, ...link } of socialLinks)
      await upsert(payload, 'social-links', tokenizeSiteLinks(link) as never)
    await payload.updateGlobal({
      slug: 'releases',
      data: {
        ...buildReleases(files.htaccess),
        apps: await buildReleaseApps(pages, media),
      } as never,
      context,
    })
    await payload.updateGlobal({
      slug: 'site-settings',
      data: await buildSiteSettings(docroot),
      context,
    })
    console.log('✓ globals: header, footer (+ social links), releases, site-settings')
  }

  await fs.writeFile(args.report!, report.toMarkdown())
  console.log(
    `\nDone. ${report.stats.pagesCreated + report.stats.pagesUpdated} pages, ` +
      `${report.stats.mediaCreated} new media, ${report.rawHtml.length} RawHTML blocks → ${args.report}`,
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  if (err?.data?.errors) console.error(JSON.stringify(err.data.errors, null, 2))
  process.exit(1)
})

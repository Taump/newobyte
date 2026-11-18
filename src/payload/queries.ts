/**
 * Read-side data access for the public site (Local API, server only).
 * Requests are de-duplicated per render with React `cache`; static pages are rebuilt through
 * on-demand revalidation (hooks/revalidate.ts).
 */
import config from '@payload-config'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import type { Config, Footer, Header, Page, Release, SiteSetting } from '@/payload-types'

export const getPayloadClient = cache(() => getPayload({ config }))

/** Published page by URL path; drafts too when Next draft mode is on (admin preview). */
export const getPageByPath = cache(async (path: string, draft = false): Promise<Page | null> => {
  const payload = await getPayloadClient()
  const where: Where = draft
    ? { path: { equals: path } }
    : { and: [{ path: { equals: path } }, { _status: { equals: 'published' } }] }
  const { docs } = await payload.find({
    collection: 'pages',
    where,
    draft,
    depth: 2,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
  })
  return docs[0] ?? null
})

export type PageSummary = Pick<Page, 'title' | 'updatedAt' | 'sitemapPriority' | 'meta'> & {
  path: string
}

/** Published pages (sitemap, llms.txt), ordered by URL. */
export const getPublishedPages = cache(async (): Promise<PageSummary[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    select: { path: true, title: true, updatedAt: true, sitemapPriority: true, meta: true },
    depth: 0,
    sort: 'path',
    pagination: false,
  })
  return docs.filter((d): d is typeof d & { path: string } => Boolean(d.path)) as PageSummary[]
})

export const getPublishedPaths = cache(async (): Promise<string[]> =>
  (await getPublishedPages()).map((p) => p.path),
)

type Globals = {
  header: Header
  footer: Footer
  releases: Release
  'site-settings': SiteSetting
}

export const getGlobal = cache(
  async <S extends keyof Globals>(slug: S): Promise<Globals[S]> =>
    (await getPayloadClient()).findGlobal({ slug, depth: 1 }) as Promise<Globals[S]>,
)

type ListSlug =
  | 'team-members'
  | 'exchanges'
  | 'coin-trackers'
  | 'social-links'
  | 'timeline-events'
  | 'events'
  | 'faq'

/** drag-and-drop order (`_order`), except lists with a natural order */
const LIST_SORT: Partial<Record<ListSlug, string[]>> = {
  'timeline-events': ['date', 'createdAt'],
  events: ['-date', 'createdAt'],
}

/** Items of a list collection shown on the site, in their admin order. */
export const getList = cache(
  async <S extends ListSlug>(slug: S): Promise<Config['collections'][S][]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: slug,
      where: { showOnSite: { not_equals: false } },
      sort: LIST_SORT[slug] ?? '_order',
      depth: 1,
      pagination: false,
    })
    return docs as Config['collections'][S][]
  },
)

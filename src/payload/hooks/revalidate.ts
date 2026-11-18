import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

type PageLike = {
  id: number | string
  path?: string | null
  _status?: 'draft' | 'published' | null
}

/**
 * revalidatePath only works inside a Next.js request. Payload operations can also run from
 * scripts (migration, seeds) — there is nothing to revalidate then, so failures are ignored.
 * Bulk imports pass `context: { disableRevalidate: true }`.
 */
function safeRevalidate(req: PayloadRequest, path: string, type?: 'layout' | 'page') {
  if (req.context?.disableRevalidate) return
  try {
    revalidatePath(path, type)
    req.payload.logger.info(`revalidated ${path}${type ? ` (${type})` : ''}`)
  } catch {
    // outside of a Next.js request context — nothing is cached there
  }
}

/** Everything derived from a page: the page itself, its markdown twin, agent indexes, sitemap. */
function revalidatePageArtifacts(req: PayloadRequest, path: string) {
  safeRevalidate(req, path)
  safeRevalidate(req, path === '/' ? '/md' : `/md${path}`)
  safeRevalidate(req, '/llms.txt')
  safeRevalidate(req, '/llms-full.txt')
  safeRevalidate(req, '/sitemap.xml')
}

export const revalidatePageAfterChange: CollectionAfterChangeHook<PageLike> = ({
  doc,
  previousDoc,
  req,
}) => {
  if (doc._status === 'published' && doc.path) revalidatePageArtifacts(req, doc.path)
  // Unpublished or moved: the old URL must stop serving the cached page.
  if (
    previousDoc?._status === 'published' &&
    previousDoc.path &&
    (doc._status !== 'published' || previousDoc.path !== doc.path)
  ) {
    revalidatePageArtifacts(req, previousDoc.path)
  }
  return doc
}

export const revalidatePageAfterDelete: CollectionAfterDeleteHook<PageLike> = ({ doc, req }) => {
  if (doc?.path) revalidatePageArtifacts(req, doc.path)
  return doc
}

/**
 * Globals (header, footer, settings) and the lists (team, FAQ, events …) can show on any page:
 * rebuild every page — cheap, a few dozen static pages.
 */
export const revalidateEverything = <T>({ doc, req }: { doc: T; req: PayloadRequest }): T => {
  safeRevalidate(req, '/', 'layout')
  return doc
}

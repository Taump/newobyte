import type { MetadataRoute } from 'next'

import { getPublishedPages } from '@/payload/queries'
import { absoluteUrl } from '@/shared/lib/siteUrl'

/** /sitemap.xml: every published page (priority from the page, lastmod from its last edit). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return (await getPublishedPages()).map((p) => ({
    url: absoluteUrl(p.path),
    lastModified: p.updatedAt,
    priority: p.sitemapPriority ?? 0.8,
  }))
}

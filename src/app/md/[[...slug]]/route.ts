import { notFound } from 'next/navigation'

import { getPageData } from '@/payload/pageData'
import { pageToMarkdown } from '@/payload/pageMarkdown'
import { getPublishedPaths } from '@/payload/queries'
import { absoluteUrl } from '@/shared/lib/siteUrl'

/**
 * Markdown twin of every page, for AI agents: /platform.md or `Accept: text/markdown` on
 * /platform (both rewritten here by src/proxy.ts). Static, rebuilt with its page.
 */
export const dynamic = 'force-static'

export async function generateStaticParams() {
  return (await getPublishedPaths()).map((path) => ({ slug: path.split('/').filter(Boolean) }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const path = `/${(slug ?? []).map(decodeURIComponent).join('/')}`
  const pd = await getPageData(path)
  if (!pd) notFound()
  return new Response(pageToMarkdown(pd), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      // search engines index the HTML page, not its markdown twin
      Link: `<${absoluteUrl(path)}>; rel="canonical"`,
    },
  })
}

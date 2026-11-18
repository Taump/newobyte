/**
 * Everything a public page renders from: the page, its blocks with `{github}`-style link tokens
 * resolved, the collection data its blocks show, and the site settings. Shared by the HTML page,
 * its metadata, its markdown twin and the llms.txt indexes.
 */
import { cache } from 'react'

import type { BlockData } from '@/blocks/RenderBlocks'
import { resolveSiteLinksDeep } from '@/shared/lib/siteLinks'

import { getGlobal, getList, getPageByPath } from './queries'

type Layout = { blockType: string }[]

/** Collection data some blocks show — fetched only when the page has such a block. */
async function blockData(layout: Layout): Promise<BlockData> {
  const has = (type: string) => layout.some((b) => b.blockType === type)
  // content blocks nested in the rich text of an article
  const json = JSON.stringify(layout)
  const hasContent = (type: string) => json.includes(`"blockType":"${type}"`)
  const [teamMembers, exchanges, coinTrackers, timelineEvents, events, faq, releases] =
    await Promise.all([
      has('team') ? getList('team-members') : [],
      has('exchanges') ? getList('exchanges') : [],
      has('exchanges') ? getList('coin-trackers') : [],
      has('timeline') ? getList('timeline-events') : [],
      hasContent('eventsFeed') ? getList('events') : [],
      hasContent('faqFeed') ? getList('faq') : [],
      has('download') ? getGlobal('releases') : null,
    ])
  return { teamMembers, exchanges, coinTrackers, timelineEvents, events, faq, releases }
}

export const getPageData = cache(async (path: string, draft = false) => {
  const page = await getPageByPath(path, draft)
  if (!page) return null
  const settings = await getGlobal('site-settings')
  return {
    page,
    settings,
    blocks: resolveSiteLinksDeep(page.layout, settings),
    data: resolveSiteLinksDeep(await blockData(page.layout), settings),
  }
})

export type PageData = NonNullable<Awaited<ReturnType<typeof getPageData>>>

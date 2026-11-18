/**
 * Markdown of rich text with content blocks (page markdown twins for AI agents, llms-full.txt).
 * Every block has its own serializer next to its component (`<Block>/toMarkdown.ts`).
 */
import type { Media } from '@/payload-types'
import { lexicalToMarkdown, type RichTextData } from '@/shared/lib/lexicalMarkdown'
import { absoluteUrl, mediaPath } from '@/shared/lib/siteUrl'
import type { Video } from '@/shared/ui/VideoBox'

import { boxToMarkdown } from './Box/toMarkdown'
import { cardGridToMarkdown } from './CardGrid/toMarkdown'
import { columnsToMarkdown } from './Columns/toMarkdown'
import { devCalloutToMarkdown } from './DevCallout/toMarkdown'
import { distributionTableToMarkdown } from './DistributionTable/toMarkdown'
import { eventListToMarkdown } from './EventList/toMarkdown'
import { eventsFeedToMarkdown } from './EventsFeed/toMarkdown'
import { faqFeedToMarkdown } from './FaqFeed/toMarkdown'
import { flexBlockToMarkdown } from './FlexBlock/toMarkdown'
import { mediaListToMarkdown } from './MediaList/toMarkdown'
import { pageIntroToMarkdown } from './PageIntro/toMarkdown'
import type { ContentLists } from './types'
import { videoEmbedToMarkdown } from './VideoEmbed/toMarkdown'
import { whiteBoxToMarkdown } from './WhiteBox/toMarkdown'

/** Site data the text refers to (e-mail links, explorer links, collection feeds). */
export type MarkdownContext = {
  lists: ContentLists
  contactEmail: string
  jobsEmail: string
  explorerUrl: string
}

type Serializer = (block: never, ctx: MarkdownContext) => string

const SERIALIZERS: Record<string, Serializer> = {
  pageIntro: pageIntroToMarkdown,
  flexBlock: flexBlockToMarkdown,
  devCallout: devCalloutToMarkdown,
  cardGrid: cardGridToMarkdown,
  whiteBox: whiteBoxToMarkdown,
  box: boxToMarkdown,
  innerBox: boxToMarkdown,
  distributionTable: distributionTableToMarkdown,
  faqFeed: faqFeedToMarkdown,
  eventList: eventListToMarkdown,
  eventsFeed: eventsFeedToMarkdown,
  mediaList: mediaListToMarkdown,
  columns: columnsToMarkdown,
  videoEmbed: videoEmbedToMarkdown,
  // Payload's code block
  Code: (block: { code?: string | null; language?: string | null }) =>
    block.code ? `\`\`\`${block.language ?? ''}\n${block.code}\n\`\`\`` : '',
  // spacer: layout only; rawHtml: not expected (and not trusted as markdown)
} as Record<string, Serializer>

/** Site links (/platform …) as absolute URLs: the markdown is read outside the site. */
export const siteLink = (url: string) => (url.startsWith('/') ? absoluteUrl(url) : url)

export const imageMarkdown = (media: unknown) => {
  const m = media as Media | number | null | undefined
  return typeof m === 'object' && m?.url
    ? `![${m.alt ?? ''}](${absoluteUrl(mediaPath(m.url))})`
    : ''
}

export const videoMarkdown = (video: Video | null | undefined) => {
  if (!video?.provider || !video.videoId) return ''
  const url =
    video.provider === 'youtube'
      ? `https://www.youtube.com/watch?v=${video.videoId}`
      : `https://vimeo.com/${video.videoId}`
  return `[Video${video.title ? `: ${video.title}` : ''}](${url})`
}

/** A link in markdown, or just the label without a (safe) URL. */
export const linkMarkdown = (label: string, url?: string | null) =>
  url ? `[${label}](${siteLink(url)})` : label

const email = (fields: Record<string, unknown>, ctx: MarkdownContext) =>
  fields.address === 'jobs' ? ctx.jobsEmail : ctx.contactEmail

export function richToMarkdown(data: unknown, ctx: MarkdownContext): string {
  return lexicalToMarkdown(data as RichTextData, {
    block: (fields) => SERIALIZERS[String(fields.blockType)]?.(fields as never, ctx) ?? '',
    inlineBlock: (fields) => {
      const address = email(fields, ctx)
      return address ? `[${address}](mailto:${address})` : ''
    },
    upload: imageMarkdown,
    link: siteLink,
  })
}

/** Plain text (structured data, e.g. FAQ answers). */
export function richToText(data: unknown, ctx: MarkdownContext): string {
  return lexicalToMarkdown(data as RichTextData, {
    plain: true,
    block: (fields) => SERIALIZERS[String(fields.blockType)]?.(fields as never, ctx) ?? '',
    inlineBlock: (fields) => email(fields, ctx),
  })
}

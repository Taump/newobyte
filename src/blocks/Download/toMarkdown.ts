import { linkMarkdown, type MarkdownContext, richToMarkdown } from '@/content-blocks/markdown'
import type { DownloadBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import type { BlockData } from '../RenderBlocks'

export function downloadToMarkdown(block: DownloadBlock, data: BlockData, ctx: MarkdownContext) {
  const links = data.releases?.apps?.[block.network === 'testnet' ? 'testnet' : 'mainnet']
  return joinParts([
    `## ${richToMarkdown(block.title, ctx).replace(/\s*\n\s*/g, ' ')}`,
    [
      links?.appStore && `- ${linkMarkdown('App Store', links.appStore)}`,
      links?.googlePlay && `- ${linkMarkdown('Google Play', links.googlePlay)}`,
      ...(block.downloadLinks ?? []).map((l) => `- ${linkMarkdown(l.label, l.link)}`),
    ]
      .filter(Boolean)
      .join('\n'),
    richToMarkdown(block.body, ctx),
  ])
}

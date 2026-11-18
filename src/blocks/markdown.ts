/**
 * Markdown twin of a page (`/platform.md`, `Accept: text/markdown`, llms-full.txt): the content of
 * every layout block, each serialized next to its component (`<Block>/toMarkdown.ts`).
 */
import type { MarkdownContext } from '@/content-blocks/markdown'
import type { Page } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import { articleToMarkdown } from './Article/toMarkdown'
import { bigChangesToMarkdown } from './BigChanges/toMarkdown'
import { downloadToMarkdown } from './Download/toMarkdown'
import { exchangesToMarkdown } from './Exchanges/toMarkdown'
import { heroToMarkdown } from './Hero/toMarkdown'
import { independentToMarkdown } from './Independent/toMarkdown'
import type { BlockData } from './RenderBlocks'
import { teamToMarkdown } from './Team/toMarkdown'
import { technologyToMarkdown } from './Technology/toMarkdown'
import { timelineToMarkdown } from './Timeline/toMarkdown'

type LayoutBlock = Page['layout'][number]
type Serializer = (block: never, data: BlockData, ctx: MarkdownContext) => string

const SERIALIZERS: Record<LayoutBlock['blockType'], Serializer> = {
  article: articleToMarkdown,
  textWide: articleToMarkdown,
  hero: heroToMarkdown,
  technology: technologyToMarkdown,
  independent: independentToMarkdown,
  bigChanges: bigChangesToMarkdown,
  timeline: timelineToMarkdown,
  download: downloadToMarkdown,
  team: teamToMarkdown,
  exchanges: exchangesToMarkdown,
}

export const blocksToMarkdown = (blocks: Page['layout'], data: BlockData, ctx: MarkdownContext) =>
  joinParts(blocks.map((b) => SERIALIZERS[b.blockType](b as never, data, ctx)))

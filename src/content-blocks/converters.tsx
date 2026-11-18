/**
 * Rich text block converters: each content block renders the markup and class names of the old
 * Grav pages (flex-block, dev-blog, categories-list …), whose page-specific styles are the old
 * CSS, ported verbatim to src/shared/styles/legacy.css.
 */
import type { JSXConverters } from '@payloadcms/richtext-lexical/react'
import type { ComponentType } from 'react'

import { Box } from './Box/Box'
import { CardGrid } from './CardGrid/CardGrid'
import { Columns } from './Columns/Columns'
import { DevCallout } from './DevCallout/DevCallout'
import { DistributionTable } from './DistributionTable/DistributionTable'
import { EventList } from './EventList/EventList'
import { EventsFeed } from './EventsFeed/EventsFeed'
import { FaqFeed } from './FaqFeed/FaqFeed'
import { FlexBlock } from './FlexBlock/FlexBlock'
import { MediaList } from './MediaList/MediaList'
import { PageIntro } from './PageIntro/PageIntro'
import { RawHtml } from './RawHtml/RawHtml'
import { Spacer } from './Spacer/Spacer'
import type { ContentLists } from './types'
import { VideoEmbed } from './VideoEmbed/VideoEmbed'
import { WhiteBox } from './WhiteBox/WhiteBox'

/** Payload's built-in code block; the old site had no syntax highlighting. */
function Code({ block }: { block: { code?: string | null; language?: string | null } }) {
  return (
    <pre>
      <code className={block.language ? `language-${block.language}` : undefined}>
        {block.code}
      </code>
    </pre>
  )
}

type BlockComponent = ComponentType<{ block: never; lists: ContentLists }>

/** Block slug → component (`Code` is the slug of Payload's CodeBlock). */
const COMPONENTS: Record<string, BlockComponent> = {
  pageIntro: PageIntro,
  flexBlock: FlexBlock,
  devCallout: DevCallout,
  cardGrid: CardGrid,
  whiteBox: WhiteBox,
  box: Box,
  innerBox: Box,
  distributionTable: DistributionTable,
  spacer: Spacer,
  faqFeed: FaqFeed,
  eventList: EventList,
  eventsFeed: EventsFeed,
  mediaList: MediaList,
  columns: Columns,
  videoEmbed: VideoEmbed,
  Code,
  rawHtml: RawHtml,
} as Record<string, BlockComponent>

export const blockConverters = (lists: ContentLists): JSXConverters['blocks'] =>
  Object.fromEntries(
    Object.entries(COMPONENTS).map(([slug, Component]) => [
      slug,
      ({ node }: { node: { fields: unknown } }) => (
        <Component block={node.fields as never} lists={lists} />
      ),
    ]),
  )

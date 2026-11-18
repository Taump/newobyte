import {
  BlocksFeature,
  CodeBlock,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { basicFeatures, uploadFeature } from './contentEditor'
import { BoxBlock } from './Box/config'
import { CardGridBlock } from './CardGrid/config'
import { ColumnsBlock } from './Columns/config'
import { DevCalloutBlock } from './DevCallout/config'
import { DistributionTableBlock } from './DistributionTable/config'
import { EventListBlock } from './EventList/config'
import { EmailLinkBlock } from './EmailLink/config'
import { EventsFeedBlock } from './EventsFeed/config'
import { FaqFeedBlock } from './FaqFeed/config'
import { FlexBlockBlock } from './FlexBlock/config'
import { MediaListBlock } from './MediaList/config'
import { PageIntroBlock } from './PageIntro/config'
import { RawHtmlBlock } from './RawHtml/config'
import { SpacerBlock } from './Spacer/config'
import { VideoEmbedBlock } from './VideoEmbed/config'
import { WhiteBoxBlock } from './WhiteBox/config'

/** Full article editor: everything above + page-level content blocks, code, tables. */
export const articleEditor = lexicalEditor({
  features: () => [
    ...basicFeatures(),
    // h5 = small block title (old `<div class="title">`), rendered as such by RichText
    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5'] }),
    HorizontalRuleFeature(),
    uploadFeature(),
    EXPERIMENTAL_TableFeature(),
    FixedToolbarFeature(),
    BlocksFeature({
      blocks: [
        PageIntroBlock,
        FlexBlockBlock,
        DevCalloutBlock,
        CardGridBlock,
        WhiteBoxBlock,
        BoxBlock,
        DistributionTableBlock,
        SpacerBlock,
        FaqFeedBlock,
        EventListBlock,
        EventsFeedBlock,
        MediaListBlock,
        ColumnsBlock,
        VideoEmbedBlock,
        CodeBlock({ languages: { plaintext: 'Plain text', js: 'JavaScript', json: 'JSON' } }),
        RawHtmlBlock,
      ],
      inlineBlocks: [EmailLinkBlock],
    }),
  ],
})

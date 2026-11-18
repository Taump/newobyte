import { ArticleBlock } from './Article/config'
import { BigChangesBlock } from './BigChanges/config'
import { DownloadBlock } from './Download/config'
import { ExchangesBlock } from './Exchanges/config'
import { HeroBlock } from './Hero/config'
import { IndependentBlock } from './Independent/config'
import { TeamBlock } from './Team/config'
import { TechnologyBlock } from './Technology/config'
import { TextWideBlock } from './TextWide/config'
import { TimelineBlock } from './Timeline/config'

/** Page layout blocks, in the order editors usually need them. */
export const layoutBlocks = [
  ArticleBlock,
  TextWideBlock,
  DownloadBlock,
  HeroBlock,
  TechnologyBlock,
  IndependentBlock,
  BigChangesBlock,
  TimelineBlock,
  TeamBlock,
  ExchangesBlock,
]

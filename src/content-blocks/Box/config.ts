import { DevCalloutBlock } from '../DevCallout/config'
import { FlexBlockBlock } from '../FlexBlock/config'
import { PageIntroBlock } from '../PageIntro/config'

import { makeBoxBlock } from './factory'

export { BOX_STYLES } from './factory'

/**
 * Styled box at page level: may hold flex blocks (the indented list on /legal/privacy), a
 * callout, a page title + lead (the text column on /platform/prosaic-contracts).
 */
export const BoxBlock = makeBoxBlock('box', 'BoxBlock', [
  FlexBlockBlock,
  DevCalloutBlock,
  PageIntroBlock,
])

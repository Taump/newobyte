import { RichText } from '@/content-blocks/RichText'
import type { TextWideBlock } from '@/payload-types'

import { TEXT_WIDE_SECTION_VARIANTS } from '@/shared/cms/variants'
import { cn } from '@/shared/lib/cn'

import { LegacyBackgroundPreload } from '@/shared/styles/LegacyBackgroundPreload'
import '@/shared/styles/legacy.css'
import '@/shared/styles/legacy-fixes.css'

import type { BlockData } from '../RenderBlocks'

/** Full-width inner page content (old modular/text-wide.html.twig): no section padding/container. */
export function TextWide({ block, data }: { block: TextWideBlock; data: BlockData }) {
  return (
    <>
      {/* hoisted into <head> by React */}
      <LegacyBackgroundPreload variant={block.variant} />
      <section
        className={cn(
          'legacy-content',
          block.variant && TEXT_WIDE_SECTION_VARIANTS.includes(block.variant) && 'section',
          block.variant,
        )}
      >
        <RichText data={block.body} lists={{ events: data.events, faq: data.faq }} />
      </section>
    </>
  )
}

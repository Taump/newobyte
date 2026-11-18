import { RichText } from '@/content-blocks/RichText'
import type { ArticleBlock } from '@/payload-types'

import { LegacyBackgroundPreload } from '@/shared/styles/LegacyBackgroundPreload'
import '@/shared/styles/legacy.css'
import '@/shared/styles/legacy-fixes.css'

import type { BlockData } from '../RenderBlocks'

/**
 * Inner page article (old modular/article.html.twig). Plain old class names on purpose: the
 * page-specific styles are the old CSS (shared/styles/legacy.css, components layer), and Tailwind utilities on
 * these wrappers would override them (utilities layer wins over components).
 */
export function Article({ block, data }: { block: ArticleBlock; data: BlockData }) {
  return (
    <>
      {/* hoisted into <head> by React */}
      <LegacyBackgroundPreload variant={block.variant} />
      <section className={`legacy-content section ${block.variant}`}>
        <section className="container grid-xl">
          <div className="content-block">
            <RichText data={block.body} lists={{ events: data.events, faq: data.faq }} />
          </div>
        </section>
      </section>
    </>
  )
}

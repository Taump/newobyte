import type { CardGridBlock } from '@/payload-types'
import { cn } from '@/shared/lib/cn'
import { mediaPath } from '@/shared/lib/siteUrl'
import { MediaImage } from '@/shared/ui/MediaImage'
import { SafeLink } from '@/shared/ui/SafeLink'

import { InlineRichText, RichText } from '../RichText'

type Card = NonNullable<CardGridBlock['cards']>[number]

/** /platform: background picture + title, the whole card is a link. */
function LinkCard({ card }: { card: Card }) {
  // the full-size WebP variant (the originals are PNGs of up to 300 KB)
  const image = typeof card.image === 'object' ? card.image : null
  const url = image?.sizes?.webp?.url ?? image?.url
  const bg = url ? mediaPath(url) : null
  return (
    <>
      <div className="img-block">
        <div className="inner-wrap" style={bg ? { backgroundImage: `url('${bg}')` } : undefined} />
      </div>
      <div className="title-block">
        <div className="title">{card.title}</div>
      </div>
      <SafeLink href={card.link} className="all-link">
        <span className="sr-only">{card.title}</span>
      </SafeLink>
    </>
  )
}

/** /developers: icon + title + list of links. */
function LinkListCard({ card }: { card: Card }) {
  return (
    <div className="inner-wrap">
      <div className="img-block">
        <MediaImage media={card.image} natural />
      </div>
      <h2 className="title">{card.title}</h2>
      <div className="info-block">
        <div className="link-list">
          {card.links?.map((l) =>
            card.linkRows ? (
              <div key={l.id}>
                <SafeLink href={l.link}>{l.label}</SafeLink>
                {l.description}
              </div>
            ) : (
              <SafeLink key={l.id} href={l.link}>
                {l.label}
              </SafeLink>
            ),
          )}
        </div>
        {/* plain text (no <p>) in cards without a link list, as on the old page */}
        {card.links?.length ? (
          <RichText data={card.content} />
        ) : (
          <InlineRichText data={card.content} />
        )}
      </div>
    </div>
  )
}

/** Grid of cards (old `.categories-list > .category-block`). */
export function CardGrid({ block }: { block: CardGridBlock }) {
  return (
    <div className="categories-list">
      {block.cards?.map((card) => (
        <div key={card.id} className={cn('category-block', card.modifier)}>
          {block.variant === 'linkCards' ? (
            <LinkCard card={card} />
          ) : block.variant === 'linkLists' ? (
            <LinkListCard card={card} />
          ) : (
            <>
              <h2 className="title">{card.title}</h2>
              <RichText data={card.content} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

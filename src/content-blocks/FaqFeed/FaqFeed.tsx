import type { FaqFeedBlock } from '@/payload-types'

import { RichText } from '../RichText'
import type { ContentLists } from '../types'

/** The FAQ collection as the old `.white-block` cards (h4 question + answer). */
export function FaqFeed({ block, lists }: { block: FaqFeedBlock; lists: ContentLists }) {
  return (lists.faq ?? []).slice(0, block.limit ?? undefined).map((q) => (
    <div key={q.id} className="white-block">
      <h4>{q.question}</h4>
      <RichText data={q.answer} />
    </div>
  ))
}

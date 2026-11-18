import type { FaqFeedBlock } from '@/payload-types'

import { RichText } from '../RichText'
import type { ContentLists } from '../types'

/**
 * The FAQ collection as the old `.white-block` cards (question + answer). The question was an
 * `<h4>` right under the page `<h1>` (skipped levels, Lighthouse heading-order) — now an `<h2>`
 * with the old h4 look (base h4 size + `.faq-wrap .white-block h4`).
 */
export function FaqFeed({ block, lists }: { block: FaqFeedBlock; lists: ContentLists }) {
  return (lists.faq ?? []).slice(0, block.limit ?? undefined).map((q) => (
    <div key={q.id} className="white-block">
      <h2 className="mb-[7px] mt-0 font-sans text-[1.2rem] font-semibold leading-[1.2] text-[#15202b]">
        {q.question}
      </h2>
      <RichText data={q.answer} />
    </div>
  ))
}

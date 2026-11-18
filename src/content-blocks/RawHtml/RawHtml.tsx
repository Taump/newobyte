import type { RawHtmlBlock } from '@/payload-types'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'

/** Fallback HTML (admin-only field), always sanitized. */
export function RawHtml({ block }: { block: RawHtmlBlock }) {
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.html ?? '') }} />
}

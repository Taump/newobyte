import type { SpacerBlock } from '@/payload-types'

/** Bare line breaks in the flow, exactly as the old `<br><br>`. */
export function Spacer({ block }: { block: SpacerBlock }) {
  return Array.from({ length: block.lines ?? 2 }, (_, i) => <br key={i} />)
}

import type { VideoEmbedBlock } from '@/payload-types'
import { VideoBox } from '@/shared/ui/VideoBox'

/** YouTube / Vimeo facade in the old `.iframe-block` (360px high). */
export function VideoEmbed({ block }: { block: VideoEmbedBlock }) {
  return (
    <VideoBox
      video={block}
      className="iframe-block [&>*]:inline-block [&>*]:h-[360px] [&>*]:align-baseline"
    />
  )
}

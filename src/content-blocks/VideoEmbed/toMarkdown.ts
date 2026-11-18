import type { VideoEmbedBlock } from '@/payload-types'

import { videoMarkdown } from '../markdown'

export const videoEmbedToMarkdown = (block: VideoEmbedBlock) => videoMarkdown(block)

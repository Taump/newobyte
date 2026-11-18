import type { Block } from 'payload'

import { videoFields } from '@/shared/cms/fields'

/** YouTube / Vimeo embed, rendered as a lightweight facade (preview image, iframe on click). */
export const VideoEmbedBlock: Block = {
  slug: 'videoEmbed',
  interfaceName: 'VideoEmbedBlock',
  fields: [
    videoFields({ required: true }),
    { name: 'title', type: 'text', admin: { description: 'Accessible title of the video' } },
  ],
}

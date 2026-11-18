import type { Block } from 'payload'

import { anchorField } from '@/shared/cms/fields'

/**
 * Home timeline slider (old modular/timeline.html.twig). The points come from the `timeline-events`
 * collection (sorted by date); the slider starts on the newest one.
 */
export const TimelineBlock: Block = {
  slug: 'timeline',
  interfaceName: 'TimelineBlock',
  fields: [
    anchorField,
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'richText' },
  ],
}

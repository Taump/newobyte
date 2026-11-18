import type { Block } from 'payload'

import { anchorField, imageField, inlineRichText, quoteField } from '@/shared/cms/fields'

/**
 * Home "We use technology…" section with the animated "Evolution of ledgers" scenes
 * (old modular/technology.html.twig). The animated SVGs are code assets in public/animation/
 * (SMIL — must not be re-encoded), so scenes reference them by key.
 */
export const TechnologyBlock: Block = {
  slug: 'technology',
  interfaceName: 'TechnologyBlock',
  fields: [
    anchorField,
    inlineRichText({ name: 'title', required: true }),
    quoteField('quote'),
    { name: 'body', type: 'richText' },
    imageField('fallbackImage', false, 'Static fallback image'),
    {
      name: 'scenes',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'scene',
          type: 'select',
          required: true,
          options: [
            { label: 'Scene 1 — centralized ledger', value: 'scene1' },
            { label: 'Scene 2 — blockchain', value: 'scene2' },
            { label: 'Scene 3 — DAG', value: 'scene3' },
          ],
        },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
      ],
    },
  ],
}

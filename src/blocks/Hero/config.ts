import type { Block } from 'payload'

import { anchorField, imageField, inlineRichText, quoteField } from '@/shared/cms/fields'

/** Home hero (old modular/hero.html.twig, module `_showcase`). */
export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  fields: [
    anchorField,
    inlineRichText({ name: 'title', required: true }),
    { name: 'subtitle', type: 'text' },
    { name: 'description', type: 'textarea' },
    quoteField('mainQuote', 'Main quote (large, with portrait)'),
    {
      name: 'information',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
      ],
    },
    quoteField('sideQuote', 'Side quote'),
    {
      name: 'comparisons',
      type: 'array',
      fields: [
        imageField('image'),
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'active', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
}

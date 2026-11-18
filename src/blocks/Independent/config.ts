import type { Block } from 'payload'

import { anchorField, quoteField } from '@/shared/cms/fields'

/** Home "An independent individual…" section (old modular/independent.html.twig). */
export const IndependentBlock: Block = {
  slug: 'independent',
  interfaceName: 'IndependentBlock',
  fields: [
    anchorField,
    { name: 'title', type: 'textarea', required: true },
    { name: 'description', type: 'textarea' },
    quoteField('quote'),
  ],
}

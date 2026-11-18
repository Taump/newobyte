import type { Block } from 'payload'

import { anchorField, quoteField } from '@/shared/cms/fields'

/** Home "big changes lie ahead" section (old modular/big_changes.html.twig). */
export const BigChangesBlock: Block = {
  slug: 'bigChanges',
  interfaceName: 'BigChangesBlock',
  fields: [anchorField, { name: 'text', type: 'textarea', required: true }, quoteField('quote')],
}

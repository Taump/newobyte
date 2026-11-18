import type { Block } from 'payload'

import { contentEditorField } from '../contentEditor'

/** White card (old `.white-block`), optional small category label above the content. */
export const WhiteBoxBlock: Block = {
  slug: 'whiteBox',
  interfaceName: 'WhiteBoxBlock',
  fields: [
    { name: 'label', type: 'text' },
    contentEditorField('content', true),
    {
      name: 'plainText',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Text without paragraph spacing (e.g. the textcoin example)' },
    },
  ],
}

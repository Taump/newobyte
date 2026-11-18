import type { Block } from 'payload'

import { articleEditor } from '@/content-blocks/articleEditor'
import { anchorField } from '@/shared/cms/fields'
import { TEXT_WIDE_VARIANTS } from '@/shared/cms/variants'

/** Full-width content without the page container (old modular/text-wide.html.twig). */
export const TextWideBlock: Block = {
  slug: 'textWide',
  interfaceName: 'TextWideBlock',
  fields: [
    anchorField,
    {
      name: 'variant',
      type: 'select',
      required: true,
      options: TEXT_WIDE_VARIANTS.map((v) => ({ label: v, value: v })),
    },
    { name: 'body', type: 'richText', editor: articleEditor },
  ],
}

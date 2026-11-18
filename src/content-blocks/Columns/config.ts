import type { Block } from 'payload'

import { videoFields } from '@/shared/cms/fields'

import { InnerBoxBlock } from '../Box/factory'
import { contentEditorField, contentEditorWith } from '../contentEditor'

/** Two-column layout (old Spectre `.columns > .column.col-N`). */
export const ColumnsBlock: Block = {
  slug: 'columns',
  interfaceName: 'ColumnsBlock',
  fields: [
    {
      name: 'columns',
      type: 'array',
      minRows: 1,
      maxRows: 3,
      fields: [
        {
          name: 'width',
          type: 'number',
          min: 1,
          max: 12,
          required: true,
          defaultValue: 6,
          admin: { description: 'Width in 12-column grid (full width on mobile)' },
        },
        // styled text (e.g. a small caption) inside a column on /platform/textcoins
        contentEditorField('content', false, contentEditorWith([InnerBoxBlock])),
        { name: 'video', type: 'group', fields: [videoFields()] },
      ],
    },
  ],
}

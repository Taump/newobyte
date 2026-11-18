import type { Block } from 'payload'

import { imageField, linkField } from '@/shared/cms/fields'

import { InnerBoxBlock } from '../Box/factory'
import { contentEditorField, contentEditorWith } from '../contentEditor'

/**
 * Image + text list (old `.resources-list`, `.attestors-list`, `.blackbytes-details`).
 */
export const MediaListBlock: Block = {
  slug: 'mediaList',
  interfaceName: 'MediaListBlock',
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'resources',
      options: ['resources', 'attestors', 'blackbytes'],
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        imageField('image', false),
        { name: 'title', type: 'text' },
        linkField('link', false),
        // text + image rows inside an item on /platform/blackbytes
        contentEditorField('content', false, contentEditorWith([InnerBoxBlock])),
      ],
    },
  ],
}

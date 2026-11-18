import type { Block } from 'payload'

import { imageField, labeledLinkRow, linkField } from '@/shared/cms/fields'

import { contentEditorField } from '../contentEditor'

/**
 * Grid of cards (old `.categories-list > .category-block`):
 * - linkCards: /platform — background image + title, whole card is a link;
 * - linkLists: /developers — icon + title + list of links;
 * - text: /legal — title + text.
 */
export const CardGridBlock: Block = {
  slug: 'cardGrid',
  interfaceName: 'CardGridBlock',
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'linkCards',
      options: [
        { label: 'Link cards (image + title)', value: 'linkCards' },
        { label: 'Link lists (icon + links)', value: 'linkLists' },
        { label: 'Text cards', value: 'text' },
      ],
    },
    {
      name: 'cards',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', required: true },
        imageField('image', false),
        linkField('link', false),
        {
          name: 'links',
          type: 'array',
          admin: { description: 'Link lists variant' },
          fields: [
            labeledLinkRow({ linkRequired: false }),
            {
              name: 'description',
              type: 'text',
              admin: { description: 'Text after the link, e.g. ": a pure JavaScript library"' },
            },
          ],
        },
        {
          name: 'linkRows',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Link lists: one row per link (with its description)' },
        },
        contentEditorField('content'),
        { name: 'modifier', type: 'text', admin: { description: 'Old card class, e.g. "one"' } },
      ],
    },
  ],
}

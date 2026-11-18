import type { Block } from 'payload'

import { anchorField } from '@/shared/cms/fields'

/**
 * Team grid with "Show all" (old modular/team.html.twig). The people come from the
 * `team-members` collection (in its drag-and-drop order); the block holds the section settings.
 */
export const TeamBlock: Block = {
  slug: 'team',
  interfaceName: 'TeamBlock',
  fields: [
    anchorField,
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'richText' },
    {
      type: 'row',
      fields: [
        {
          name: 'visibleCount',
          label: 'Members shown before "Show all"',
          type: 'number',
          min: 1,
          defaultValue: 4,
          required: true,
          admin: { width: '33%', description: 'Leave ≥ number of members to hide the button.' },
        },
        {
          name: 'showAllLabel',
          type: 'text',
          defaultValue: 'Show all',
          required: true,
          admin: { width: '33%' },
        },
        {
          name: 'showLessLabel',
          type: 'text',
          defaultValue: 'Show less',
          required: true,
          admin: { width: '33%' },
        },
      ],
    },
  ],
}

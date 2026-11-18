import { imageField, linkField } from '@/shared/cms/fields'

import { orderableList } from './orderable'

/**
 * Team members shown by the Team block (home page). Drag rows in the list view to change the
 * order on the site; the first N (set on the block) are visible before "Show all".
 */
export const TeamMembers = orderableList({
  slug: 'team-members',
  singular: 'Team member',
  plural: 'Team',
  columns: ['photo', 'name', 'role'],
  fields: [
    imageField('photo'),
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, unique: true },
        { name: 'role', type: 'text', required: true },
      ],
    },
    {
      name: 'links',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'icon',
              type: 'select',
              required: true,
              defaultValue: 'link',
              options: [
                { label: 'GitHub', value: 'github' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'Other (custom icon)', value: 'link' },
              ],
              admin: { width: '30%' },
            },
            {
              ...imageField('customIcon', false, 'Custom icon'),
              admin: {
                width: '30%',
                condition: (_, siblingData) => siblingData?.icon === 'link',
                description: 'Small square image shown in the white circle (16×16).',
              },
            },
            { ...linkField('url'), admin: { width: '40%' } },
          ],
        },
      ],
    },
  ],
})

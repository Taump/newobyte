import { imageField, linkField } from '@/shared/cms/fields'

import { orderableList } from './orderable'

/** Social network icons in the site footer, in drag-and-drop order. */
export const SocialLinks = orderableList({
  slug: 'social-links',
  singular: 'Social link',
  plural: 'Social links',
  columns: ['icon', 'name', 'link'],
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, unique: true, admin: { width: '30%' } },
        { ...linkField(), admin: { width: '70%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { ...imageField('icon'), admin: { width: '50%', description: '32×32 round icon' } },
        { ...imageField('iconHover', true, 'Icon on hover'), admin: { width: '50%' } },
      ],
    },
  ],
})

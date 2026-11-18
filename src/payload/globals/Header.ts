import type { GlobalConfig } from 'payload'

import { authenticated } from '@/shared/cms/access'
import { labeledLinkRow, linkField } from '@/shared/cms/fields'

import { revalidateEverything } from '../hooks/revalidate'

export const Header: GlobalConfig = {
  slug: 'header',
  access: { read: () => true, update: authenticated },
  hooks: { afterChange: [revalidateEverything] },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [labeledLinkRow(), { name: 'children', type: 'array', fields: [labeledLinkRow()] }],
    },
    {
      name: 'cta',
      label: 'Button',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, defaultValue: 'Download wallet' },
            { ...linkField(), defaultValue: '/#download' },
          ],
        },
      ],
    },
    {
      name: 'mobileExtraLinks',
      label: 'Extra links in the mobile menu',
      type: 'array',
      fields: [labeledLinkRow({ newTab: true })],
    },
  ],
}

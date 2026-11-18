import type { GlobalConfig } from 'payload'

import { authenticated } from '@/shared/cms/access'
import { labeledLinkRow, linkField } from '@/shared/cms/fields'

import { revalidateEverything } from '../hooks/revalidate'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: { read: () => true, update: authenticated },
  hooks: { afterChange: [revalidateEverything] },
  fields: [
    {
      name: 'columns',
      type: 'array',
      maxRows: 6,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'links', type: 'array', fields: [labeledLinkRow({ newTab: true })] },
      ],
    },
    {
      name: 'newsletter',
      type: 'group',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        {
          name: 'action',
          type: 'text',
          defaultValue: 'https://static.mailerlite.com/webforms/submit/t1t7v1',
          admin: { description: 'MailerLite web form submit URL' },
        },
        { name: 'placeholder', type: 'text', defaultValue: 'Email for Obyte newsletter' },
        { name: 'buttonLabel', type: 'text', defaultValue: 'Subscribe' },
        { name: 'successTitle', type: 'text', defaultValue: 'Thank you!' },
        { name: 'successText', type: 'textarea' },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      defaultValue: '© 2016-{year} Obyte.',
      admin: { description: '{year} is replaced with the current year' },
    },
    {
      name: 'mobileCopyright',
      type: 'text',
      defaultValue: '© {year} Obyte.',
      admin: { description: 'Copyright line in the mobile menu ({year} = current year)' },
    },
    {
      name: 'copyrightLink',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', defaultValue: 'Proudly blocked in China' },
        linkField('url', false),
      ],
    },
  ],
}

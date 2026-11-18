import type { GlobalConfig } from 'payload'

import { admins } from '@/shared/cms/access'
import { httpsUrlValidator, imageField } from '@/shared/cms/fields'

import { revalidateEverything } from '../hooks/revalidate'

const httpsUrl = httpsUrlValidator(false)

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: { read: () => true, update: admins },
  hooks: { afterChange: [revalidateEverything] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            {
              name: 'siteTitle',
              type: 'text',
              required: true,
              defaultValue: 'Obyte — a fully decentralized, DAG based crypto.',
            },
            {
              name: 'defaultDescription',
              type: 'textarea',
              required: true,
              admin: { description: 'Used when a page has no meta description' },
            },
            {
              ...imageField('defaultOgImage', false, 'Default og:image'),
              admin: {
                description:
                  'Empty = /user/themes/obyte/assets/phone-shadow.png (the old site image)',
              },
            },
            { name: 'twitterSite', type: 'text', defaultValue: '@ObyteOrg' },
            {
              name: 'llmsIntro',
              label: 'llms.txt introduction',
              type: 'textarea',
              admin: { description: 'Short description of Obyte for AI agents (top of /llms.txt)' },
            },
          ],
        },
        {
          label: 'Contacts & links',
          description:
            'Addresses used across the site. In any link field or text link you can write e.g. {explorer}/address/… or {github}/ocore — it follows these settings.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'contactEmail',
                  type: 'email',
                  required: true,
                  defaultValue: 'o@obyte.org',
                  admin: {
                    width: '50%',
                    description: 'Shown wherever a page has a “Contact email” link',
                  },
                },
                {
                  name: 'jobsEmail',
                  type: 'email',
                  required: true,
                  defaultValue: 'jobs@obyte.org',
                  admin: {
                    width: '50%',
                    description: 'Shown wherever a page has a “Jobs email” link',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'githubUrl',
                  label: 'GitHub',
                  type: 'text',
                  defaultValue: 'https://github.com/byteball',
                  validate: httpsUrl,
                  admin: { width: '50%', description: 'In links: {github}/repo-name' },
                },
                {
                  name: 'explorerUrl',
                  label: 'DAG explorer',
                  type: 'text',
                  defaultValue: 'https://explorer.obyte.org',
                  validate: httpsUrl,
                  admin: { width: '50%', description: 'In links: {explorer}/address/…' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'testnetExplorerUrl',
                  label: 'Testnet explorer',
                  type: 'text',
                  defaultValue: 'https://testnetexplorer.obyte.org',
                  validate: httpsUrl,
                  admin: { width: '50%', description: 'In links: {testnetExplorer}' },
                },
                {
                  name: 'discordUrl',
                  label: 'Discord',
                  type: 'text',
                  defaultValue: 'https://discord.obyte.org',
                  validate: httpsUrl,
                  admin: { width: '50%', description: 'In links: {discord}' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'telegramUrl',
                  label: 'Telegram',
                  type: 'text',
                  defaultValue: 'https://t.me/obyteorg',
                  validate: httpsUrl,
                  admin: { width: '50%', description: 'In links: {telegram}' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

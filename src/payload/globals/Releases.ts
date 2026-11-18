import type { Field, GlobalConfig, Tab } from 'payload'

import { authenticated } from '@/shared/cms/access'
import { httpsUrlValidator, imageField } from '@/shared/cms/fields'

import { revalidateEverything } from '../hooks/revalidate'
import { NETWORKS, PLATFORMS } from './releasePlatforms'

const httpsUrl = httpsUrlValidator(true)
const optionalHttpsUrl = httpsUrlValidator(false)

const networkTab = (name: 'mainnet' | 'testnet', label: string, repo: string): Tab => ({
  name,
  label,
  description: `Paste the new download URLs here when a release is published (${repo}). Every download link of the site follows automatically.`,
  fields: [
    {
      name: 'version',
      type: 'text',
      admin: { description: 'Current version, for reference (e.g. 5.0.2)', width: '30%' },
    },
    {
      name: 'files',
      type: 'array',
      labels: { singular: 'File', plural: 'Files' },
      admin: {
        initCollapsed: false,
        components: { RowLabel: '@/payload/globals/ReleaseRowLabel#ReleaseRowLabel' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'platform',
              type: 'select',
              required: true,
              options: [...PLATFORMS],
              admin: { width: '30%' },
            },
            {
              name: 'url',
              type: 'text',
              required: true,
              validate: httpsUrl,
              admin: { width: '70%' },
            },
          ],
        },
      ],
      validate: (rows: unknown) => {
        const platforms = ((rows as { platform?: string }[] | null) ?? []).map((r) => r.platform)
        return new Set(platforms).size === platforms.length || 'Each platform only once'
      },
    } as Field,
  ],
})

/**
 * Wallet binaries. Each network lists one URL per platform; `/downloads/<name>` (the old
 * .htaccess redirects, incl. the Byteball-era names) answers 303 → the URL of its platform, so a
 * new release is one URL per platform.
 */
export const Releases: GlobalConfig = {
  slug: 'releases',
  label: 'Wallet releases',
  access: { read: () => true, update: authenticated },
  hooks: { afterChange: [revalidateEverything] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        networkTab('mainnet', 'Mainnet', 'github.com/byteball/obyte-gui-wallet/releases'),
        networkTab('testnet', 'Testnet', 'github.com/byteball/testnet-releases/releases'),
        {
          name: 'apps',
          label: 'Mobile apps',
          description:
            'Store buttons in the Download sections (home page: mainnet, /testnet: testnet).',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  ...imageField('appStoreBadge', false, 'App Store badge'),
                  admin: { width: '50%' },
                },
                {
                  ...imageField('googlePlayBadge', false, 'Google Play badge'),
                  admin: { width: '50%' },
                },
              ],
            },
            ...(['mainnet', 'testnet'] as const).map((network): Field => ({
              name: network,
              type: 'group',
              label: network === 'mainnet' ? 'Mainnet' : 'Testnet',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'appStore',
                      label: 'App Store link',
                      type: 'text',
                      validate: optionalHttpsUrl,
                      admin: { width: '50%' },
                    },
                    {
                      name: 'googlePlay',
                      label: 'Google Play link',
                      type: 'text',
                      validate: optionalHttpsUrl,
                      admin: { width: '50%' },
                    },
                  ],
                },
              ],
            })),
          ],
        },
        {
          label: 'Download names',
          description:
            'Public links /downloads/<name> (used on the site and by old links around the web) and the file each one serves.',
          fields: [
            {
              name: 'aliases',
              type: 'array',
              labels: { singular: 'Download name', plural: 'Download names' },
              admin: { initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'filename',
                      type: 'text',
                      required: true,
                      unique: false,
                      admin: { width: '40%', description: 'Served at /downloads/<filename>' },
                      validate: (v: string | null | undefined) =>
                        (!!v && /^[A-Za-z0-9._-]+$/.test(v)) ||
                        'File name only (letters, digits, . _ -)',
                    },
                    {
                      name: 'network',
                      type: 'select',
                      required: true,
                      options: [...NETWORKS],
                      admin: { width: '25%' },
                    },
                    {
                      name: 'platform',
                      type: 'select',
                      required: true,
                      options: [...PLATFORMS],
                      admin: { width: '35%' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

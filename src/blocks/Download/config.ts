import type { Block } from 'payload'

import { anchorField, imageField, inlineRichText, linkField } from '@/shared/cms/fields'

/**
 * Wallet download section (old modular/download.html.twig) — home and /testnet. The App Store /
 * Google Play buttons come from Wallet releases → Mobile apps (per network).
 */
export const DownloadBlock: Block = {
  slug: 'download',
  interfaceName: 'DownloadBlock',
  fields: [
    anchorField,
    {
      name: 'network',
      type: 'select',
      required: true,
      defaultValue: 'mainnet',
      options: ['mainnet', 'testnet'],
    },
    inlineRichText({ name: 'title', required: true }),
    {
      type: 'row',
      fields: [
        { ...imageField('bigImage', true, 'Phone image (desktop)'), admin: { width: '50%' } },
        { ...imageField('smallImage', true, 'Phone image (mobile)'), admin: { width: '50%' } },
      ],
    },
    {
      name: 'downloadLinks',
      type: 'array',
      admin: { description: '/downloads/<file> links are resolved by the Releases global.' },
      fields: [{ name: 'label', type: 'text', required: true }, linkField()],
    },
    { name: 'body', type: 'richText' },
  ],
}

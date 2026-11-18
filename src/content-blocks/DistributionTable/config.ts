import type { Block } from 'payload'

import { contentEditorField, shortTextEditor } from '../contentEditor'

/**
 * /distribution: how GBYTE were distributed (old `.distribution-block`: intro + table).
 * The history column links each address to the DAG explorer (Site settings → Explorer).
 */
export const DistributionTableBlock: Block = {
  slug: 'distributionTable',
  interfaceName: 'DistributionTableBlock',
  labels: { singular: 'Distribution table', plural: 'Distribution tables' },
  fields: [
    contentEditorField('intro'),
    {
      name: 'headings',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'method', type: 'text', defaultValue: 'Method', required: true },
            { name: 'years', type: 'text', defaultValue: 'Years', required: true },
            { name: 'amount', type: 'text', defaultValue: 'GB distributed', required: true },
            { name: 'history', type: 'text', defaultValue: 'History', required: true },
          ],
        },
      ],
    },
    {
      name: 'rows',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        { name: 'method', type: 'richText', editor: shortTextEditor, required: true },
        {
          type: 'row',
          fields: [
            { name: 'years', type: 'text', required: true, admin: { width: '20%' } },
            {
              name: 'amount',
              type: 'text',
              required: true,
              admin: { width: '25%', description: 'e.g. 645,341.799 (decimals shown smaller)' },
            },
            {
              name: 'addresses',
              type: 'textarea',
              required: true,
              admin: {
                width: '55%',
                description: 'Obyte address(es), one per line (linked to the DAG explorer)',
              },
            },
          ],
        },
      ],
    },
  ],
}

import type { CollectionConfig, Field } from 'payload'

import { authenticated } from '@/shared/cms/access'

import { revalidateEverything } from '../hooks/revalidate'

/**
 * Small public lists shown on the site (team, exchanges, coin trackers, social links, timeline):
 * public read, drag-and-drop order in the list view (or a fixed sort, e.g. by date), a "show on
 * site" switch, and every page is rebuilt after a change (the lists can appear on any page).
 */
export const orderableList = ({
  slug,
  singular,
  plural,
  titleField = 'name',
  columns,
  description = 'Drag rows to change the order on the site.',
  sortBy,
  fields,
}: {
  slug: string
  singular: string
  plural: string
  titleField?: string
  columns: string[]
  description?: string
  /** fixed order instead of drag-and-drop, e.g. 'date' */
  sortBy?: string
  fields: Field[]
}): CollectionConfig => ({
  slug,
  labels: { singular, plural },
  orderable: !sortBy,
  defaultSort: sortBy,
  admin: {
    useAsTitle: titleField,
    defaultColumns: [...columns, 'showOnSite'],
    description,
    group: 'Lists',
  },
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [revalidateEverything],
    afterDelete: [revalidateEverything],
  },
  fields: [
    ...fields,
    {
      name: 'showOnSite',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Uncheck to hide without deleting.' },
    },
  ],
})

import type { CollectionConfig, FieldHook } from 'payload'

import { layoutBlocks } from '@/blocks'
import { authenticated, publishedOrAuthenticated } from '@/shared/cms/access'

import { revalidatePageAfterChange, revalidatePageAfterDelete } from '../hooks/revalidate'

export const HOME_SLUG = 'home'

/**
 * Public URL of the page, e.g. "/platform/smart-contracts" (home → "/").
 * Computed from the parent's path, so it does not depend on the order of the nested-docs hooks;
 * when a parent moves, nested-docs re-saves its children and their paths are recomputed.
 */
const computePath: FieldHook = async ({ siblingData, req }) => {
  const slug: string = siblingData.slug
  const parentId =
    typeof siblingData.parent === 'object' ? siblingData.parent?.id : siblingData.parent
  if (!parentId) return slug === HOME_SLUG ? '/' : `/${slug}`
  const parent = await req.payload.findByID({
    collection: 'pages',
    id: parentId,
    depth: 0,
    draft: true,
    select: { path: true },
    req,
  })
  return `${parent.path === '/' ? '' : parent.path}/${slug}`
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'path', '_status', 'updatedAt'],
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
    readVersions: authenticated,
  },
  versions: {
    drafts: { autosave: { interval: 1000 } },
    maxPerDoc: 50,
  },
  hooks: {
    afterChange: [revalidatePageAfterChange],
    afterDelete: [revalidatePageAfterDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'layout',
      type: 'blocks',
      blocks: layoutBlocks,
      required: true,
      minRows: 1,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: `URL segment. The home page uses "${HOME_SLUG}".`,
      },
      validate: (value: string | null | undefined) =>
        (!!value && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) ||
        'Lowercase letters, digits and dashes only.',
    },
    {
      name: 'path',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true, description: 'Computed from parent + slug' },
      hooks: { beforeChange: [computePath] },
    },
    {
      name: 'menuTitle',
      type: 'text',
      admin: { position: 'sidebar', description: 'Shorter title for menus/breadcrumbs' },
    },
    {
      name: 'sitemapPriority',
      type: 'number',
      min: 0,
      max: 1,
      defaultValue: 0.8,
      admin: { position: 'sidebar', step: 0.1 },
    },
  ],
}

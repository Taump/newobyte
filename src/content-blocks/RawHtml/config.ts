import type { Block } from 'payload'

import { adminsField } from '@/shared/cms/access'

/**
 * Escape hatch for markup the migration could not map to a block. Admin-only, and always
 * sanitized with DOMPurify when rendered. Target: zero RawHTML blocks at launch.
 */
export const RawHtmlBlock: Block = {
  slug: 'rawHtml',
  interfaceName: 'RawHtmlBlock',
  fields: [
    {
      name: 'html',
      type: 'code',
      required: true,
      admin: { language: 'html' },
      access: { create: adminsField, update: adminsField },
    },
  ],
}

import DOMPurify from 'isomorphic-dompurify'
import { APIError, type CollectionBeforeOperationHook, type CollectionConfig } from 'payload'

import { authenticated, isAdminUser } from '@/shared/cms/access'

import { MEDIA_DIR } from '../paths'

const SVG = 'image/svg+xml'

/**
 * SVG can carry scripts, so:
 * - only admins may upload SVG through the API/admin panel (trusted server code — the migration
 *   script — runs without a user and is allowed);
 * - every SVG is sanitized with DOMPurify's SVG profile before it is stored;
 * - SVG files are served with a sandboxing CSP (see next.config.ts headers()).
 */
const sanitizeSvgUpload: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation !== 'create' && operation !== 'update') return args
  const file = req.file
  if (!file || file.mimetype !== SVG) return args

  if (req.user && !isAdminUser(req)) {
    throw new APIError('Only admins can upload SVG files.', 403)
  }

  const clean = DOMPurify.sanitize(file.data.toString('utf8'), {
    USE_PROFILES: { svg: true, svgFilters: true },
  })
  if (!clean.trim()) {
    throw new APIError('The SVG file is empty after sanitization.', 400)
  }
  file.data = Buffer.from(clean, 'utf8')
  file.size = file.data.byteLength
  return args
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeOperation: [sanitizeSvgUpload],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Describe the image for screen readers, search engines and AI agents.',
      },
    },
    {
      // Set by the Grav migration: sha1 of the original file, used to de-duplicate re-runs.
      name: 'sourceHash',
      type: 'text',
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'sourcePath',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar', description: 'Original path on the old site' },
    },
  ],
  upload: {
    // ./media of the project (also for the standalone server), /app/media in Docker, or MEDIA_DIR
    staticDir: MEDIA_DIR,
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', SVG],
    // Cap originals; responsive variants are produced by next/image at request time.
    resizeOptions: {
      width: 2560,
      height: 2560,
      fit: 'inside',
      withoutEnlargement: true,
    },
    // SVGs get no raster sizes (they are served and previewed as the original file)
    imageSizes: [
      {
        // full-size WebP for images that render at their natural size (old page content,
        // which can't use a responsive srcset without changing the layout)
        name: 'webp',
        width: 2560,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },
      {
        // admin previews only (list view, upload fields, relationship pickers)
        name: 'thumbnail',
        width: 320,
        height: 320,
        fit: 'inside',
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
    ],
    adminThumbnail: ({ doc }) =>
      (doc as { sizes?: { thumbnail?: { url?: string | null } }; url?: string }).sizes?.thumbnail
        ?.url ??
      (doc as { url?: string }).url ??
      null,
  },
}

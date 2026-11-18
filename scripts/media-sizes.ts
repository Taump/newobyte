/**
 * Backfills image sizes (admin `thumbnail`, full-size `webp`) for media uploaded before they existed:
 * each raster file without one is re-uploaded from the media directory, which makes Payload
 * generate all configured sizes. Idempotent.
 *
 *   pnpm media:sizes
 */
import path from 'node:path'

import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config: await config })
const staticDir = path.resolve('media')
const { docs } = await payload.find({ collection: 'media', pagination: false, depth: 0 })
let done = 0
for (const doc of docs) {
  const sizes = (doc.sizes ?? {}) as Record<string, { filename?: string | null } | undefined>
  const complete = ['thumbnail', 'webp'].every((s) => sizes[s]?.filename)
  if (!doc.filename || doc.mimeType === 'image/svg+xml' || complete) continue
  await payload.update({
    collection: 'media',
    id: doc.id,
    data: {},
    filePath: path.join(staticDir, doc.filename),
    overwriteExistingFiles: true,
    context: { disableRevalidate: true },
  })
  done++
}
console.log(`✓ image sizes generated for ${done} of ${docs.length} media`)
process.exit(0)

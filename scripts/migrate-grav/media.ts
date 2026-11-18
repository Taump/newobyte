import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { Payload } from 'payload'

import type { Report } from './report'

export type ImportedMedia = { id: number; url: string }

/** Old asset references → file on disk. Handles `/user/...`, `../../user/...`, `theme://…`, `?v1`. */
export function resolveAssetPath(docroot: string, src: string): string | null {
  let p = src.trim().split(/[?#]/)[0]
  if (!p || /^(https?:|data:)/.test(p)) return null
  p = p.replace(/^theme:\/\//, '/user/themes/obyte/')
  p = p.replace(/^(\.\.\/)+/, '/')
  if (!p.startsWith('/')) return null
  return path.join(docroot, decodeURIComponent(p))
}

const humanize = (file: string) =>
  path
    .basename(file, path.extname(file))
    .replace(/[-_]+/g, ' ')
    .replace(/\b(img|svg|bg)\s*\d*\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Uploads old assets into the `media` collection once. Re-runs and duplicate files
 * (same bytes under different names) resolve to the same document via the sha1 `sourceHash`.
 */
export class MediaImporter {
  private byPath = new Map<string, ImportedMedia | null>()

  constructor(
    private payload: Payload,
    private docroot: string,
    private report: Report,
  ) {}

  async import(src: string, { page, alt }: { page: string; alt?: string | null }) {
    const file = resolveAssetPath(this.docroot, src)
    if (!file) return null
    if (this.byPath.has(file)) return this.byPath.get(file)!

    let data: Buffer
    try {
      data = await fs.readFile(file)
    } catch {
      this.report.missingFiles.push({ page, src })
      this.byPath.set(file, null)
      return null
    }
    const sourceHash = createHash('sha1').update(data).digest('hex')
    const sourcePath = path.relative(this.docroot, file)

    const existing = await this.payload.find({
      collection: 'media',
      where: { sourceHash: { equals: sourceHash } },
      limit: 1,
      depth: 0,
    })
    let doc = existing.docs[0]
    if (doc) {
      this.report.stats.mediaReused++
    } else {
      let altText = alt?.trim()
      if (!altText) {
        altText = humanize(file) || path.basename(file)
        this.report.missingAlt.push({ page, file: sourcePath, alt: altText })
      }
      doc = await this.payload.create({
        collection: 'media',
        data: { alt: altText, sourceHash, sourcePath },
        filePath: file,
        context: { disableRevalidate: true },
      })
      this.report.stats.mediaCreated++
    }
    // store site-relative URLs: the absolute form would bake the current serverURL into content
    const result = { id: doc.id, url: (doc.url ?? '').replace(/^https?:\/\/[^/]+/, '') }
    this.byPath.set(file, result)
    return result
  }

  /** Same as import() but returns just the id (for upload fields). */
  async id(src: string | undefined | null, opts: { page: string; alt?: string | null }) {
    if (!src) return null
    return (await this.import(src, opts))?.id ?? null
  }
}

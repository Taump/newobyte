import Image, { type ImageProps } from 'next/image'

import type { Media } from '@/payload-types'
import { mediaPath } from '@/shared/lib/siteUrl'

type Props = Omit<ImageProps, 'src' | 'alt' | 'width' | 'height'> & {
  media: Media | number | null | undefined
  alt?: string
  /**
   * Render like a plain <img> at the file's natural size (old page content): one full-size WebP,
   * no responsive srcset — with srcset the browser derives the intrinsic size from the `w`
   * descriptors, which next/image doesn't keep true for files smaller than the descriptor.
   */
  natural?: boolean
}

/**
 * Image from the `media` collection. Rasters go through next/image (AVIF/WebP, srcset);
 * SVGs are served as-is (already tiny and vector — the optimizer would only rasterize them).
 */
export function MediaImage({ media, alt, natural = false, ...props }: Props) {
  if (!media || typeof media === 'number' || !media.url) return null
  const isSvg = media.mimeType === 'image/svg+xml'
  // Payload prefixes uploads with serverURL; keep them site-relative (next/image localPatterns,
  // and the same markup works on any host: preview, staging, production)
  const webp = natural && !isSvg ? media.sizes?.webp?.url : null
  const src = mediaPath(webp ?? media.url)
  return (
    <Image
      src={src}
      alt={alt ?? media.alt}
      width={media.width ?? undefined}
      height={media.height ?? undefined}
      unoptimized={isSvg || natural}
      {...props}
    />
  )
}

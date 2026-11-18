'use client'

import { useRowLabel } from '@payloadcms/ui'

import { platformLabel } from './releasePlatforms'

/** "macOS (Intel) — Obyte-5.0.2.dmg" for a release file row. */
export function ReleaseRowLabel() {
  const { data, rowNumber } = useRowLabel<{ platform?: string; url?: string }>()
  const file = data?.url?.split('/').pop()
  const platform = platformLabel(data?.platform) ?? `File ${(rowNumber ?? 0) + 1}`
  return <span>{file ? `${platform} — ${file}` : platform}</span>
}

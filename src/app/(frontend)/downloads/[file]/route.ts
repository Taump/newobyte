import { notFound } from 'next/navigation'

import { getGlobal } from '@/payload/queries'

/**
 * /downloads/<name> → 303 to the current build (old .htaccess rules). The name picks a network +
 * platform in the Releases global, so publishing a release only changes the per-platform URL.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const releases = await getGlobal('releases')
  const alias = releases.aliases?.find((a) => a.filename === file)
  const url =
    alias && releases[alias.network]?.files?.find((f) => f.platform === alias.platform)?.url
  if (!url) notFound()
  return new Response(null, {
    status: 303,
    headers: { Location: url, 'Cache-Control': 'no-store' },
  })
}

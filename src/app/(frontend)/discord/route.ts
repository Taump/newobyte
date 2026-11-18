import { getGlobal } from '@/payload/queries'

/** /discord → the Discord invite from Site settings → Contacts & links (old .htaccess: 303). */
export async function GET() {
  const { discordUrl } = await getGlobal('site-settings')
  return new Response(null, {
    status: discordUrl ? 303 : 404,
    headers: discordUrl ? { Location: discordUrl, 'Cache-Control': 'no-store' } : {},
  })
}

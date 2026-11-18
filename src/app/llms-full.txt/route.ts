import { llmsFullTxt } from '@/payload/llms'

/** All pages as Markdown in one file (static, rebuilt when pages change). */
export const dynamic = 'force-static'

export async function GET() {
  return new Response(await llmsFullTxt(), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      // for AI agents, not search results
      'X-Robots-Tag': 'noindex',
    },
  })
}

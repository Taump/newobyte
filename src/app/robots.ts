import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/shared/lib/siteUrl'

/** AI crawlers are explicitly welcome (see also /llms.txt); the CMS is off limits. */
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
]

export default function robots(): MetadataRoute.Robots {
  // uploaded images live under /api/media/ and should stay indexable
  const allow = ['/', '/api/media/']
  const disallow = ['/admin', '/api/']
  return {
    rules: [
      { userAgent: '*', allow, disallow },
      { userAgent: AI_BOTS, allow, disallow },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}

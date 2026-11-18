/**
 * Public origin of the site (https://obyte.org in production, from NEXT_PUBLIC_SERVER_URL):
 * canonical URLs, Open Graph, sitemap, markdown links for agents.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://obyte.org').replace(
  /\/+$/,
  '',
)

/** Site-relative path or URL → absolute URL (absolute URLs pass through). */
export const absoluteUrl = (pathOrUrl: string) =>
  /^[a-z][a-z0-9+.-]*:/i.test(pathOrUrl)
    ? pathOrUrl
    : `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`

/** Markdown twin of a page: /platform → /platform.md, / → /index.md */
export const markdownPath = (path: string) => (path === '/' ? '/index.md' : `${path}.md`)

/** Media URL as stored by Payload (may carry the server origin) → site-relative. */
export const mediaPath = (url: string) => url.replace(/^https?:\/\/[^/]+(?=\/)/, '')

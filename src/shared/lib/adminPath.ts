/**
 * Public URL of the admin panel. `ADMIN_PATH=/some-hard-to-guess-path` hides it from scanners:
 * Payload builds every admin link from it, src/proxy.ts maps it onto the internal /admin route
 * and answers 404 on /admin itself. Default: /admin. Never listed in robots.txt or the sitemap.
 */
const raw = process.env.ADMIN_PATH?.trim().replace(/\/+$/, '') || '/admin'

if (!/^\/[A-Za-z0-9_-]{1,64}$/.test(raw)) {
  throw new Error(`ADMIN_PATH must look like /some-path (letters, digits, - and _), got "${raw}"`)
}

export const ADMIN_PATH = raw

/** The route folder of the admin panel (src/app/(payload)/admin). */
export const ADMIN_ROUTE = '/admin'

export const isUnder = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`)

import { NextResponse, type NextRequest } from 'next/server'

import { ADMIN_PATH, ADMIN_ROUTE, isUnder } from '@/shared/lib/adminPath'

/**
 * Request-level rules of the site:
 * - the admin panel answers only at ADMIN_PATH (hidden URL; /admin itself is 404 then) and is
 *   never indexed;
 * - first-user registration is closed in production (the only admin comes from the env, see
 *   src/payload/seed/envAdmin.ts);
 * - Markdown twins of pages for AI agents.
 */
const FIRST_USER = ['/create-first-user']
const FIRST_REGISTER_API = '/api/users/first-register'
const NOINDEX = { 'X-Robots-Tag': 'noindex, nofollow' }

const notFound = () => new NextResponse('Not Found', { status: 404, headers: NOINDEX })

function adminRequest(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hidden = ADMIN_PATH !== ADMIN_ROUTE
  // the internal route is reachable only through the configured path
  if (hidden && isUnder(pathname, ADMIN_ROUTE)) return notFound()
  if (!isUnder(pathname, ADMIN_PATH)) return null

  const rest = pathname.slice(ADMIN_PATH.length)
  if (process.env.NODE_ENV === 'production' && FIRST_USER.some((p) => isUnder(rest, p))) {
    return notFound()
  }
  const response = hidden
    ? NextResponse.rewrite(new URL(`${ADMIN_ROUTE}${rest}${request.nextUrl.search}`, request.url))
    : NextResponse.next()
  response.headers.set('X-Robots-Tag', NOINDEX['X-Robots-Tag'])
  return response
}

/** Markdown twins for AI agents: /platform.md, /index.md, or `Accept: text/markdown`. */
function markdownRewrite(request: NextRequest) {
  const { pathname } = request.nextUrl
  let path: string | null = null
  if (pathname.endsWith('.md')) {
    path = pathname === '/index.md' ? '/' : pathname.slice(0, -'.md'.length)
  } else if (wantsMarkdown(request.headers.get('accept'))) {
    path = pathname
  }
  if (path === null) return null
  const url = request.nextUrl.clone()
  url.pathname = path === '/' ? '/md' : `/md${path}`
  return NextResponse.rewrite(url)
}

/** Markdown asked for explicitly and preferred over HTML (browsers always send text/html). */
function wantsMarkdown(accept: string | null) {
  if (!accept?.includes('text/markdown')) return false
  const q = (type: string) => {
    const part = accept.split(',').find((p) => p.trim().startsWith(type))
    if (!part) return -1
    const m = /;\s*q=([\d.]+)/.exec(part)
    return m ? Number(m[1]) : 1
  }
  return q('text/markdown') >= q('text/html')
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isUnder(pathname, '/api')) {
    if (process.env.NODE_ENV === 'production' && isUnder(pathname, FIRST_REGISTER_API)) {
      return notFound()
    }
    // the CMS API is not for search engines (uploaded images under /api/media/file are)
    if (isUnder(pathname, '/api/media/file')) return NextResponse.next()
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', NOINDEX['X-Robots-Tag'])
    return response
  }

  return adminRequest(request) ?? markdownRewrite(request) ?? NextResponse.next()
}

export const config = {
  matcher: [
    // everything but Next's assets and plain files (*.md files are the markdown twins)
    '/((?!_next/|.*\\.(?!md$)[^/]+$).*)',
  ],
}

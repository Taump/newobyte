/**
 * Site-wide addresses kept in Site settings → Contacts & links. Any link in the CMS may start
 * with a token instead (`{explorer}/address/…`, `{github}/ocore`, `{discord}`); the page route
 * and the layout replace tokens with the configured addresses before rendering.
 */
export const SITE_LINK_TOKENS = {
  github: 'githubUrl',
  explorer: 'explorerUrl',
  testnetExplorer: 'testnetExplorerUrl',
  discord: 'discordUrl',
  telegram: 'telegramUrl',
} as const

export type SiteLinks = Partial<
  Record<(typeof SITE_LINK_TOKENS)[keyof typeof SITE_LINK_TOKENS], string | null>
>

const TOKEN = /^\{(\w+)\}(.*)$/s

/** Links saved before the editor stopped percent-encoding them: `%7Bexplorer%7D%2F…` (even twice). */
function decodeToken(url: string) {
  let out = url
  for (let i = 0; i < 3 && /^%(25)*7B/i.test(out); i++) {
    try {
      out = decodeURIComponent(out)
    } catch {
      return url
    }
  }
  return out
}

export function resolveSiteLink(url: string, links: SiteLinks): string {
  const m = TOKEN.exec(decodeToken(url))
  const key = m && SITE_LINK_TOKENS[m[1] as keyof typeof SITE_LINK_TOKENS]
  const base = key && links[key]
  return base ? base.replace(/\/+$/, '') + m![2] : url
}

/** Returns a copy of `value` with every token link resolved (CMS documents, Lexical JSON …). */
export function resolveSiteLinksDeep<T>(value: T, links: SiteLinks): T {
  if (typeof value === 'string')
    return (/^(\{|%(25)*7B)/i.test(value) ? resolveSiteLink(value, links) : value) as T
  if (Array.isArray(value)) return value.map((v) => resolveSiteLinksDeep(v, links)) as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = resolveSiteLinksDeep(v, links)
    return out as T
  }
  return value
}

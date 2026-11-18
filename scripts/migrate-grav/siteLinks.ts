/**
 * Old absolute links to site-wide addresses → tokens resolved from Site settings
 * (src/shared/lib/siteLinks.ts): `https://explorer.obyte.org/address/X` → `{explorer}/address/X`.
 * Channels (Discord, Telegram) only when the link is the channel itself.
 */
const PREFIXES: [RegExp, string][] = [
  [/^https?:\/\/github\.com\/byteball(?=\/|$)/i, '{github}'],
  [/^https?:\/\/testnetexplorer\.obyte\.org(?=\/|$)/i, '{testnetExplorer}'],
  [/^https?:\/\/explorer\.obyte\.org(?=\/|$)/i, '{explorer}'],
  [/^https?:\/\/discord\.obyte\.org\/?$/i, '{discord}'],
  [/^https?:\/\/t\.me\/obyteorg\/?$/i, '{telegram}'],
]

export function toSiteLinkToken(url: string): string {
  for (const [re, token] of PREFIXES) {
    if (re.test(url)) return url.replace(re, token).replace(/^(\{\w+\})\/$/, '$1')
  }
  return url
}

/** Deep copy with every matching URL string tokenized (page layouts, globals, list items). */
export function tokenizeSiteLinks<T>(value: T): T {
  if (typeof value === 'string')
    return (/^https?:\/\//.test(value) ? toSiteLinkToken(value) : value) as T
  if (Array.isArray(value)) return value.map(tokenizeSiteLinks) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, tokenizeSiteLinks(v)])) as T
  }
  return value
}

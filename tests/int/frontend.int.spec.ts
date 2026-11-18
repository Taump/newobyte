// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { isActivePath } from '@/shared/lib/isActivePath'
import { parseTextcoin } from '@/widgets/TextcoinBanner/TextcoinBanner'

describe('textcoin links', () => {
  it('accepts mnemonic words', () => {
    expect(parseTextcoin('#textcoin?fringe-scheme-erode-wish')).toBe('fringe-scheme-erode-wish')
  })
  it('ignores anything else', () => {
    expect(parseTextcoin('#download')).toBeNull()
    expect(parseTextcoin('#textcoin?<img src=x onerror=alert(1)>')).toBeNull()
    expect(parseTextcoin('#textcoin?a b')).toBeNull()
    expect(parseTextcoin('#textcoin?')).toBeNull()
  })
})

describe('active navigation item', () => {
  it('matches the page and its children', () => {
    expect(isActivePath('/platform', '/platform')).toBe(true)
    expect(isActivePath('/platform/oracles', '/platform')).toBe(true)
    expect(isActivePath('/platforms', '/platform')).toBe(false)
  })
  it('never marks anchors or external links', () => {
    expect(isActivePath('/', '/#download')).toBe(false)
    expect(isActivePath('/', 'https://blog.obyte.org')).toBe(false)
    expect(isActivePath('/faq', '/')).toBe(false)
  })
})

describe('RawHTML sanitizer', () => {
  it('removes scripts, handlers, iframes and javascript: URLs', () => {
    const out = sanitizeHtml(
      '<div onclick="x()"><script>alert(1)</script><img src="/a.png" onerror="alert(2)"><iframe src="https://evil"></iframe><a href="javascript:alert(3)">x</a></div>',
    )
    expect(out).not.toMatch(/script|onclick|onerror|iframe|javascript:/i)
    expect(out).toContain('<img src="/a.png">')
  })
  it('only allows our own media in inline style URLs', () => {
    expect(
      sanitizeHtml('<div style="background-image:url(/api/media/file/a.png)"></div>'),
    ).toContain('url(')
    expect(
      sanitizeHtml('<div style="background-image:url(https://evil/x.png)"></div>'),
    ).not.toContain('style')
  })
})

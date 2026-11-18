// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { unobfuscateEmails, videoFromIframe } from '../../scripts/migrate-grav/content'
import { buildReleases } from '../../scripts/migrate-grav/globals'
import { hyphenize } from '../../scripts/migrate-grav/grav'
import {
  applyGravLinkAttributes,
  gravMarkdownToHtml,
  splitSegments,
} from '../../scripts/migrate-grav/markdown'
import { resolveAssetPath } from '../../scripts/migrate-grav/media'
import { monthStart } from '../../scripts/migrate-grav/month'
import { toSiteLinkToken } from '../../scripts/migrate-grav/siteLinks'
import { resolveSiteLink } from '../../src/shared/lib/siteLinks'

// Fixtures are trimmed copies of real old-site content (old-site/ is not in git).

describe('Parsedown-compatible markdown', () => {
  it('keeps an HTML block with blank lines and indentation together (CommonMark would not)', () => {
    const md = [
      '# Smart Contracts',
      '<div class="sub-text-block">',
      '    <p>',
      '        first',
      '',
      '        still inside the div, not a code block',
      '    </p>',
      '</div>',
      '',
      '## How do Smart Contracts work?',
    ].join('\n')
    const segments = splitSegments(md)
    expect(segments.map((s) => s.kind)).toEqual(['md', 'html', 'md'])
    expect(segments[1].text).toContain('still inside the div')

    const html = gravMarkdownToHtml(md)
    expect(html).not.toContain('<pre>')
    expect(html).toContain('<h1>Smart Contracts</h1>')
    expect(html).toContain('<h2>How do Smart Contracts work?</h2>')
  })

  it('counts nested tags of the same name', () => {
    const md = '<div class="a">\n  <div class="b">x</div>\n\n  <div>y</div>\n</div>\nafter'
    const [html, rest] = splitSegments(md)
    expect(html.text.endsWith('</div>')).toBe(true)
    expect(html.text).toContain('<div>y</div>')
    expect(rest).toEqual({ kind: 'md', text: 'after' })
  })

  it('treats lines starting with inline tags as markdown paragraphs', () => {
    expect(splitSegments('<b>bold</b> text')[0].kind).toBe('md')
  })

  it('accepts headings without a space after #', () => {
    expect(gravMarkdownToHtml('#Resources')).toContain('<h1>Resources</h1>')
  })

  it('does not parse markdown inside HTML blocks', () => {
    expect(gravMarkdownToHtml('<div>\n**not bold**\n</div>')).toContain('**not bold**')
  })

  it('turns Grav link query params into attributes', () => {
    const html = gravMarkdownToHtml(
      '[DAG explorer](https://explorer.obyte.org/?target=_blank&rel=noopener)',
    )
    expect(html).toContain('href="https://explorer.obyte.org/" target="_blank" rel="noopener"')
  })

  it('keeps other query params', () => {
    expect(applyGravLinkAttributes('<a href="https://x.y/?a=1&amp;target=_blank">')).toBe(
      '<a href="https://x.y/?a=1" target="_blank">',
    )
  })
})

describe('content helpers', () => {
  it('un-obfuscates document.write e-mail links', () => {
    const src = `email <script>document.write('<a href="mailto:o'); document.write('@'); document.write('obyte.org">o'); document.write('@'); document.write('obyte.org</a>');</script>.`
    expect(unobfuscateEmails(src)).toBe('email <a href="mailto:o@obyte.org">o@obyte.org</a>.')
  })

  it('extracts YouTube and Vimeo ids', () => {
    const iframe = (src: string) => ({ getAttribute: () => src }) as unknown as Element
    expect(videoFromIframe(iframe('https://www.youtube.com/embed/ELKpFTOJtmU'))).toEqual({
      provider: 'youtube',
      videoId: 'ELKpFTOJtmU',
    })
    expect(videoFromIframe(iframe('https://player.vimeo.com/video/151901736'))).toEqual({
      provider: 'vimeo',
      videoId: '151901736',
    })
    expect(videoFromIframe(iframe('https://cryptocoin.pro/widget'))).toBeNull()
  })

  it('hyphenizes like Grav', () => {
    expect(hyphenize('GBYTE Exchanges')).toBe('gbyte-exchanges')
    expect(hyphenize('Download')).toBe('download')
    // tags stay as words (old /#the-future-is-br-b-decentralized-b links keep working)
    expect(hyphenize('The future is<br><b>decentralized</b>')).toBe(
      'the-future-is-br-b-decentralized-b',
    )
  })

  it('resolves old asset paths', () => {
    expect(resolveAssetPath('/d', '/user/themes/obyte/assets/a.png?v2')).toBe(
      '/d/user/themes/obyte/assets/a.png',
    )
    expect(resolveAssetPath('/d', '../../user/themes/obyte/assets/b.png')).toBe(
      '/d/user/themes/obyte/assets/b.png',
    )
    expect(resolveAssetPath('/d', 'theme://assets/c.svg')).toBe('/d/user/themes/obyte/assets/c.svg')
    expect(resolveAssetPath('/d', 'https://cdn.example.com/x.png')).toBeNull()
  })

  it('reads download redirects from .htaccess into per-network files + aliases', () => {
    const gh = 'https://github.com/byteball/obyte-gui-wallet/releases/download'
    const htaccess = [
      `RewriteRule ^downloads\\/Obyte-win64.exe ${gh}/v5.0.2/Obyte.Setup.5.0.2.exe [R=303,L]`,
      `RewriteRule ^downloads\\/Byteball-win64.exe ${gh}/v5.0.2/Obyte.Setup.5.0.2.exe [R=303,L]`,
      `RewriteRule ^downloads\\/Obyte-arm64.dmg ${gh}/v5.0.2/Obyte-5.0.2-arm64.dmg [R=303,L]`,
      'RewriteRule ^downloads\\/Obyte-test-win32.exe https://github.com/byteball/testnet-releases/releases/download/v3.2.0t/Obyte-TN-win32.exe [R=303,L]',
      'RewriteRule ^discord$ https://discordapp.com/invite/Qn6JWfT [R=303,L]',
    ].join('\n')
    const r = buildReleases(htaccess)
    expect(r.mainnet.version).toBe('5.0.2')
    expect(r.mainnet.files.map(({ platform, url }) => ({ platform, url }))).toEqual([
      { platform: 'win64', url: `${gh}/v5.0.2/Obyte.Setup.5.0.2.exe` },
      { platform: 'macArm', url: `${gh}/v5.0.2/Obyte-5.0.2-arm64.dmg` },
    ])
    expect(r.testnet.files.map((f) => f.platform)).toEqual(['win32'])
    expect(
      r.aliases.map(({ filename, network, platform }) => [filename, network, platform]),
    ).toEqual([
      ['Obyte-win64.exe', 'mainnet', 'win64'],
      ['Byteball-win64.exe', 'mainnet', 'win64'],
      ['Obyte-arm64.dmg', 'mainnet', 'macArm'],
      ['Obyte-test-win32.exe', 'testnet', 'win32'],
    ])
  })

  it('treats a lone <br> line like Parsedown (paragraph text; a heading still follows)', () => {
    const html = gravMarkdownToHtml('* item\n\n<br>\n## Legal\nText.')
    expect(html).toMatch(/<p><span><\/span><br><\/p>\s*<h2>Legal<\/h2>\s*<p>Text\.<\/p>/)
  })

  it('parses Grav month labels', () => {
    expect(monthStart('Sep 2016')).toBe('2016-09-01T12:00:00.000Z')
    expect(monthStart('April 2020')).toBe('2020-04-01T12:00:00.000Z')
    expect(() => monthStart('Spring 2020')).toThrow()
  })

  it('turns site-wide addresses into tokens that resolve back from Site settings', () => {
    const settings = {
      githubUrl: 'https://github.com/byteball',
      explorerUrl: 'https://explorer.obyte.org',
      telegramUrl: 'https://t.me/obyteorg',
    }
    const cases: [string, string][] = [
      ['https://explorer.obyte.org/address/ABC', '{explorer}/address/ABC'],
      ['https://github.com/byteball/ocore', '{github}/ocore'],
      ['https://t.me/obyteorg', '{telegram}'],
      ['https://t.me/ByteballQuizBot', 'https://t.me/ByteballQuizBot'], // not the channel
      ['https://github.com/byteballx', 'https://github.com/byteballx'],
    ]
    for (const [url, token] of cases) {
      expect(toSiteLinkToken(url)).toBe(token)
      expect(resolveSiteLink(token, settings)).toBe(url)
    }
    // a changed setting moves every link
    expect(resolveSiteLink('{explorer}/address/ABC', { explorerUrl: 'https://x.org/' })).toBe(
      'https://x.org/address/ABC',
    )
    // links percent-encoded by the editor before the fix (once or twice)
    expect(resolveSiteLink('%7Btelegram%7D', settings)).toBe('https://t.me/obyteorg')
    expect(resolveSiteLink('%257Bgithub%257D%252FOIPs%252Fx.md', settings)).toBe(
      'https://github.com/byteball/OIPs/x.md',
    )
  })
})

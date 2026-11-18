import { expect, test } from '@playwright/test'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

test.describe('SEO and agent access', () => {
  test('page head: title, description, canonical, share tags, markdown alternate', async ({
    page,
  }) => {
    await page.goto(`${BASE}/platform/smart-contracts`)
    await expect(page).toHaveTitle(
      'Smart Contracts | Obyte — a fully decentralized, DAG based crypto.',
    )
    const meta = (sel: string) => page.locator(`meta[${sel}]`).getAttribute('content')
    const description = await meta('name="description"')
    expect(description).toContain('Smart contracts on Obyte')
    expect(await meta('name="twitter:description"')).toBe(description)
    expect(await meta('property="og:url"')).toMatch(/\/platform\/smart-contracts$/)
    expect(await meta('property="og:image"')).toMatch(/phone-shadow\.png$/)
    expect(await meta('name="twitter:card"')).toBe('summary_large_image')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/platform\/smart-contracts$/,
    )
    await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
      'href',
      /\/platform\/smart-contracts\.md$/,
    )
  })

  test('structured data: FAQPage on /faq, breadcrumbs on nested pages', async ({ page }) => {
    const types = async () =>
      page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent!)['@type']))
    await page.goto(`${BASE}/faq`)
    expect(await types()).toContain('FAQPage')
    await page.goto(`${BASE}/platform/oracles`)
    expect(await types()).toEqual(['BreadcrumbList'])
    await page.goto(`${BASE}/`)
    expect(await types()).toEqual(['Organization', 'WebSite', 'SoftwareApplication'])
  })

  test('markdown twins: .md suffix and Accept header', async ({ request }) => {
    const md = await request.get(`${BASE}/platform/oracles.md`)
    expect(md.headers()['content-type']).toContain('text/markdown')
    expect(await md.text()).toMatch(/^---\ntitle: "Oracles \|/)
    const home = await request.get(`${BASE}/index.md`)
    expect(await home.text()).toContain('## Timeline')
    const negotiated = await request.get(`${BASE}/faq`, { headers: { Accept: 'text/markdown' } })
    expect(negotiated.headers()['content-type']).toContain('text/markdown')
    const browser = await request.get(`${BASE}/faq`, {
      headers: { Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' },
    })
    expect(browser.headers()['content-type']).toContain('text/html')
  })

  test('llms.txt, sitemap and robots', async ({ request }) => {
    const llms = await (await request.get(`${BASE}/llms.txt`)).text()
    expect(llms).toMatch(/^# Obyte\n\n> /)
    expect(llms).toContain('/platform/oracles.md')
    expect(await (await request.get(`${BASE}/llms-full.txt`)).text()).toContain('# Smart Contracts')
    const sitemap = await (await request.get(`${BASE}/sitemap.xml`)).text()
    expect(sitemap).toContain('/platform/smart-contracts</loc>')
    expect(sitemap).toContain('<priority>0.6</priority>') // careers
    const robots = await (await request.get(`${BASE}/robots.txt`)).text()
    expect(robots).toContain('User-Agent: ClaudeBot')
    expect(robots).toContain('Disallow: /admin')
  })

  test('old URLs redirect', async ({ request }) => {
    const go = (path: string) => request.get(`${BASE}${path}`, { maxRedirects: 0 })
    expect((await go('/terms.html')).status()).toBe(308)
    expect((await go('/terms.html')).headers().location).toMatch(/\/legal\/terms$/)
    expect((await go('/coin_info.json')).status()).toBe(303)
    expect((await go('/milan2019')).headers().location).toBe('https://old.obyte.org/milan2019')
    expect((await go('/discord')).status()).toBe(303)
  })
})

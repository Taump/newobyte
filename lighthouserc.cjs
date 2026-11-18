/**
 * Lighthouse CI budgets (docs/MIGRATION_PLAN.md, M8). Runs against an already started server:
 *
 *   pnpm build && pnpm start                     # or any deployed URL
 *   pnpm perf                                    # mobile (simulated slow 4G, 4× CPU)
 *   PERF_PRESET=desktop pnpm perf                # desktop
 *   PERF_BASE_URL=https://staging.obyte.org pnpm perf
 *
 * Mobile thresholds are what the simulation gives a static Next.js page here (React + Next
 * runtime ≈ 190 KB gzip of JS; LCP ≈ 2.1 s with real throttling, ≈ 2.6–3.2 s simulated).
 * Reports: .lighthouseci/ (gitignored).
 */
const base = (process.env.PERF_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const desktop = process.env.PERF_PRESET === 'desktop'

const PAGES = ['/', '/platform', '/platform/identity', '/faq', '/developers', '/events', '/testnet']

module.exports = {
  ci: {
    collect: {
      url: PAGES.map((p) => base + p),
      numberOfRuns: 1,
      settings: {
        ...(desktop ? { preset: 'desktop' } : {}),
        chromeFlags: '--headless=new',
        onlyCategories: ['performance', 'seo', 'best-practices', 'accessibility'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: desktop ? 0.95 : 0.85 }],
        'categories:seo': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        // the old design's colours and link styles are kept (pixel parity)
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'total-blocking-time': ['error', { maxNumericValue: desktop ? 50 : 150 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: desktop ? 1500 : 3500 }],
        'total-byte-weight': ['error', { maxNumericValue: 1_000_000 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 230_000 }],
        'resource-summary:font:size': ['warn', { maxNumericValue: 100_000 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
}

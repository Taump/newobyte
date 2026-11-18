import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { preload } from 'react-dom'

import { getGlobal, getList } from '@/payload/queries'
import { resolveSiteLinksDeep } from '@/shared/lib/siteLinks'
import { SITE_URL } from '@/shared/lib/siteUrl'
import { Footer } from '@/widgets/Footer/Footer'
import { Header } from '@/widgets/Header/Header'
import { MobileNav } from '@/widgets/MobileNav/MobileNav'
import { ScrollToTop } from '@/widgets/ScrollToTop/ScrollToTop'
import { TextcoinBanner } from '@/widgets/TextcoinBanner/TextcoinBanner'

import './globals.css'

/** Faces used above the fold on most pages (header, hero, page titles). Others load on demand. */
const PRELOAD_FONTS = [
  '/fonts/noto-sans-v42-700-latin.woff2',
  '/fonts/open-sans-v44-400-latin.woff2',
  '/fonts/open-sans-v44-700-latin.woff2',
  '/fonts/open-sans-v17-300-latin.woff2',
]

/** Page titles, descriptions and share tags: generateMetadata of the page route. */
export const metadata: Metadata = { metadataBase: new URL(SITE_URL) }

export const viewport: Viewport = { themeColor: '#ffffff' }

export default async function RootLayout({ children }: { children: ReactNode }) {
  for (const href of PRELOAD_FONTS) {
    preload(href, { as: 'font', type: 'font/woff2', crossOrigin: '' })
  }
  const settings = await getGlobal('site-settings')
  // `{github}`, `{discord}` … link tokens → the addresses from Site settings
  const [header, footer, socialLinks, releases] = resolveSiteLinksDeep(
    await Promise.all([
      getGlobal('header'),
      getGlobal('footer'),
      getList('social-links'),
      getGlobal('releases'),
    ]),
    settings,
  )
  // Static pages: the year is fixed at build/revalidation time (any CMS edit rebuilds the layout).
  const year = new Date().getFullYear()

  return (
    <html lang="en">
      <body id="top">
        <ScrollToTop />
        <TextcoinBanner
          appStore={releases.apps?.mainnet?.appStore}
          googlePlay={releases.apps?.mainnet?.googlePlay}
        />
        {/* old #page-wrapper: fixed header + content, pushed below the header */}
        <div id="page-wrapper" className="flex-[1_0_auto] overflow-hidden pt-100 max-sm:pt-56">
          <Header data={header} />
          <main id="start">{children}</main>
        </div>
        <Footer data={footer} socialLinks={socialLinks} year={year} />
        <MobileNav
          header={header}
          copyright={{
            text: footer.mobileCopyright ?? '© {year} Obyte.',
            year,
            link: footer.copyrightLink,
          }}
        />
      </body>
    </html>
  )
}

/**
 * <head> of public pages, as on the old site (partials/base.html.twig + metadata), with the fixes
 * from the plan: twitter:description is the page's description (the old site always used the
 * site default), a page may set its own share image, and the markdown twin is linked.
 */
import type { Metadata } from 'next'

import type { Media, Page, SiteSetting } from '@/payload-types'
import { absoluteUrl, markdownPath, mediaPath } from '@/shared/lib/siteUrl'

/** Share images of the old site (kept at their old URLs, other sites link to them). */
const OLD_OG_IMAGE = '/user/themes/obyte/assets/phone-shadow.png'
const OLD_TWITTER_IMAGE = '/user/themes/obyte/assets/phone-twitter.png'

/** "Smart Contracts | Obyte — …"; the home page has the site title only. */
export const pageTitle = (page: Page, settings: SiteSetting) =>
  page.path === '/'
    ? settings.siteTitle
    : `${page.meta?.title || page.title} | ${settings.siteTitle}`

export const pageDescription = (page: Page, settings: SiteSetting) =>
  page.meta?.description || settings.defaultDescription

const mediaUrl = (m: number | Media | null | undefined) =>
  typeof m === 'object' && m?.url ? absoluteUrl(mediaPath(m.url)) : null

export function pageMetadata(page: Page, settings: SiteSetting): Metadata {
  const path = page.path ?? '/'
  const url = absoluteUrl(path)
  const title = pageTitle(page, settings)
  const description = pageDescription(page, settings)
  const image = mediaUrl(page.meta?.image) ?? mediaUrl(settings.defaultOgImage)
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
      types: { 'text/markdown': absoluteUrl(markdownPath(path)) },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      images: [image ?? absoluteUrl(OLD_OG_IMAGE)],
    },
    twitter: {
      card: 'summary_large_image',
      site: settings.twitterSite || undefined,
      title,
      description,
      images: [image ?? absoluteUrl(OLD_TWITTER_IMAGE)],
    },
  }
}

/**
 * Globals from the old theme/config:
 * - header: menu tree = visible (numerically prefixed) pages, like macros.nav_loop;
 * - footer: link columns, newsletter, social icons, copyright from partials/footer.html.twig;
 * - releases: /downloads/* rules from docroot/.htaccess;
 * - site settings: user/config/site.yaml.
 */
import fs from 'node:fs/promises'
import path from 'node:path'

import matter from 'gray-matter'
import { JSDOM } from 'jsdom'

import type { GravPage } from './grav'
import { nodeId } from './lexical'
import type { MediaImporter } from './media'

const theme = (docroot: string, ...p: string[]) => path.join(docroot, 'user/themes/obyte', ...p)
const isExternal = (a: Element) => a.getAttribute('target') === '_blank'
const label = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? ''

export function buildHeader(pages: GravPage[], baseTwig: string) {
  const menuPages = (parent: string | null) =>
    pages
      .filter(
        (p) => p.parentRoute === parent && p.route !== '/' && p.visibleInMenu && p.order !== null,
      )
      .sort((a, b) => a.order! - b.order!)
  const item = (p: GravPage) => ({
    id: nodeId(),
    label: String(p.header.menu ?? p.header.title),
    link: p.route,
  })

  // Mobile menu extra links (base.html.twig `ul.other-menu`)
  const { document } = new JSDOM(baseTwig).window
  const extra = Array.from(document.querySelectorAll('ul.other-menu a')).map((a) => ({
    id: nodeId(),
    label: label(a),
    link: a.getAttribute('href')!,
    newTab: isExternal(a),
  }))

  return {
    navItems: menuPages(null).map((p) => ({ ...item(p), children: menuPages(p.route).map(item) })),
    cta: { label: 'Download wallet', link: '/#download' },
    mobileExtraLinks: extra,
  }
}

export async function buildFooter(footerTwig: string, media: MediaImporter) {
  // Twig comments/expressions are irrelevant for the data we read
  const html = footerTwig.replace(/\{#[\s\S]*?#\}/g, '')
  const { document } = new JSDOM(html).window

  const columns = Array.from(document.querySelectorAll('.menu-list > .menu-block')).map(
    (block) => ({
      id: nodeId(),
      title: label(block.querySelector('.title')),
      links: Array.from(block.querySelectorAll('.category-list > a')).map((a) => ({
        id: nodeId(),
        label: label(a),
        link: a.getAttribute('href')!,
        newTab: isExternal(a),
      })),
    }),
  )

  const socialLinks = []
  for (const a of Array.from(document.querySelectorAll('a.community-block'))) {
    const [icon, hover] = Array.from(a.querySelectorAll('img'))
    const name = icon.getAttribute('alt') || 'social'
    socialLinks.push({
      id: nodeId(),
      name,
      link: a.getAttribute('href')!,
      icon: await media.id(icon.getAttribute('src'), { page: 'footer', alt: name }),
      iconHover: await media.id(hover?.getAttribute('src'), { page: 'footer', alt: name }),
    })
  }

  const form = document.querySelector('form.ml-block-form')
  const success = document.querySelector('.ml-form-successBody')
  const copyrightLink = document.querySelector('.copyright a')

  return {
    columns,
    newsletter: {
      enabled: Boolean(form),
      action: form?.getAttribute('action') ?? undefined,
      placeholder:
        form?.querySelector('input[type=email]')?.getAttribute('placeholder') ?? undefined,
      buttonLabel:
        label(form?.querySelector('button.primary') ?? form?.querySelector('button')) || undefined,
      successTitle: label(success?.querySelector('h4')) || undefined,
      successText: label(success?.querySelector('p')) || undefined,
    },
    socialLinks,
    copyright: '© 2016-{year} Obyte.',
    mobileCopyright: '© {year} Obyte.', // partials/base.html.twig mobile menu
    copyrightLink: {
      label: copyrightLink ? label(copyrightLink) : undefined,
      url: copyrightLink?.getAttribute('href') ?? undefined,
    },
  }
}

/** Old /downloads/<name> file names → network + platform. */
function classifyDownload(file: string) {
  const network = /-test-/.test(file) ? 'testnet' : 'mainnet'
  const platform = /win64/.test(file)
    ? 'win64'
    : /win32/.test(file)
      ? 'win32'
      : /arm64/.test(file)
        ? 'macArm'
        : /osx64/.test(file)
          ? 'macIntel'
          : /linux64|AppImage/.test(file)
            ? 'linux'
            : null
  if (!platform) throw new Error(`unknown download platform: ${file}`)
  return { network, platform } as const
}

/** .htaccess `RewriteRule ^downloads/<file> <url> [R=303]` → per-network files + aliases. */
export function buildReleases(htaccess: string) {
  const rules = [
    ...htaccess.matchAll(/^RewriteRule \^downloads\\\/(\S+?) (https:\/\/\S+) \[R=303,L\]/gm),
  ].map(([, file, url]) => ({ file: file.replace(/\\/g, ''), url, ...classifyDownload(file) }))

  const network = (name: 'mainnet' | 'testnet') => {
    const files = new Map<ReturnType<typeof classifyDownload>['platform'], string>()
    for (const r of rules)
      if (r.network === name && !files.has(r.platform)) files.set(r.platform, r.url)
    const version = files.get('win64')?.match(/\/download\/v([\w.-]+)\//)?.[1] ?? null
    return {
      version,
      files: [...files].map(([platform, url]) => ({ id: nodeId(), platform, url })),
    }
  }
  // the same file name must keep serving the same URL it did before
  for (const r of rules) {
    const chosen = network(r.network).files.find((f) => f.platform === r.platform)!.url
    if (chosen !== r.url) throw new Error(`${r.file}: ${r.url} differs from ${chosen}`)
  }
  return {
    mainnet: network('mainnet'),
    testnet: network('testnet'),
    aliases: rules.map((r) => ({
      id: nodeId(),
      filename: r.file,
      network: r.network,
      platform: r.platform,
    })),
  }
}

/** App Store / Google Play buttons of the download modules (per network) → Releases → apps. */
export async function buildReleaseApps(pages: GravPage[], media: MediaImporter) {
  const apps: Record<string, unknown> = {}
  for (const m of pages.flatMap((p) => p.modules).filter((m) => m.template === 'download')) {
    const network = String(m.header.class ?? '').includes('testnet') ? 'testnet' : 'mainnet'
    const links: Record<string, string> = {}
    for (const p of (m.header.programs ?? []) as { imgLink: string; link: string }[]) {
      const google = p.imgLink.includes('google')
      links[google ? 'googlePlay' : 'appStore'] = p.link
      const badge = google ? 'googlePlayBadge' : 'appStoreBadge'
      apps[badge] ??= await media.id(p.imgLink, {
        page: 'releases',
        alt: google ? 'Get it on Google Play' : 'Download on the App Store',
      })
    }
    apps[network] = links
  }
  return apps
}

export async function buildSiteSettings(docroot: string) {
  const raw = await fs.readFile(path.join(docroot, 'user/config/site.yaml'), 'utf8')
  const site = matter(`---\n${raw}\n---\n`).data
  return {
    siteTitle: site.title,
    defaultDescription: site.metadata?.description,
    twitterSite: '@ObyteOrg',
    contactEmail: 'o@obyte.org',
    jobsEmail: 'jobs@obyte.org',
    githubUrl: 'https://github.com/byteball',
    explorerUrl: 'https://explorer.obyte.org',
    testnetExplorerUrl: 'https://testnetexplorer.obyte.org',
    discordUrl: 'https://discord.obyte.org',
    telegramUrl: 'https://t.me/obyteorg',
  }
}

export async function readThemeFiles(docroot: string) {
  const [footer, base, htaccess] = await Promise.all([
    fs.readFile(theme(docroot, 'templates/partials/footer.html.twig'), 'utf8'),
    fs.readFile(theme(docroot, 'templates/partials/base.html.twig'), 'utf8'),
    fs.readFile(path.join(docroot, '.htaccess'), 'utf8'),
  ])
  return { footer, base, htaccess }
}

/**
 * /llms.txt (https://llmstxt.org): what Obyte is + every page with a link to its markdown twin;
 * /llms-full.txt: all pages' markdown in one file.
 */
import { absoluteUrl, markdownPath } from '@/shared/lib/siteUrl'

import { getPageData } from './pageData'
import { pageToMarkdown } from './pageMarkdown'
import { getGlobal, getPublishedPages } from './queries'

export async function llmsTxt(): Promise<string> {
  const [settings, pages] = await Promise.all([getGlobal('site-settings'), getPublishedPages()])
  const links = [
    ['White paper', absoluteUrl('/Byteball.pdf')],
    ['GitHub', settings.githubUrl],
    ['DAG explorer', settings.explorerUrl],
    ['Discord', settings.discordUrl],
    ['Telegram', settings.telegramUrl],
  ].filter((l): l is [string, string] => !!l[1])
  return [
    '# Obyte',
    `> ${(settings.llmsIntro || settings.defaultDescription).replace(/\s*\n\s*/g, ' ')}`,
    `Every page is also available as Markdown (the links below; or send \`Accept: text/markdown\`). All pages in one file: ${absoluteUrl('/llms-full.txt')}`,
    '## Pages',
    pages
      .map((p) => {
        const description = p.meta?.description ? `: ${p.meta.description}` : ''
        return `- [${p.path === '/' ? 'Home' : p.title}](${absoluteUrl(markdownPath(p.path))})${description}`
      })
      .join('\n'),
    '## Optional',
    links.map(([label, url]) => `- [${label}](${url})`).join('\n'),
    '',
  ].join('\n\n')
}

export async function llmsFullTxt(): Promise<string> {
  const pages = await getPublishedPages()
  const docs = await Promise.all(pages.map((p) => getPageData(p.path)))
  return docs
    .filter((d) => d !== null)
    .map(pageToMarkdown)
    .join('\n\n')
}

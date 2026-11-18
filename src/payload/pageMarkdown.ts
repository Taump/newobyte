import { blocksToMarkdown } from '@/blocks/markdown'
import type { MarkdownContext } from '@/content-blocks/markdown'
import { absoluteUrl } from '@/shared/lib/siteUrl'

import type { PageData } from './pageData'
import { pageDescription, pageTitle } from './pageMeta'

export const markdownContext = ({ settings, data }: PageData): MarkdownContext => ({
  lists: { events: data.events, faq: data.faq },
  contactEmail: settings.contactEmail,
  jobsEmail: settings.jobsEmail,
  explorerUrl: settings.explorerUrl ?? '',
})

const yamlString = (s: string) => JSON.stringify(s)

/** The page as Markdown with a small front matter (title, canonical URL, description). */
export function pageToMarkdown(pd: PageData): string {
  const path = pd.page.path ?? '/'
  const front = [
    '---',
    `title: ${yamlString(pageTitle(pd.page, pd.settings))}`,
    `url: ${absoluteUrl(path)}`,
    `description: ${yamlString(pageDescription(pd.page, pd.settings))}`,
    '---',
  ].join('\n')
  return `${front}\n\n${blocksToMarkdown(pd.blocks, pd.data, markdownContext(pd))}\n`
}

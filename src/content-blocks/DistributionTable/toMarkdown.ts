import type { DistributionTableBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import { type MarkdownContext, richToMarkdown } from '../markdown'

const cell = (text: string) => text.replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|')

export function distributionTableToMarkdown(block: DistributionTableBlock, ctx: MarkdownContext) {
  const h = block.headings
  const explorer = ctx.explorerUrl.replace(/\/+$/, '')
  const rows = (block.rows ?? []).map((r) => {
    const addresses = r.addresses
      .split(/\s+/)
      .filter(Boolean)
      .map((a) => `[${a}](${explorer}/address/${a})`)
      .join(', ')
    return `| ${cell(richToMarkdown(r.method, ctx))} | ${r.years} | ${r.amount} | ${addresses} |`
  })
  return joinParts([
    richToMarkdown(block.intro, ctx),
    [
      `| ${h?.method} | ${h?.years} | ${h?.amount} | ${h?.history} |`,
      '| --- | --- | --- | --- |',
      ...rows,
    ].join('\n'),
  ])
}

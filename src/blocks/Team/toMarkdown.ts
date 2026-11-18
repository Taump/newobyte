import { linkMarkdown, type MarkdownContext, richToMarkdown } from '@/content-blocks/markdown'
import type { TeamBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import type { BlockData } from '../RenderBlocks'

const LINK_LABELS = { github: 'GitHub', linkedin: 'LinkedIn', link: 'Website' }

export const teamToMarkdown = (block: TeamBlock, data: BlockData, ctx: MarkdownContext) =>
  joinParts([
    `## ${block.title}`,
    richToMarkdown(block.body, ctx),
    data.teamMembers
      .map((m) => {
        const links = (m.links ?? []).map((l) => linkMarkdown(LINK_LABELS[l.icon], l.url))
        return `- **${m.name}**, ${m.role}${links.length ? ` (${links.join(', ')})` : ''}`
      })
      .join('\n'),
  ])

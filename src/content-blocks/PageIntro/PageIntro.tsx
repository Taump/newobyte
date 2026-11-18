import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { Fragment, type ReactNode } from 'react'

import type { PageIntroBlock } from '@/payload-types'

import { InlineRichText, RichText } from '../RichText'

type Rich = SerializedEditorState | null | undefined

/** Intro text parts, by style: the old wrapper of each kind. */
const INTRO_TEXT: Record<string, (text: Rich) => ReactNode> = {
  subParagraph: (t) => (
    <p className="sub-paragraph">
      <InlineRichText data={t} />
    </p>
  ),
  block: (t) => (
    <div className="sub-text-block">
      <RichText data={t} />
    </div>
  ),
  blockInline: (t) => (
    <div className="sub-text-block">
      <InlineRichText data={t} />
    </div>
  ),
  paragraph: (t) => (
    <p className="sub-text-block">
      <InlineRichText data={t} />
    </p>
  ),
  plain: (t) => (
    <div className="sub-text">
      <InlineRichText data={t} />
    </div>
  ),
  small: (t) => (
    <p className="sub-text small">
      <InlineRichText data={t} />
    </p>
  ),
}

/**
 * Lead under the page title: `.sub-block` / `.sub-title` with inline text, or (privacy) a
 * `.sub-block` holding a `.sub-text` first paragraph followed by regular paragraphs.
 */
function IntroLead({ lead, style }: { lead: Rich; style: PageIntroBlock['leadStyle'] }) {
  if (style === 'subBlockText' && lead) {
    const [first, ...rest] = lead.root.children
    const part = (children: typeof rest) => ({ ...lead, root: { ...lead.root, children } }) as Rich
    return (
      <div className="sub-block">
        <div className="sub-text">
          <InlineRichText data={part([first])} />
        </div>
        <RichText data={part(rest)} />
      </div>
    )
  }
  return (
    <div className={style === 'subTitle' ? 'sub-title' : 'sub-block'}>
      <InlineRichText data={lead} />
    </div>
  )
}

/** Page title + lead + intro text (old `# Title` + `.sub-block` + `.sub-text-block` …). */
export function PageIntro({ block }: { block: PageIntroBlock }) {
  return (
    <>
      <h1>{block.title}</h1>
      {block.lead && <IntroLead lead={block.lead} style={block.leadStyle} />}
      {block.texts?.map((t) => (
        <Fragment key={t.id}>{(INTRO_TEXT[t.style] ?? INTRO_TEXT.block)(t.text)}</Fragment>
      ))}
    </>
  )
}

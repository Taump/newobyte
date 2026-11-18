import { describe, expect, it } from 'vitest'

import { lexicalToMarkdown, type LexicalNode } from '@/shared/lib/lexicalMarkdown'

const text = (t: string, format = 0): LexicalNode => ({ type: 'text', text: t, format })
const p = (...children: LexicalNode[]): LexicalNode => ({ type: 'paragraph', children })
const doc = (...children: LexicalNode[]) => ({ root: { type: 'root', children } })

describe('lexicalToMarkdown', () => {
  it('formats text, keeping edge spaces outside the markers', () => {
    expect(
      lexicalToMarkdown(doc(p(text('a '), text('bold ', 1), text('it', 2), text('x', 16)))),
    ).toBe('a **bold** *it*`x`')
  })

  it('renders headings, links, line breaks and paragraphs', () => {
    const md = lexicalToMarkdown(
      doc(
        { type: 'heading', tag: 'h2', children: [text('Title')] },
        p(
          text('see '),
          { type: 'link', fields: { url: '/faq' }, children: [text('FAQ')] },
          { type: 'linebreak' },
          text('next'),
        ),
      ),
      { link: (u) => `https://obyte.org${u}` },
    )
    expect(md).toBe('## Title\n\nsee [FAQ](https://obyte.org/faq)  \nnext')
  })

  it('renders nested and numbered lists', () => {
    const item = (...children: LexicalNode[]): LexicalNode => ({ type: 'listitem', children })
    const md = lexicalToMarkdown(
      doc({
        type: 'list',
        listType: 'number',
        children: [
          item(text('one')),
          item({ type: 'list', listType: 'bullet', children: [item(text('sub'))] }),
          item(text('two')),
        ],
      }),
    )
    expect(md).toBe('1. one\n  - sub\n2. two')
  })

  it('delegates blocks and inline blocks, plain mode drops markup', () => {
    const data = doc(
      p(text('mail '), { type: 'inlineBlock', fields: { blockType: 'emailLink' } }),
      { type: 'block', fields: { blockType: 'spacer' } },
      p({ type: 'link', fields: { url: '/x' }, children: [text('bold', 1)] }),
    )
    const opts = {
      inlineBlock: () => 'o@obyte.org',
      block: (f: Record<string, unknown>) => `[${f.blockType}]`,
    }
    expect(lexicalToMarkdown(data, opts)).toBe('mail o@obyte.org\n\n[spacer]\n\n[**bold**](/x)')
    expect(lexicalToMarkdown(data, { ...opts, plain: true })).toBe(
      'mail o@obyte.org\n\n[spacer]\n\nbold',
    )
  })
})

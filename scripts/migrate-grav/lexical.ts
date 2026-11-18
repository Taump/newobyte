/** Builders for Lexical editor-state JSON (the format Payload stores for richText fields). */
import { randomBytes } from 'node:crypto'

import {
  convertHTMLToLexical,
  editorConfigFactory,
  type SanitizedServerEditorConfig,
} from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import type { SanitizedConfig } from 'payload'

import { articleEditor } from '../../src/content-blocks/articleEditor'
import { contentEditor } from '../../src/content-blocks/contentEditor'
import { inlineEditor } from '../../src/shared/cms/fields'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LexicalNode = Record<string, any>
export type EditorState = { root: LexicalNode }

export type Editors = Record<'article' | 'content' | 'inline', SanitizedServerEditorConfig>

export async function loadEditors(config: SanitizedConfig): Promise<Editors> {
  const [article, content, inline] = await Promise.all(
    [articleEditor, contentEditor, inlineEditor].map((editor) =>
      editorConfigFactory.fromEditor({ config, editor }),
    ),
  )
  return { article, content, inline }
}

/** Payload uses 24-char hex ids (ObjectID-like) for blocks/array rows inside rich text. */
export const nodeId = () => randomBytes(12).toString('hex')

export const root = (children: LexicalNode[]): EditorState => ({
  root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 },
})

export const blockNode = (blockType: string, fields: Record<string, unknown>): LexicalNode => ({
  type: 'block',
  version: 2,
  format: '',
  fields: { id: nodeId(), blockName: '', blockType, ...fields },
})

/** The site's e-mail addresses (Site settings) → the EmailLink inline block's `address`. */
export const SITE_EMAILS: Record<string, 'contact' | 'jobs'> = {
  'o@obyte.org': 'contact',
  'jobs@obyte.org': 'jobs',
}

/** `<a href="mailto:o@obyte.org">o@obyte.org</a>` → EmailLink inline block (address from settings). */
function emailLinksToInlineBlocks(nodes: LexicalNode[]): LexicalNode[] {
  return nodes.map((n) => {
    const fields = n.fields as { url?: string } | undefined
    const email = n.type === 'link' && fields?.url?.replace(/^mailto:/, '')
    const kids = (n.children as LexicalNode[] | undefined) ?? []
    const label = kids.map((c) => c.text ?? '').join('')
    if (email && fields?.url?.startsWith('mailto:') && SITE_EMAILS[email] && label === email) {
      return {
        type: 'inlineBlock',
        version: 1,
        fields: {
          id: nodeId(),
          blockName: '',
          blockType: 'emailLink',
          address: SITE_EMAILS[email],
        },
      }
    }
    return kids.length ? { ...n, children: emailLinksToInlineBlocks(kids) } : n
  })
}

/** Image node; `style` = an old class of the <img> that pages style (info-img, img1 …). */
export const uploadNode = (mediaId: number, style?: string | null): LexicalNode => ({
  type: 'upload',
  version: 3,
  format: '',
  id: nodeId(),
  relationTo: 'media',
  value: mediaId,
  fields: style ? { style } : {},
})

/**
 * Lexical's HTML import drops the last <br> of a block (in its model a trailing break is
 * invisible), but browsers render `text<br><br></p>` with an empty line — the old pages used
 * that for spacing. One extra <br> keeps the rendered line count.
 */
const keepTrailingBreaks = (html: string) =>
  html.replace(/(<br\s*\/?>)(\s*<\/(?:p|li|h[1-6]|blockquote)>)/gi, '$1<br>$2')

export function htmlToNodes(html: string, editor: SanitizedServerEditorConfig): LexicalNode[] {
  if (!html.trim()) return []
  const state = convertHTMLToLexical({
    editorConfig: editor,
    html: keepTrailingBreaks(html),
    JSDOM,
  })
  // drop empty paragraphs produced by whitespace between elements
  return emailLinksToInlineBlocks(state.root.children as LexicalNode[]).filter(
    (n) => !(n.type === 'paragraph' && (!n.children || n.children.length === 0)),
  )
}

export const htmlToState = (
  html: string,
  editor: SanitizedServerEditorConfig,
): EditorState | null => {
  const nodes = htmlToNodes(html, editor)
  return nodes.length ? root(nodes) : null
}

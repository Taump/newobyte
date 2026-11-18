import type { Block } from 'payload'

import { contentEditorField, contentEditorWith } from '../contentEditor'

/**
 * Old wrappers / paragraph classes that pages style specially. The value is the old markup:
 * `list-block d-flex` = a <div> with those classes; `p.bullet` = the text as <p class="bullet">.
 */
export const BOX_STYLES = [
  { label: 'List box (autonomous agents)', value: 'list-block d-flex' },
  { label: 'Indented list (privacy)', value: 'flex-list' },
  { label: 'Text column', value: 'text-block' },
  { label: 'Small text', value: 'content-small' },
  { label: 'Row: text and image side by side', value: 'd-flex' },
  { label: 'Distribution / IoT page header', value: 'container grid-xl > top-block' },
  { label: 'Proofs-of-concept page header', value: 'top-block > container grid-xl' },
  { label: 'Photo pair (IoT)', value: 'event-block' },
  { label: 'Paragraph: bullet (developers)', value: 'p.bullet' },
  { label: 'Paragraph: bullet continuation (developers)', value: 'p.bullet-padding' },
  { label: 'Paragraph: medium width', value: 'p.med-width' },
  { label: 'Paragraph: max width', value: 'p.max-width' },
  { label: 'Paragraph: 550px wide', value: 'p.w-550' },
  { label: 'Paragraph: 670px wide', value: 'p.w-670' },
  { label: 'Paragraph: 745px wide', value: 'p.w-745' },
  { label: 'Paragraph: centered', value: 'p.text-center' },
  { label: 'Section heading (centered)', value: 'h2.section-heading text-center' },
  { label: 'Small print', value: 'small' },
] as const

/** Text with an old page-specific style: a wrapper <div>, a styled paragraph or heading. */
export const makeBoxBlock = (slug: string, interfaceName: string, blocks: Block[]): Block => ({
  slug,
  interfaceName,
  labels: { singular: 'Styled box', plural: 'Styled boxes' },
  fields: [
    {
      name: 'style',
      type: 'select',
      required: true,
      options: BOX_STYLES.map((s) => ({ ...s })),
    },
    contentEditorField('content', true, contentEditorWith(blocks)),
  ],
})

/**
 * The same box inside other blocks (flex blocks, columns, list items) — without nested blocks,
 * so those blocks can include it without an import cycle.
 */
export const InnerBoxBlock = makeBoxBlock('innerBox', 'InnerBoxBlock', [])

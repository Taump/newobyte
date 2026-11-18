import type { Block } from 'payload'

import { shortTextEditor } from '../contentEditor'

/**
 * Page heading + lead + intro text (old `# Title` + `.sub-block` / `.sub-title` + one or more
 * `.sub-text-block` / `.sub-text` parts). Each style matches one of the old wrappers.
 */
export const PageIntroBlock: Block = {
  slug: 'pageIntro',
  interfaceName: 'PageIntroBlock',
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'Rendered as <h1>' } },
    {
      type: 'row',
      fields: [
        { name: 'lead', type: 'richText', editor: shortTextEditor, admin: { width: '70%' } },
        {
          name: 'leadStyle',
          type: 'select',
          defaultValue: 'subBlock',
          required: true,
          options: [
            { label: 'Lead (large)', value: 'subBlock' },
            { label: 'Subtitle', value: 'subTitle' },
            { label: 'Lead in small text + paragraphs', value: 'subBlockText' },
          ],
          admin: { width: '30%' },
        },
      ],
    },
    {
      name: 'texts',
      label: 'Intro text',
      type: 'array',
      labels: { singular: 'Text part', plural: 'Text parts' },
      fields: [
        {
          name: 'style',
          type: 'select',
          defaultValue: 'block',
          required: true,
          options: [
            { label: 'Paragraphs', value: 'block' },
            { label: 'One block of text (no paragraph spacing)', value: 'blockInline' },
            { label: 'Single paragraph', value: 'paragraph' },
            { label: 'Plain text', value: 'plain' },
            { label: 'Small text', value: 'small' },
            { label: 'Lead paragraph', value: 'subParagraph' },
          ],
        },
        { name: 'text', type: 'richText', editor: shortTextEditor, required: true },
      ],
    },
  ],
}

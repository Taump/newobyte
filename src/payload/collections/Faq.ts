import { contentEditorField } from '@/content-blocks/contentEditor'

import { orderableList } from './orderable'

/** /faq questions (also the source of the page's FAQPage structured data). */
export const Faq = orderableList({
  slug: 'faq',
  singular: 'FAQ item',
  plural: 'FAQ',
  titleField: 'question',
  columns: ['question'],
  fields: [{ name: 'question', type: 'text', required: true }, contentEditorField('answer', true)],
})

import type { Block } from 'payload'

import { articleEditor } from '@/content-blocks/articleEditor'
import { anchorField } from '@/shared/cms/fields'
import { ARTICLE_VARIANTS } from '@/shared/cms/variants'

/** Main content of inner pages (old modular/article.html.twig). */
export const ArticleBlock: Block = {
  slug: 'article',
  interfaceName: 'ArticleBlock',
  fields: [
    anchorField,
    {
      name: 'variant',
      type: 'select',
      required: true,
      options: ARTICLE_VARIANTS.map((v) => ({ label: v, value: v })),
      admin: { description: 'Page styling (header background etc.)' },
    },
    { name: 'body', type: 'richText', editor: articleEditor },
  ],
}

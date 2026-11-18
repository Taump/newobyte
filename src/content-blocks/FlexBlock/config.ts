import type { Block } from 'payload'

import { imageField } from '@/shared/cms/fields'

import { contentEditorField, contentEditorWith, IMAGE_STYLES } from '../contentEditor'
import { InnerBoxBlock } from '../Box/factory'
import { DevCalloutBlock } from '../DevCallout/config'
import { PageIntroBlock } from '../PageIntro/config'

/** Image + text row (old `.flex-block`). */
export const FlexBlockBlock: Block = {
  slug: 'flexBlock',
  interfaceName: 'FlexBlockBlock',
  fields: [
    {
      type: 'row',
      fields: [
        { ...imageField('image', false), admin: { width: '50%' } },
        { ...imageField('mobileImage', false, 'Mobile image (optional)'), admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'imagePosition',
          type: 'select',
          defaultValue: 'left',
          options: ['left', 'right'],
          admin: { width: '25%' },
        },
        {
          name: 'kind',
          type: 'select',
          defaultValue: 'flex-block',
          required: true,
          // old class names: each page styles its own kind
          options: [
            { label: 'Image + text', value: 'flex-block' },
            { label: 'Image + text (textcoins)', value: 'flex-text' },
            { label: 'Small image + text', value: 'd-flex' },
            { label: 'Phone image + sections (prosaic contracts)', value: 'content-wrap' },
            { label: 'Icon + note (grants spreadsheet)', value: 'google-block d-inline-flex' },
          ],
          admin: { width: '25%' },
        },
        {
          name: 'modifiers',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Old layout modifiers, e.g. "one", "center second", "blue".',
          },
        },
        {
          name: 'imageStyle',
          type: 'select',
          options: [...IMAGE_STYLES],
          admin: { width: '50%', description: 'Page-specific style of the image itself' },
        },
        {
          name: 'imageModifiers',
          type: 'text',
          admin: { width: '50%', description: 'Image box modifiers (old .img-block classes)' },
        },
      ],
    },
    // a developer callout sits inside a flex block on /platform/chatbots, a page title + lead
    // inside the first one on /applications
    contentEditorField(
      'content',
      false,
      contentEditorWith([DevCalloutBlock, PageIntroBlock, InnerBoxBlock]),
    ),
    {
      name: 'plainText',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Text without paragraph spacing' },
    },
  ],
}

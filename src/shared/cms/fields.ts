import {
  BoldFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { Field, GroupField, RichTextField, RowField, TextField, UploadField } from 'payload'

import { isSafeUrl } from '@/shared/lib/safeUrl'

type Validate = (value: string | null | undefined) => true | string

/** URL allow-list check; `required` must be enforced here because a custom validate replaces Payload's. */
const safeUrlValidator =
  (required: boolean): Validate =>
  (value) => {
    if (!value) return required ? 'This field is required.' : true
    return (
      isSafeUrl(value) || 'Only relative links, http(s), mailto, obyte: and obyte-tn: are allowed.'
    )
  }

/** Absolute https:// URL (release files, store links, site-wide addresses). */
export const httpsUrlValidator =
  (required: boolean): Validate =>
  (value) => {
    if (!value) return required ? 'This field is required.' : true
    return /^https:\/\/\S+$/.test(value) || 'Must be an https:// URL'
  }

/**
 * Lexical link feature with the URL allow-list applied to its URL field. Payload's own
 * beforeChange hook is dropped: it percent-encodes every value it doesn't consider a URL — on
 * each save again — which broke `{explorer}/…`-style site links (`%257Bexplorer%257D…`).
 */
export const safeLinkFeature = () =>
  LinkFeature({
    fields: ({ defaultFields }) =>
      defaultFields.map((field) =>
        'name' in field && field.name === 'url'
          ? ({ ...field, validate: safeUrlValidator(false), hooks: {} } as TextField)
          : field,
      ),
  })

/**
 * Short formatted text (titles with a line break or a bold word, quote bodies): paragraphs,
 * bold, italic, links; Shift+Enter inserts a line break. One shared editor instance — each
 * lexicalEditor() call is sanitized separately and adds to the admin bundle.
 */
export const inlineEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    safeLinkFeature(),
    InlineToolbarFeature(),
  ],
})

export const inlineRichText = (
  field: Omit<RichTextField, 'type' | 'editor'> & { name: string },
): RichTextField => ({ ...field, type: 'richText', editor: inlineEditor })

/** `id` of an empty anchor <div> rendered before the block (old Grav: `#download`, `#team` …). */
export const anchorField: TextField = {
  name: 'anchorId',
  type: 'text',
  admin: {
    description: 'Optional anchor, e.g. "download" makes /#download scroll to this block.',
  },
  validate: ((value) =>
    !value ||
    /^[a-z0-9-]+$/.test(value) ||
    'Use lowercase letters, digits and dashes.') as Validate,
}

export const linkField = (name = 'link', required = true): TextField => ({
  name,
  type: 'text',
  required,
  validate: safeUrlValidator(required),
})

/** label + link (+ "open in new tab") on one row — menus, footer columns, card link lists. */
export const labeledLinkRow = ({ newTab = false, linkRequired = true } = {}): RowField => ({
  type: 'row',
  fields: [
    { name: 'label', type: 'text', required: true },
    linkField('link', linkRequired),
    ...(newTab ? [{ name: 'newTab', type: 'checkbox', defaultValue: false } as Field] : []),
  ],
})

export const imageField = (name: string, required = true, label?: string): UploadField => ({
  name,
  label,
  type: 'upload',
  relationTo: 'media',
  required,
})

/** YouTube / Vimeo video by ID (rendered as a click-to-load facade). */
export const videoFields = ({ required = false } = {}): RowField => ({
  type: 'row',
  fields: [
    { name: 'provider', type: 'select', required, options: ['youtube', 'vimeo'] },
    {
      name: 'videoId',
      type: 'text',
      required,
      validate: ((value) =>
        !value ||
        /^[A-Za-z0-9_-]{6,20}$/.test(value) ||
        'Video ID only, not the full URL') as Validate,
    },
  ],
})

/** Quote component (old partials/quote.html.twig). */
export const quoteField = (name: string, label?: string): GroupField => ({
  name,
  label,
  type: 'group',
  fields: [
    inlineRichText({ name: 'text', required: true }),
    {
      type: 'row',
      fields: [
        { name: 'author', type: 'text', required: true },
        { name: 'source', type: 'text', admin: { description: 'Book / manifesto title' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { ...imageField('avatar', false, 'Large avatar'), admin: { width: '50%' } },
        {
          ...imageField('smallAvatar', false, 'Small avatar (next to author)'),
          admin: { width: '50%' },
        },
      ],
    },
  ],
})

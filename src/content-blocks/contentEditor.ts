import {
  BlocksFeature,
  BoldFeature,
  HeadingFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { Block, RichTextField } from 'payload'

import { safeLinkFeature } from '@/shared/cms/fields'

import { EmailLinkBlock } from './EmailLink/config'
import { SpacerBlock } from './Spacer/config'

/** Old <img> classes some pages style specially (value = the class). */
export const IMAGE_STYLES = [
  { label: 'Info image', value: 'info-img' },
  { label: 'Content image', value: 'content-img' },
  { label: 'Image 1', value: 'img1' },
  { label: 'Image 2', value: 'img2' },
  { label: 'Mobile only', value: 'mobile' },
]

/**
 * Images in text: an optional style = an old class some pages style specially
 * (e.g. `.identity-wrap .info-img`, `.iot-wrap .img1`).
 */
export const uploadFeature = () =>
  UploadFeature({
    collections: {
      media: {
        fields: [
          {
            name: 'style',
            type: 'select',
            options: [...IMAGE_STYLES],
            admin: { description: 'Page-specific image style (leave empty for a plain image)' },
          },
        ],
      },
    },
  })

export const basicFeatures = () => [
  ParagraphFeature(),
  BoldFeature(),
  ItalicFeature(),
  UnderlineFeature(),
  InlineCodeFeature(),
  safeLinkFeature(),
  UnorderedListFeature(),
  OrderedListFeature(),
  InlineToolbarFeature(),
]

/**
 * Rich text used inside content blocks (card bodies, callouts…): text, h1–h5, lists, images,
 * spacers — plus the given content blocks where the old pages nested them (a callout inside a
 * flex block, flex blocks inside a styled box). Editors are built per level, so block configs
 * never import each other in a cycle.
 */
export const contentEditorWith = (blocks: Block[] = []) =>
  lexicalEditor({
    features: () => [
      ...basicFeatures(),
      // h1 occurs inside blocks on a few pages (e.g. /applications intro inside a flex block)
      // h5 = small block title (old `<div class="title">`), rendered as such by RichText
      HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5'] }),
      uploadFeature(),
      BlocksFeature({ blocks: [SpacerBlock, ...blocks], inlineBlocks: [EmailLinkBlock] }),
    ],
  })

export const contentEditor = contentEditorWith()

/** Short texts (page lead, intro parts): basic formatting + e-mail links, no headings/blocks. */
export const shortTextEditor = lexicalEditor({
  features: () => [...basicFeatures(), BlocksFeature({ inlineBlocks: [EmailLinkBlock] })],
})

export const contentEditorField = (
  name: string,
  required = false,
  editor = contentEditor,
): RichTextField => ({ name, type: 'richText', required, editor })

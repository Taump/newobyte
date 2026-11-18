import {
  RichText as LexicalRichText,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { ReactNode } from 'react'

import type { Media } from '@/payload-types'
import { siteContext } from '@/shared/lib/siteContext'
import { MediaImage } from '@/shared/ui/MediaImage'
import { SafeLink } from '@/shared/ui/SafeLink'

import { blockConverters } from './converters'
import type { ContentLists } from './types'

type LinkFields = { url?: string | null; newTab?: boolean | null }

/** Links and autolinks: unsafe or empty URLs keep the text and drop the link. */
const linkConverter = ({
  node,
  nodesToJSX,
}: {
  node: { fields: LinkFields; children: unknown[] }
  nodesToJSX: (a: { nodes: never[] }) => ReactNode[]
}) => (
  <SafeLink href={node.fields.url} newTab={node.fields.newTab}>
    {nodesToJSX({ nodes: node.children as never[] })}
  </SafeLink>
)

const makeConverters =
  (lists: ContentLists): JSXConvertersFunction =>
  ({ defaultConverters }) => ({
    ...defaultConverters,
    link: linkConverter as never,
    autolink: linkConverter as never,
    upload: ({ node }) => {
      const { value: media, fields } = node as {
        value?: Media | number
        fields?: { style?: string | null }
      }
      // no utility classes: the page's legacy CSS sizes content images (base: max-width 100%);
      // `style` is an old class some pages style (info-img, img1 …)
      return typeof media === 'object' ? (
        <MediaImage media={media} className={fields?.style ?? undefined} natural />
      ) : null
    },
    blocks: blockConverters(lists),
    inlineBlocks: {
      // address from Site settings (filled per request by the page route)
      emailLink: ({ node }: { node: unknown }) => {
        const { contactEmail, jobsEmail } = siteContext()
        const email =
          (node as { fields: { address?: string } }).fields.address === 'jobs'
            ? jobsEmail
            : contactEmail
        return email ? <a href={`mailto:${email}`}>{email}</a> : null
      },
    },
    // h5 = the old small block title `<div class="title">` (see contentEditor)
    heading: (args) =>
      args.node.tag === 'h5' ? (
        <div className="title">{args.nodesToJSX({ nodes: args.node.children })}</div>
      ) : (
        (defaultConverters.heading as (a: typeof args) => ReactNode)(args)
      ),
  })

const converters = makeConverters({})

export function RichText({
  data,
  className,
  lists,
}: {
  data: SerializedEditorState | null | undefined
  className?: string
  /** collection data for blocks like the events feed (top-level page content only) */
  lists?: ContentLists
}) {
  if (!data) return null
  return (
    <LexicalRichText
      data={data}
      converters={lists ? makeConverters(lists) : converters}
      disableContainer
      disableIndent
      disableTextAlign
      className={className}
    />
  )
}

const inlineConverters: JSXConvertersFunction = (args) => ({
  ...converters(args),
  // inline fields (titles, quotes inside headings): no <p> wrapper, line breaks stay <br>
  paragraph: ({ node, nodesToJSX }) => <>{nodesToJSX({ nodes: node.children })}</>,
})

/** Rich text from an inline field (`inlineRichText`) rendered inside a heading or span. */
export function InlineRichText({ data }: { data: SerializedEditorState | null | undefined }) {
  if (!data) return null
  return (
    <LexicalRichText
      data={data}
      converters={inlineConverters}
      disableContainer
      disableIndent
      disableTextAlign
    />
  )
}

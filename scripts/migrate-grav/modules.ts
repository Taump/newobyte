/**
 * Grav modules (`_folder/<template>.md`) → Payload layout blocks.
 * Text the old Twig templates hard-coded (quotes, the exchanges sentence) becomes field data.
 */
import { ARTICLE_VARIANTS, TEXT_WIDE_VARIANTS } from '../../src/shared/cms/variants'

import { convertArticle, unobfuscateEmails, type Ctx } from './content'
import type { GravModule } from './grav'
import { htmlToState, nodeId } from './lexical'
import { gravMarkdownToHtml } from './markdown'

type Block = Record<string, unknown> & { blockType: string }

const inline = (html: string | undefined | null, ctx: Ctx) => {
  if (!html?.trim()) return null
  const wrapped = /^\s*<p[\s>]/i.test(html) ? html : `<p>${html}</p>`
  return htmlToState(wrapped, ctx.editors.inline)
}

const markdownBody = async (md: string, ctx: Ctx) =>
  md.trim() ? convertArticle(gravMarkdownToHtml(unobfuscateEmails(md)), ctx) : null

const body = (m: GravModule, ctx: Ctx) => markdownBody(m.body, ctx)

/** Home sections start their markdown with `# Title`: it becomes the block's title field. */
const titledBody = async (m: GravModule, ctx: Ctx) => {
  const match = /^\s*#\s+(.+)\n?/.exec(m.body)
  if (!match) throw new Error(`${ctx.page}: module ${m.template} has no "# Title" line`)
  return { title: match[1].trim(), body: await markdownBody(m.body.slice(match[0].length), ctx) }
}

async function quote(
  q: { text?: string; author?: string; source?: string; avatar?: string; smallAvatar?: string },
  ctx: Ctx,
) {
  return {
    text: inline(q.text, ctx),
    author: q.author ?? '',
    source: q.source ?? null,
    avatar: await ctx.media.id(q.avatar, { page: ctx.page, alt: q.author }),
    smallAvatar: await ctx.media.id(q.smallAvatar, { page: ctx.page, alt: q.author }),
  }
}

type GravQuote = { text?: string; author?: string; text_source?: string; small_avatar?: string }
/** Quote as stored in Grav frontmatter (technology, big_changes). */
const gravQuote = (q: GravQuote | undefined, ctx: Ctx) =>
  quote(
    { text: q?.text, author: q?.author, source: q?.text_source, smallAvatar: q?.small_avatar },
    ctx,
  )

const BARLOW = {
  author: 'John Perry Barlow',
  source: 'A Declaration of the Independence of Cyberspace',
}

type Mapper = (m: GravModule, ctx: Ctx) => Promise<Block>

const MAPPERS: Record<string, Mapper> = {
  article: async (m, ctx) => {
    const variant = String(m.header.class ?? '')
    if (!(ARTICLE_VARIANTS as readonly string[]).includes(variant)) {
      throw new Error(`${ctx.page}: unknown article class "${variant}"`)
    }
    return { blockType: 'article', variant, body: await body(m, ctx) }
  },

  'text-wide': async (m, ctx) => {
    const variant = String(m.header.class ?? '').replace(/^section\s+/, '')
    if (!(TEXT_WIDE_VARIANTS as readonly string[]).includes(variant)) {
      throw new Error(`${ctx.page}: unknown text-wide class "${variant}"`)
    }
    return { blockType: 'textWide', variant, body: await body(m, ctx) }
  },

  hero: async ({ header: h }, ctx) => ({
    blockType: 'hero',
    title: inline(h.title, ctx),
    subtitle: h.subTitle ?? null,
    description: h.description ?? null,
    mainQuote: await quote(
      { ...BARLOW, text: h.mainQuote?.text, avatar: h.mainQuote?.avatar },
      ctx,
    ),
    information: (h.information ?? []).map((i: { title: string; text: string }) => ({
      id: nodeId(),
      title: i.title,
      text: i.text,
    })),
    sideQuote: await quote(
      {
        text: '”Whenever something is wrong, something is too big“',
        author: 'Leopold Kohr',
        source: 'The Breakdown of Nations',
        smallAvatar: '/user/themes/obyte/assets/kohr-small.png',
      },
      ctx,
    ),
    comparisons: await Promise.all(
      (h.comparisons ?? []).map(
        async (c: {
          image_url: string
          title: string
          description?: string
          active?: boolean
        }) => ({
          id: nodeId(),
          image: await ctx.media.id(c.image_url, { page: ctx.page, alt: c.title }),
          title: c.title,
          description: c.description ?? null,
          active: Boolean(c.active),
        }),
      ),
    ),
  }),

  technology: async (m, ctx) => {
    const h = m.header
    return {
      blockType: 'technology',
      title: inline(h.title, ctx),
      quote: await gravQuote(h.quote, ctx),
      body: await body(m, ctx),
      fallbackImage: await ctx.media.id(h.animationImage, {
        page: ctx.page,
        alt: 'Evolution of ledgers',
      }),
      scenes: (h.animation ?? []).map((s: { class: string; title: string; text: string }) => ({
        id: nodeId(),
        scene: s.class,
        title: s.title,
        // stored as plain text; the only entity used is &mdash;
        text: s.text.replace(/&mdash;/g, '—'),
      })),
    }
  },

  independent: async ({ header: h }, ctx) => ({
    blockType: 'independent',
    title: String(h.title).replace(/\s+/g, ' ').trim(),
    description: h.description ?? null,
    quote: await quote(
      {
        ...BARLOW,
        text: '“You [governments] have no moral right to rule us nor do you possess any methods of enforcement we have true reason to fear.”',
        smallAvatar: h.quote_avatar,
      },
      ctx,
    ),
  }),

  big_changes: async ({ header: h }, ctx) => ({
    blockType: 'bigChanges',
    text: h.text,
    quote: await gravQuote(h.quote, ctx),
  }),

  // the points go to the `timeline-events` collection (lists.ts)
  timeline: async (m, ctx) => ({ blockType: 'timeline', ...(await titledBody(m, ctx)) }),

  download: async (m, ctx) => {
    const h = m.header
    return {
      blockType: 'download',
      network: String(h.class ?? '').includes('testnet') ? 'testnet' : 'mainnet',
      // old blockTitle is raw "<h1>…</h1>"; the component renders the <h1>
      title: inline(String(h.blockTitle ?? '').replace(/<\/?h1>/g, ''), ctx),
      bigImage: await ctx.media.id(h.bigImg, { page: ctx.page, alt: 'Obyte wallet' }),
      smallImage: await ctx.media.id(h.smallImg, { page: ctx.page, alt: 'Obyte wallet' }),
      // App Store / Google Play buttons: Releases → Mobile apps (globals.ts)
      downloadLinks: (h.programs2 ?? []).map((p: { title: string; link: string }) => ({
        id: nodeId(),
        label: p.title,
        link: p.link,
      })),
      body: await body(m, ctx),
    }
  },

  // the people go to the `team-members` collection (lists.ts); the block keeps the settings
  team: async (m, ctx) => ({ blockType: 'team', ...(await titledBody(m, ctx)) }),

  // the logos go to the `exchanges` / `coin-trackers` collections (lists.ts)
  exchanges: async (m, ctx) => ({
    blockType: 'exchanges',
    title: m.header.title,
    intro:
      'You can buy or sell GBYTE (the native currency of Obyte) on the following cryptocurrency exchanges:',
    body: await body(m, ctx),
  }),
}

export async function moduleToBlock(m: GravModule, ctx: Ctx): Promise<Block> {
  const map = MAPPERS[m.template]
  if (!map)
    throw new Error(`${ctx.page}: no mapper for module template "${m.template}" (${m.folder})`)
  return { ...(await map(m, ctx)), anchorId: m.anchor || null }
}

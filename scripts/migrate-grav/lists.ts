/**
 * Lists → collections: events (collected from /events), timeline points (`_timeline`), team members (`_team`), exchanges and coin trackers
 * (`_exchanges`); the footer's social links use the same upsert. Upserted by name. New items are created in Grav order (orderable collections
 * append on create); existing ones keep the order an editor may have set in the admin.
 */
import type { Payload } from 'payload'

import type { Config } from '../../src/payload-types'

import type { GravPage } from './grav'
import type { Collected } from './content'
import type { MediaImporter } from './media'
import { monthStart } from './month'
import { tokenizeSiteLinks } from './siteLinks'

const context = { disableRevalidate: true }
export async function upsert<S extends keyof Config['collections']>(
  payload: Payload,
  collection: S,
  data: Omit<Config['collections'][S], 'id' | 'createdAt' | 'updatedAt'>,
  key: 'name' | 'title' | 'question' = 'name',
) {
  const { docs } = await payload.find({
    collection,
    where: { [key]: { equals: (data as Record<string, unknown>)[key] } },
    limit: 1,
    depth: 0,
  })
  if (docs[0]) await payload.update({ collection, id: docs[0].id, data: data as never, context })
  else await payload.create({ collection, data: data as never, context })
}

const moduleHeaders = (pages: GravPage[], template: string) =>
  pages
    .flatMap((p) => p.modules)
    .filter((m) => m.template === template)
    .map((m) => m.header)

const hostname = (link: string) => new URL(link).hostname.replace(/^www\./, '')

export async function importLists(
  payload: Payload,
  pages: GravPage[],
  media: MediaImporter,
  collected: Collected,
) {
  const opts = (alt: string) => ({ page: '/', alt })
  const image = async (src: string, alt: string) => (await media.id(src, opts(alt)))!
  const counts = { team: 0, exchanges: 0, trackers: 0, timeline: 0, events: 0, faq: 0 }

  // collected from the /faq page content (content.ts); upserted in page order
  for (const q of collected.faq) {
    await upsert(payload, 'faq', tokenizeSiteLinks(q) as never, 'question')
    counts.faq++
  }

  // collected from the /events page content while converting it (content.ts)
  for (const e of collected.events) {
    await upsert(payload, 'events', tokenizeSiteLinks(e) as never, 'title')
    counts.events++
  }

  for (const h of moduleHeaders(pages, 'timeline')) {
    for (const p of (h.points ?? []) as { date: string; title: string }[]) {
      await upsert(
        payload,
        'timeline-events',
        { date: monthStart(String(p.date)), title: p.title },
        'title',
      )
      counts.timeline++
    }
  }

  for (const h of moduleHeaders(pages, 'team')) {
    for (const t of (h.team ?? []) as {
      imgLink: string
      name: string
      role: string
      links?: { icon: string; link: string }[]
    }[]) {
      await upsert(payload, 'team-members', {
        name: t.name,
        role: t.role,
        photo: await image(t.imgLink, t.name),
        links: (t.links ?? []).map((l) => ({
          icon: l.icon.replace(/^icon-/, '') as 'github' | 'linkedin',
          url: l.link.trim(),
        })),
      })
      counts.team++
    }
  }

  for (const h of moduleHeaders(pages, 'exchanges')) {
    for (const e of (h.exchanges ?? []) as { img: string; link: string }[]) {
      const name = hostname(e.link)
      await upsert(payload, 'exchanges', { name, link: e.link, logo: await image(e.img, name) })
      counts.exchanges++
    }
    for (const c of (h.lists ?? []) as { img: string; imgHover: string; link: string }[]) {
      const name = hostname(c.link)
      await upsert(payload, 'coin-trackers', {
        name,
        link: c.link,
        logo: await image(c.img, name),
        logoHover: await image(c.imgHover, name),
      })
      counts.trackers++
    }
  }
  return counts
}

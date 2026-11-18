import type { Event, Faq } from '@/payload-types'

/** Collection data some content blocks show (loaded by the page route for top-level content). */
export type ContentLists = { events?: Event[]; faq?: Faq[] }

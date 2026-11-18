/**
 * Reads the Grav flat-file page tree (old-site/docroot/user/pages) into plain objects.
 * Mirrors the Grav rules the old theme relied on:
 * - `NN.slug` folders are ordered and visible in the menu, unprefixed folders are hidden;
 * - a modular page renders its `_module` sub-folders ordered by `content.order.custom`, then by
 *   folder name; modules with `visible: false` are skipped; `hero` modules render first.
 */
import fs from 'node:fs/promises'
import path from 'node:path'

import matter from 'gray-matter'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Frontmatter = Record<string, any>

export type GravModule = {
  folder: string
  template: string
  header: Frontmatter
  body: string
  /** Grav `module.menu|hyphenize` — the anchor id rendered before the module. */
  anchor: string
}

export type GravPage = {
  route: string
  slug: string
  parentRoute: string | null
  /** numeric folder prefix (menu order), null for unprefixed (hidden) folders */
  order: number | null
  visibleInMenu: boolean
  published: boolean
  header: Frontmatter
  modules: GravModule[]
  dir: string
}

const HOME_FOLDER = /^\d+\.home$/

const isDir = async (p: string) => (await fs.stat(p)).isDirectory()

/** Grav's `hyphenize` Twig filter (Inflector::hyphenize). */
export const hyphenize = (text: string) =>
  text
    // tags are not stripped: Grav turned `The future is<br><b>…` into `the-future-is-br-b-…`
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/[^\w]+/g, '-')
    .replace(/_+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

async function readMarkdown(file: string) {
  const raw = await fs.readFile(file, 'utf8')
  const { data, content } = matter(raw)
  return { header: data as Frontmatter, body: content }
}

async function readModules(pageDir: string, pageHeader: Frontmatter): Promise<GravModule[]> {
  const entries = (await fs.readdir(pageDir)).filter((e) => e.startsWith('_'))
  const modules: GravModule[] = []
  for (const folder of entries) {
    const dir = path.join(pageDir, folder)
    if (!(await isDir(dir))) continue
    const md = (await fs.readdir(dir)).find((f) => f.endsWith('.md'))
    if (!md) continue
    const { header, body } = await readMarkdown(path.join(dir, md))
    if (header.visible === false) continue
    modules.push({
      folder,
      template: path.basename(md, '.md'),
      header,
      body,
      // Grav: menu → title → the folder slug (`_big_changes` → `big-changes`)
      anchor: hyphenize(String(header.menu ?? header.title ?? folder.replace(/^_/, ''))),
    })
  }

  const custom: string[] = pageHeader?.content?.order?.custom ?? []
  const rank = (m: GravModule) => {
    const i = custom.indexOf(m.folder)
    return i === -1 ? custom.length : i
  }
  modules.sort((a, b) => rank(a) - rank(b) || a.folder.localeCompare(b.folder))
  // modular.html.twig renders hero modules in the hero block, before everything else
  return [
    ...modules.filter((m) => m.template === 'hero'),
    ...modules.filter((m) => m.template !== 'hero'),
  ]
}

export async function readPages(pagesRoot: string): Promise<GravPage[]> {
  const pages: GravPage[] = []

  async function walk(dir: string, parentRoute: string | null) {
    for (const folder of (await fs.readdir(dir)).sort()) {
      const pageDir = path.join(dir, folder)
      if (folder.startsWith('_') || folder.startsWith('.') || !(await isDir(pageDir))) continue
      const pageFile = (await fs.readdir(pageDir)).find(
        (f) => f === 'modular.md' || f === 'default.md',
      )
      if (!pageFile) continue

      const match = folder.match(/^(\d+)\.(.+)$/)
      const slug = match ? match[2] : folder
      const isHome = parentRoute === null && HOME_FOLDER.test(folder)
      const route = isHome
        ? '/'
        : `${parentRoute && parentRoute !== '/' ? parentRoute : ''}/${slug}`
      const { header } = await readMarkdown(path.join(pageDir, pageFile))

      pages.push({
        route,
        slug: isHome ? 'home' : slug,
        parentRoute: parentRoute && parentRoute !== '/' ? parentRoute : null,
        order: match ? Number(match[1]) : null,
        visibleInMenu: header.visible ?? Boolean(match),
        published: header.published ?? true,
        header,
        modules: await readModules(pageDir, header),
        dir: pageDir,
      })
      await walk(pageDir, route)
    }
  }

  await walk(pagesRoot, null)
  // parents first, so children can reference them
  return pages.sort((a, b) => a.route.split('/').length - b.route.split('/').length)
}

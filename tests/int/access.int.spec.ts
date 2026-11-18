// @vitest-environment node
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

let payload: Payload
let admin: User
let editor: User

const pageData = (slug: string) => ({
  title: `Test ${slug}`,
  slug,
  layout: [{ blockType: 'article' as const, variant: 'faq-wrap' as const }],
})

const svgFile = (svg: string) => {
  const data = Buffer.from(svg)
  return { data, mimetype: 'image/svg+xml', name: 'test.svg', size: data.byteLength }
}

describe('security / access control', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'users', where: { email: { like: '@access.test' } } })
    await payload.delete({ collection: 'pages', where: { slug: { like: 'access-test' } } })
    admin = await payload.create({
      collection: 'users',
      data: { email: 'admin@access.test', password: 'admin-password-123', roles: 'admin' },
    })
    editor = await payload.create({
      collection: 'users',
      data: { email: 'editor@access.test', password: 'editor-password-123', roles: 'editor' },
    })
  })

  afterAll(async () => {
    await payload.delete({ collection: 'users', where: { email: { like: '@access.test' } } })
    await payload.delete({ collection: 'pages', where: { slug: { like: 'access-test' } } })
    await payload.delete({ collection: 'media', where: { filename: { like: 'test' } } })
  })

  it('anonymous visitors cannot create users', async () => {
    await expect(
      payload.create({
        collection: 'users',
        data: { email: 'anon@access.test', password: 'anon-password-123', roles: 'editor' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('editors cannot create users', async () => {
    await expect(
      payload.create({
        collection: 'users',
        data: { email: 'new@access.test', password: 'new-password-1234', roles: 'editor' },
        user: editor,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('editors cannot promote themselves', async () => {
    await expect(
      payload.update({
        collection: 'users',
        id: editor.id,
        data: { roles: 'admin' },
        user: editor,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('editors cannot read other users', async () => {
    const { docs } = await payload.find({
      collection: 'users',
      user: editor,
      overrideAccess: false,
    })
    expect(docs.map((u) => u.id)).toEqual([editor.id])
  })

  it('even admins cannot create, edit or delete accounts (the admin comes from env)', async () => {
    const as = { user: admin, overrideAccess: false } as const
    await expect(
      payload.create({
        collection: 'users',
        data: { email: 'created@access.test', password: 'created-password-1', roles: 'editor' },
        ...as,
      }),
    ).rejects.toThrow()
    await expect(
      payload.update({
        collection: 'users',
        id: admin.id,
        data: { password: 'changed-pass-123' },
        ...as,
      }),
    ).rejects.toThrow()
    await expect(payload.delete({ collection: 'users', id: editor.id, ...as })).rejects.toThrow()
  })

  it('anonymous visitors only see published pages', async () => {
    await payload.create({
      collection: 'pages',
      data: { ...pageData('access-test-draft') },
      draft: true,
    })
    await payload.create({
      collection: 'pages',
      data: { ...pageData('access-test-live'), _status: 'published' },
    })
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { like: 'access-test' } },
      overrideAccess: false,
    })
    expect(docs.map((d) => d.slug)).toEqual(['access-test-live'])
    expect(docs[0].path).toBe('/access-test-live')
  })

  it('editors cannot upload SVG', async () => {
    await expect(
      payload.create({
        collection: 'media',
        data: { alt: 'x' },
        file: svgFile('<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>'),
        user: editor,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/Only admins/)
  })

  it('SVG uploads are sanitized', async () => {
    const doc = await payload.create({
      collection: 'media',
      data: { alt: 'x' },
      file: svgFile(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" onload="alert(1)"><script>alert(2)</script><rect width="1" height="1"/></svg>',
      ),
      user: admin,
      overrideAccess: false,
    })
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const stored = await fs.readFile(path.resolve('media', doc.filename!), 'utf8')
    expect(stored).not.toMatch(/script|onload/i)
    expect(stored).toMatch(/<rect/)
  })

  it('locks the account after 5 failed logins', async () => {
    const email = 'locked@access.test'
    const password = 'locked-password-12'
    await payload.create({ collection: 'users', data: { email, password, roles: 'editor' } })
    for (let i = 0; i < 5; i++) {
      await expect(
        payload.login({ collection: 'users', data: { email, password: 'wrong-password' } }),
      ).rejects.toThrow()
    }
    await expect(payload.login({ collection: 'users', data: { email, password } })).rejects.toThrow(
      /locked/i,
    )
  })
})

import type { CollectionConfig } from 'payload'

import { adminsField } from '@/shared/cms/access'

const nobody = () => false

/**
 * Admin-panel accounts. There is exactly one, defined by ADMIN_EMAIL / ADMIN_PASSWORD and synced
 * on every start (../seed/envAdmin.ts); nobody can register, create, edit or delete accounts —
 * not even the admin (change the env and restart instead). The first-register endpoints are also
 * closed in production by src/proxy.ts.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles', 'updatedAt'],
    description: 'The admin account is set by ADMIN_EMAIL / ADMIN_PASSWORD on the server.',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 2 * 60 * 60,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
  },
  access: {
    create: nobody,
    delete: nobody,
    update: nobody,
    unlock: nobody,
    // only one's own account
    read: ({ req }) => (req.user ? { id: { equals: req.user.id } } : false),
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: {
        create: adminsField,
        update: adminsField,
      },
    },
  ],
}

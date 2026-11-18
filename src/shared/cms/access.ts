import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

import type { User } from '@/payload-types'

export type Role = User['roles']

type UserLike = Pick<User, 'roles'> | null | undefined

export const isAdminUser = (req: PayloadRequest): boolean =>
  (req.user as UserLike)?.roles === ('admin' satisfies Role)

/** Any logged-in user (admin or editor). */
export const authenticated: Access = ({ req }) => Boolean(req.user)

export const admins: Access = ({ req }) => isAdminUser(req)

export const adminsField: FieldAccess = ({ req }) => isAdminUser(req)

/** Public: published documents only. Logged-in users: drafts too. */
export const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } } satisfies Where
}

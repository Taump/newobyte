import type { Payload } from 'payload'

/**
 * The admin panel has exactly one account, defined by the environment (ADMIN_EMAIL /
 * ADMIN_PASSWORD) — nobody can register or create users (see Users access). On every start:
 * - the env account is created, or its password reset to the env value;
 * - every other account is deleted (e.g. users of an imported database).
 *
 * So a database export or backup carries no accounts at all (pnpm db:export and
 * deploy/backup.sh strip them) and access is restored from the env after a restore.
 * Without ADMIN_* (local development) existing accounts are left alone.
 */
export async function syncEnvAdmin(payload: Payload): Promise<void> {
  // `next build` only reads the database
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    if (process.env.NODE_ENV === 'production') {
      payload.logger.warn(
        'ADMIN_EMAIL/ADMIN_PASSWORD are not set — nobody can log in to the admin panel.',
      )
    }
    return
  }
  if (password.length < 12) {
    // the site keeps working; nobody can log in until the env has a proper password
    payload.logger.error(
      'ADMIN_PASSWORD must be at least 12 characters long — admin account not synced.',
    )
    return
  }

  const { totalDocs: removed } = await payload
    .delete({
      collection: 'users',
      where: { email: { not_equals: email } },
      overrideAccess: true,
    })
    .then((r) => ({ totalDocs: r.docs.length }))
  if (removed) payload.logger.info(`Removed ${removed} account(s) not defined by ADMIN_EMAIL`)

  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })
  if (docs[0]) {
    await payload.update({
      collection: 'users',
      id: docs[0].id,
      data: { password, roles: 'admin' },
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'users',
      data: { email, password, roles: 'admin' },
      overrideAccess: true,
    })
    payload.logger.info(`Created the admin account ${email}`)
  }
}

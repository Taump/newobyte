import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto(`${BASE}/admin`)
    await expect(page).toHaveURL(`${BASE}/admin`)
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto(`${BASE}/admin/collections/users`)
    await expect(page).toHaveURL(new RegExp(`^${BASE}/admin/collections/users(\\?|$)`))
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can open a page in the edit view', async () => {
    await page.goto(`${BASE}/admin/collections/pages`)
    await page.locator('table tbody tr a').first().click()
    await expect(page).toHaveURL(/\/admin\/collections\/pages\/\d+/)
    await expect(page.locator('#field-title')).toBeVisible()
  })

  test('nobody can create accounts (the admin comes from env)', async () => {
    await page.goto(`${BASE}/admin/collections/users/create`)
    await expect(page.locator('input[name="email"]')).toHaveCount(0)
  })
})

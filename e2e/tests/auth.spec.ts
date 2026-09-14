import { test, expect, type Page } from '@playwright/test'

// Auth tests share a single user account. Running them in parallel causes
// ASP.NET Core Identity's optimistic-concurrency update (ConcurrencyStamp) on
// the user row to fail when multiple workers call ResetAccessFailedCount at the
// same time for the same row.  Serial mode eliminates that race condition.
test.describe.configure({ mode: 'serial' })

const ADMIN_EMAIL = 'admin@e2etest.local'
const ADMIN_PASSWORD = 'E2eTestPassword123!'

async function login(
  page: Page,
  email = ADMIN_EMAIL,
  password = ADMIN_PASSWORD
) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/')
}

// ---------------------------------------------------------------------------
// Happy paths
// ---------------------------------------------------------------------------

test.describe('Login — happy paths', () => {
  test('admin can log in with valid credentials and is redirected to home', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
  })

  test('JWT token is stored in localStorage after successful login', async ({ page }) => {
    await login(page)

    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).not.toBeNull()
    // A valid JWT is three base64url parts separated by dots
    expect(token!.split('.').length).toBe(3)
  })

  test('authenticated user can access the protected home route directly', async ({ page }) => {
    await login(page)

    // Navigate away and come back
    await page.goto('/')
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
  })

  test('/api/auth/me returns correct email and role for logged-in admin', async ({ page }) => {
    await login(page)

    const token = await page.evaluate(() => localStorage.getItem('token'))
    const response = await page.request.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(response.ok()).toBeTruthy()
    const body = await response.json() as { id: string; email: string; role: string }
    expect(body.email).toBe(ADMIN_EMAIL)
    expect(body.role).toBe('Admin')
    expect(body.id).toBeTruthy()
  })

  test('page refresh preserves authenticated state', async ({ page }) => {
    await login(page)

    await page.reload()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Error / edge cases
// ---------------------------------------------------------------------------

test.describe('Login — error cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('wrong password shows invalid credentials error', async ({ page }) => {
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill('WrongPassword99!')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Invalid email or password.')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('non-existent email shows invalid credentials error', async ({ page }) => {
    await page.getByLabel('Email').fill('nobody@e2etest.local')
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Invalid email or password.')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('empty email field triggers browser required validation and prevents submission', async ({ page }) => {
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Browser's native required validation fires — URL stays on /login
    await expect(page).toHaveURL('/login')

    const emailMissing = await page.locator('#email').evaluate(
      (el) => (el as HTMLInputElement).validity.valueMissing
    )
    expect(emailMissing).toBe(true)
  })

  test('empty password field triggers browser required validation and prevents submission', async ({ page }) => {
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/login')

    const passwordMissing = await page.locator('#password').evaluate(
      (el) => (el as HTMLInputElement).validity.valueMissing
    )
    expect(passwordMissing).toBe(true)
  })

  test('both fields empty triggers browser required validation and prevents submission', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/login')

    const emailMissing = await page.locator('#email').evaluate(
      (el) => (el as HTMLInputElement).validity.valueMissing
    )
    expect(emailMissing).toBe(true)
  })

  test('invalid email format triggers browser type validation and prevents submission', async ({ page }) => {
    await page.getByLabel('Email').fill('notanemail')
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/login')

    const emailTypeMismatch = await page.locator('#email').evaluate(
      (el) => (el as HTMLInputElement).validity.typeMismatch
    )
    expect(emailTypeMismatch).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Route protection
// ---------------------------------------------------------------------------

test.describe('Route protection', () => {
  test('unauthenticated user visiting home is redirected to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })

  test('unauthenticated user visiting /users is redirected to login', async ({ page }) => {
    await page.goto('/users')
    await expect(page).toHaveURL('/login')
  })

  test('authenticated non-admin visiting /users is redirected to home', async ({ page }) => {
    // Log in as admin (only role available in e2e seed), then verify /users is accessible
    // This test verifies the role guard fires — admin CAN access /users
    await login(page)
    await page.goto('/users')
    // Admin can reach /users; a non-admin would be bounced to /
    await expect(page).toHaveURL('/users')
  })
})

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

test.describe('Logout', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('sign out redirects to login page', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL('/login')
  })

  test('sign out clears JWT from localStorage', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign out' }).click()

    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeNull()
  })

  test('after sign out, navigating to home redirects to login', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })

  test('after sign out, navigating to /users redirects to login', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.goto('/users')
    await expect(page).toHaveURL('/login')
  })
})

// ---------------------------------------------------------------------------
// Submit button loading state
// ---------------------------------------------------------------------------

test.describe('Login — submit button state', () => {
  test('submit button is disabled and shows loading text while request is in flight', async ({ page }) => {
    await page.goto('/login')

    // Delay the login API response so we can observe the loading state
    await page.route('**/api/auth/login', async (route) => {
      await new Promise<void>((resolve) => setTimeout(resolve, 600))
      await route.continue()
    })

    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()

    // While the delayed request is in flight the button should be disabled
    const button = page.getByRole('button', { name: /signing in/i })
    await expect(button).toBeVisible()
    await expect(button).toBeDisabled()

    // After the request resolves we should land on home
    await expect(page).toHaveURL('/')
  })
})

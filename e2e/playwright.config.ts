import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }]],

  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      // API on dedicated e2e port
      command: 'dotnet run --project ../src/HelpDeskApp.API --launch-profile e2etest',
      url: 'http://localhost:5113/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        ADMIN_EMAIL: 'admin@e2etest.local',
        ADMIN_PASSWORD: 'E2eTestPassword123!',
      },
    },
    {
      // Frontend Vite dev server on dedicated e2e port, proxying to API e2e port
      command: 'npm run dev -- --port 5174',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      cwd: '../frontend',
      env: {
        VITE_API_PORT: '5113',
      },
    },
  ],
})

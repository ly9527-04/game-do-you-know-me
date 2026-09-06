import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000'
const localBaseURL = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(baseURL)

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: localBaseURL ? {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  } : undefined,
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'iPhone Safari', use: { ...devices['iPhone 13'] } },
    { name: 'Android Chrome', use: { ...devices['Pixel 5'] } },
  ],
})

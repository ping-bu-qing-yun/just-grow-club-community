import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    { name: 'mobile-dark', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, colorScheme: 'dark' } },
    { name: 'mobile-reduced-motion', metadata: { reducedMotion: true }, use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'desktop-dark', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, colorScheme: 'dark' } },
  ],
});


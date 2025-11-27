import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:1337',
    actionTimeout: 10_000,
    trace: 'on-first-retry',
  },
});

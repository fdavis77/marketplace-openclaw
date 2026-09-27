import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end check of the MVP "done" definition. Runs against a server you
 * start yourself, on a LOCAL database seeded with `npm run db:seed-demo`:
 *   npm run build && PORT=3100 npm start
 *   E2E_BASE_URL=http://localhost:3100 npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
  },
  projects: [
    { name: "phone", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "laptop", use: { viewport: { width: 1366, height: 900 } } },
  ],
});

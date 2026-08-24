import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testIgnore: [".gstack/**", ".agents/**", ".claude/**", ".opencode/**", "node_modules/**"],
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    actionTimeout: 10000,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 375, height: 812 } } },
  ],
});

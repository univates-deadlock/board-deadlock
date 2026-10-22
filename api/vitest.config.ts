import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      { test: { name: "unit", include: ["tests/**/*.unit.test.ts"] } },
      {
        test: {
          name: "integration",
          include: ["tests/**/*.integration.test.ts"],
          globalSetup: ["./tests/global-setup.ts"],
          setupFiles: ["./tests/setup.ts"],
          fileParallelism: false,
          testTimeout: 10_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});

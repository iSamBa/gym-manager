import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  test: {
    projects: [
      // Unit tests project
      {
        plugins: [react()],
        resolve: {
          alias: {
            "@": path.resolve(dirname, "./src"),
          },
        },
        test: {
          name: "unit",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./vitest.setup.ts"],
          include: ["src/**/*.{test,spec}.{js,ts,tsx}"],
          exclude: ["src/stories/**"],
          // Increase timeout for Radix UI components that may have animations
          testTimeout: 1000,
          // Configure jsdom environment with better Radix UI support
          environmentOptions: {
            jsdom: {
              // Enable more realistic browser behavior
              pretendToBeVisual: true,
              // Support for CSS-in-JS and viewport queries
              resources: "usable",
              // Better URL support for testing
              url: "http://localhost:3000",
            },
          },
          // Better handling of async operations in tests
          pool: "forks",
          // Isolate tests to prevent state leaks between tests
          isolate: true,
        },
      },
      // Storybook tests project
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: "playwright",
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});

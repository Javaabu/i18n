import { defineConfig } from "vitest/config"

export default defineConfig({
  // The full Vue build compiles the templates in the tests at runtime, as it does for in-DOM templates.
  resolve: { alias: { vue: "vue/dist/vue.esm-bundler.js" } },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/types.ts", "src/global-types.ts", "src/browser.ts"],
      reporter: ["text", "lcov", "json-summary"],
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 85 },
    },
  },
})

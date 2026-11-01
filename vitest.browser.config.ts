import { defineConfig } from "vitest/config"

/** Checks the built `<script>` bundle, so it needs `pnpm build` first. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
})

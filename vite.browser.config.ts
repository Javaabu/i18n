import { resolve } from "node:path"
import { defineConfig } from "vite"

/** The `<script>` tag build: no bundler, installs `__`, `trans` and `trans_choice` on `window`. */
export default defineConfig({
  build: {
    reportCompressedSize: false,
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/browser.ts"),
      name: "I18n",
      formats: ["iife"],
      fileName: () => "i18n.iife.js",
    },
  },
})

import { resolve } from "node:path"
import { defineConfig } from "vite"

/** Library entry points, mirrored by package.json `exports`. */
const entries = {
  index: "src/index.ts",
  react: "src/react.tsx",
  vue: "src/vue.ts",
  jquery: "src/jquery.ts",
  global: "src/global.ts",
}

export default defineConfig({
  build: {
    reportCompressedSize: false,
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    lib: {
      entry: Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, resolve(import.meta.dirname, v)])),
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: (id) => /^(react|vue)(\/|$)/.test(id),
      output: {
        // The React entry uses hooks; mark it for React Server Components.
        banner: (chunk) => (chunk.name === "react" ? '"use client";' : ""),
      },
    },
  },
})

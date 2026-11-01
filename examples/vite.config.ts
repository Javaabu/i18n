import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"

const root = import.meta.dirname
const page = (name: string) => resolve(root, `${name}.html`)

export default defineConfig({
  root,
  base: "./",
  plugins: [react(), vue()],
  resolve: {
    alias: [
      { find: /^@javaabu\/i18n\/(react|vue|jquery)$/, replacement: resolve(root, "../src/$1") },
      { find: /^@javaabu\/i18n$/, replacement: resolve(root, "../src/index.ts") },
    ],
  },
  build: {
    rollupOptions: { input: ["index", "react", "vue", "jquery", "vanilla"].map(page) },
  },
})

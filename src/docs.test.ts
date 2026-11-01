import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const root = join(import.meta.dirname, "..")
const read = (path: string) => readFileSync(join(root, path), "utf8")

function pages(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const path = join(dir, name)

    if (statSync(join(root, path)).isDirectory()) return pages(path)

    return name.endsWith(".md") ? [path] : []
  })
}

describe("docs", () => {
  it("lists every page in llms.txt, and only pages that exist", () => {
    const llms = read("llms.txt")
    const linked = [...llms.matchAll(/\]\((docs\/[^)]+)\)/g)].map((match) => match[1] as string)

    expect([...linked].sort()).toEqual(pages("docs").sort())
  })

  it("has working relative links", () => {
    for (const page of pages("docs")) {
      for (const [, link] of read(page).matchAll(/\]\((\.{1,2}\/[^)#]+)(?:#[^)]*)?\)/g)) {
        const target = relative(root, join(root, page, "..", link as string))

        expect({
          page,
          link,
          exists: existsSync(join(root, `${target}.md`)) || existsSync(join(root, target)),
        }).toEqual({
          page,
          link,
          exists: true,
        })
      }
    }
  })

  it("gives every page a title and sidebar position", () => {
    for (const page of pages("docs")) {
      expect(read(page), page).toMatch(/^---\ntitle: .+\nsidebar_position: [\d.]+\n---/)
    }
  })

  it("ships the docs, the skill and the guideline", () => {
    const { files } = JSON.parse(read("package.json")) as { files: string[] }

    expect(files).toEqual(expect.arrayContaining(["docs", "llms.txt", "resources"]))
    expect(read("resources/boost/skills/javaabu-i18n/SKILL.md")).toMatch(/^---\nname: javaabu-i18n\n/)
    expect(read("resources/boost/guidelines/core.blade.php")).toContain("javaabu-i18n")
  })

  it("documents everything the package exports", async () => {
    const reference = read("docs/api-reference.md")
    const internal = ["chooseMessage", "getPluralIndex", "makeReplacements", "Translator", "translator"]
    const exports = Object.keys(await import("./index")).filter((name) => !internal.includes(name))

    for (const name of exports) expect(reference, name).toContain(name)
  })
})

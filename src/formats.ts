import type { Messages } from "./types.js"

export interface ParsedFile {
  /** The locale the file says it's for, if it says. An explicit `locale` option wins over it. */
  locale?: string
  messages: Messages
}

export type FormatParser = (text: string) => ParsedFile

function setPath(tree: Messages, path: string, value: string): void {
  const segments = path.split(".")
  const last = segments.pop() as string
  let node = tree

  for (const segment of segments) {
    let next = Object.prototype.hasOwnProperty.call(node, segment) ? node[segment] : undefined

    if (typeof next !== "object" || next === null || Array.isArray(next)) {
      next = {}
      define(node, segment, next)
    }

    node = next as Messages
  }

  define(node, last, value)
}

/** Sets a key without tripping `__proto__`'s setter, since files can come from anywhere. */
function define(node: Messages, key: string, value: Messages[string]): void {
  Object.defineProperty(node, key, { value, enumerable: true, writable: true, configurable: true })
}

function parseJson(text: string): ParsedFile {
  return { messages: JSON.parse(text) as Messages }
}

/** Flutter's ARB: JSON with `@@locale`, `@key` metadata and `{name}` placeholders. */
function parseArb(text: string): ParsedFile {
  const data = JSON.parse(text) as Record<string, unknown>
  const messages: Messages = {}

  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith("@") && typeof value === "string") {
      define(messages, key, value.replace(/\{(\w+)\}/g, ":$1"))
    }
  }

  return { locale: typeof data["@@locale"] === "string" ? data["@@locale"] : undefined, messages }
}

function unescapePo(text: string): string {
  return text.replace(/\\(.)/g, (_, char: string) => {
    const escapes: Record<string, string> = { n: "\n", t: "\t", r: "\r" }

    return escapes[char] ?? char
  })
}

/** Gettext `.po`. Plurals become Laravel's `one|many` lines; fuzzy and untranslated entries are skipped, as msgfmt does. */
function parsePo(text: string): ParsedFile {
  const messages: Messages = {}
  let locale: string | undefined

  for (const block of text.split(/\r?\n\s*\r?\n/)) {
    const fields: Record<string, string> = {}
    let current: string | undefined
    let fuzzy = false

    for (const raw of block.split(/\r?\n/)) {
      const line = raw.trim()

      if (line.startsWith("#")) {
        if (/^#,.*\bfuzzy\b/.test(line)) fuzzy = true
        continue
      }

      const start = /^(msgctxt|msgid_plural|msgid|msgstr(?:\[\d+\])?)\s+"(.*)"$/.exec(line)
      const more = /^"(.*)"$/.exec(line)

      if (start) {
        current = start[1] as string
        fields[current] = unescapePo(start[2] as string)
      } else if (more && current) {
        fields[current] += unescapePo(more[1] as string)
      }
    }

    if (fields.msgid === undefined) continue

    if (fields.msgid === "") {
      locale = /^Language:\s*(\S+)/m.exec(fields.msgstr ?? "")?.[1]
      continue
    }

    const forms = Object.keys(fields)
      .filter((field) => field.startsWith("msgstr"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((field) => fields[field] as string)

    if (fuzzy || forms.length === 0 || forms.some((form) => form === "")) continue

    define(messages, fields.msgctxt ? `${fields.msgctxt}.${fields.msgid}` : fields.msgid, forms.join("|"))
  }

  return { locale, messages }
}

function decodeXml(text: string): string {
  return text
    .split(/(<!\[CDATA\[[\s\S]*?\]\]>)/)
    .map((part) => {
      if (part.startsWith("<![CDATA[")) return part.slice(9, -3)

      return part
        .replace(/<[^>]+>/g, "")
        .replace(/&(?:#(\d+)|#x([\da-f]+)|(lt|gt|amp|quot|apos));/gi, (_, dec, hex, name: string | undefined) => {
          if (dec) return String.fromCodePoint(Number(dec))
          if (hex) return String.fromCodePoint(parseInt(hex, 16))

          return { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" }[(name as string).toLowerCase() as "lt"]
        })
    })
    .join("")
}

function xmlAttribute(tag: string, name: string): string | undefined {
  const value = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(tag)

  return value ? decodeXml(value[1] ?? value[2] ?? "") : undefined
}

/** XLIFF 1.2 and 2.x. The key is `resname`/`name`, then a meaningful `id`, then the source text. */
function parseXliff(text: string): ParsedFile {
  const messages: Messages = {}
  const header = /<(?:file|xliff)\b[^>]*\b(?:target-language|trgLang)\s*=[^>]*>/.exec(text)?.[0]
  const locale = header && (xmlAttribute(header, "target-language") ?? xmlAttribute(header, "trgLang"))

  for (const unit of text.matchAll(/<(trans-unit|unit)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const attributes = ` ${unit[2]}`
    const body = unit[3] as string
    const source = /<source\b[^>]*>([\s\S]*?)<\/source>/.exec(body)?.[1]
    const target = /<target\b[^>]*>([\s\S]*?)<\/target>/.exec(body)?.[1]
    const sourceText = source === undefined ? undefined : decodeXml(source)
    const id = xmlAttribute(attributes, "id")
    const named = xmlAttribute(attributes, "resname") ?? xmlAttribute(attributes, "name")
    const key = named ?? (id && !/^\d+$/.test(id) ? id : sourceText)
    const value = target === undefined ? sourceText : decodeXml(target)

    if (key && value) define(messages, key, value)
  }

  return { locale: locale || undefined, messages }
}

/** Java `.properties`. Dotted keys are groups, so they fall back like language files do. */
function parseProperties(text: string): ParsedFile {
  const messages: Messages = {}
  const lines = text.replace(/\\\r?\n[ \t]*/g, "").split(/\r?\n/)

  for (const raw of lines) {
    const line = raw.replace(/^\s+/, "")

    if (line === "" || line.startsWith("#") || line.startsWith("!")) continue

    const separator = /^((?:\\.|[^\\=:\s])+)\s*[=:\s]\s*/.exec(line)
    const rawKey = separator ? (separator[1] as string) : line
    const rawValue = separator ? line.slice((separator[0] as string).length) : ""
    const unescape = (value: string) =>
      value.replace(/\\(u[\da-fA-F]{4}|.)/g, (_, char: string) => {
        if (char.length > 1) return String.fromCharCode(parseInt(char.slice(1), 16))
        const escapes: Record<string, string> = { n: "\n", t: "\t", r: "\r", f: "\f" }

        return escapes[char] ?? char
      })

    setPath(messages, unescape(rawKey), unescape(rawValue))
  }

  return { messages }
}

const parsers = new Map<string, FormatParser>([
  ["json", parseJson],
  ["arb", parseArb],
  ["po", parsePo],
  ["xliff", parseXliff],
  ["xlf", parseXliff],
  ["properties", parseProperties],
])

/** Adds a file format, or replaces one. The name is also the file extension URL loaders recognise. */
export function registerFormat(name: string, parser: FormatParser): void {
  parsers.set(name.toLowerCase(), parser)
}

/** The format of a URL or path from its extension, if it's a known one. */
export function formatFromPath(path: string): string | undefined {
  const extension = /\.(\w+)(?:[?#].*)?$/.exec(path)?.[1]?.toLowerCase()

  return extension && parsers.has(extension) ? extension : undefined
}

function sniffFormat(text: string): string {
  const start = text.trimStart()

  if (start.startsWith("{") || start.startsWith("[")) return /"@@?\w+"\s*:/.test(start) ? "arb" : "json"
  if (start.startsWith("<")) return "xliff"
  if (/^msgid\s+"/m.test(start)) return "po"

  return "properties"
}

export function parseFile(text: string, format?: string): ParsedFile {
  const name = (format ?? sniffFormat(text)).toLowerCase()
  const parser = parsers.get(name)

  if (!parser) {
    throw new Error(`Unknown translation format "${name}". Add it with registerFormat().`)
  }

  return parser(text)
}

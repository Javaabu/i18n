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
  let fields: Record<string, string> = {}
  let current: string | undefined
  let fuzzy = false

  const hasMsgstr = () => Object.keys(fields).some((field) => field.startsWith("msgstr"))

  const finish = () => {
    const entry = fields
    const skip = fuzzy

    fields = {}
    current = undefined
    fuzzy = false

    if (entry.msgid === undefined) return

    if (entry.msgid === "") {
      // `[ \t]*`, not `\s*`: an empty `Language:` mustn't run on into the next header.
      locale = /^Language:[ \t]*(\S*)/m.exec(entry.msgstr ?? "")?.[1] || undefined
      return
    }

    const forms = Object.keys(entry)
      .filter((field) => field.startsWith("msgstr"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((field) => entry[field] as string)

    if (skip || forms.length === 0 || forms.some((form) => form === "")) return

    define(messages, entry.msgctxt ? `${entry.msgctxt}.${entry.msgid}` : entry.msgid, forms.join("|"))
  }

  // Entries don't need blank lines between them: a comment, `msgctxt` or `msgid` after a `msgstr` starts the next one.
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()

    if (line === "") {
      finish()
      continue
    }

    if (line.startsWith("#")) {
      if (hasMsgstr()) finish()
      if (/^#,.*\bfuzzy\b/.test(line)) fuzzy = true
      current = undefined
      continue
    }

    const start = /^(msgctxt|msgid_plural|msgid|msgstr(?:\[\d+\])?)\s+"(.*)"$/.exec(line)
    const more = /^"(.*)"$/.exec(line)

    if (start) {
      const field = start[1] as string

      if ((field === "msgctxt" || field === "msgid") && hasMsgstr()) finish()

      current = field
      fields[current] = unescapePo(start[2] as string)
    } else if (more && current) {
      fields[current] += unescapePo(more[1] as string)
    }
  }

  finish()

  return { locale, messages }
}

function decodeXml(text: string): string {
  return text
    .split(/(<!\[CDATA\[[\s\S]*?\]\]>)/)
    .map((part) => {
      if (part.startsWith("<![CDATA[")) return part.slice(9, -3)

      return part
        .replace(/<[^>]+>/g, "")
        .replace(/&(?:#(\d+)|#x([\da-f]+)|(lt|gt|amp|quot|apos));/gi, (match, dec, hex, name: string | undefined) => {
          if (dec || hex) {
            const codePoint = dec ? Number(dec) : parseInt(hex as string, 16)

            // Out of Unicode's range, `fromCodePoint()` throws; the reference is left as written.
            return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match
          }

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
  const lines = text.split(/\r?\n/)
  // An odd number of backslashes at the end continues the line; an even number is escaped backslashes.
  const continues = (line: string) => (/\\+$/.exec(line)?.[0].length ?? 0) % 2 === 1

  for (let index = 0; index < lines.length; index++) {
    let line = (lines[index] as string).replace(/^[ \t\f]+/, "")

    // Comments never continue onto the next line.
    if (line === "" || line.startsWith("#") || line.startsWith("!")) continue

    while (continues(line)) {
      line = line.slice(0, -1)
      index++
      if (index >= lines.length) break
      line += (lines[index] as string).replace(/^[ \t\f]+/, "")
    }

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

/** ARB has `@@locale`, or `@key` metadata objects next to their `key`. A JSON key that starts with `@` isn't enough. */
function looksLikeArb(text: string): boolean {
  let data: unknown

  try {
    data = JSON.parse(text)
  } catch {
    return false
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) return false

  const has = (key: string) => Object.prototype.hasOwnProperty.call(data, key)
  const record = data as Record<string, unknown>

  return (
    has("@@locale") ||
    Object.keys(record).some((key) => {
      const metadata = record[key]

      return (
        key.startsWith("@") &&
        !key.startsWith("@@") &&
        typeof metadata === "object" &&
        metadata !== null &&
        !Array.isArray(metadata) &&
        has(key.slice(1))
      )
    })
  )
}

function sniffFormat(text: string): string {
  const start = text.trimStart()

  if (start.startsWith("{") || start.startsWith("[")) return /"@/.test(start) && looksLikeArb(start) ? "arb" : "json"
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

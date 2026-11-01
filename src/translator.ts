import { formatFromPath, parseFile } from "./formats.js"
import { detectFallbackLocale, detectLocale, isRtlLocale, localeChain, normalizeLocale } from "./locale.js"
import { chooseMessage } from "./message-selector.js"
import type {
  Countable,
  Loader,
  LoadOptions,
  Messages,
  MissingKeyHandler,
  PluralRule,
  Replacements,
  Translation,
  TranslatorOptions,
} from "./types.js"

const DEFAULT_LOCALE = "en"

/** A locale code on its own (`en`, `pt_BR`), and one with a group behind it (`en.messages`, the `lang:js` shape). */
const BARE_LOCALE = /^[a-zA-Z]{2,3}(?:[-_][a-zA-Z0-9]{2,8})*$/
const PREFIXED_LOCALE = /^([a-zA-Z]{2,3}(?:[-_][a-zA-Z0-9]{2,8})*)\.(.+)$/

function isGroup(value: unknown): value is Messages {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function own(node: Messages, key: string): Messages[string] | undefined {
  return Object.prototype.hasOwnProperty.call(node, key) ? node[key] : undefined
}

function mergeInto(target: Messages, source: Messages): void {
  for (const [key, value] of Object.entries(source)) {
    if (key === "__proto__") continue

    const existing = own(target, key)

    if (isGroup(value) && isGroup(existing)) {
      mergeInto(existing, value)
    } else if (isGroup(value)) {
      target[key] = {}
      mergeInto(target[key] as Messages, value)
    } else {
      target[key] = value
    }
  }
}

/** `Arr::get()`, but a key may also contain literal dots at any depth (`en.dir.sub`, sentences as keys). */
function dataGet(node: Messages, key: string): Messages[string] | undefined {
  const exact = own(node, key)

  if (exact !== undefined) return exact

  for (let dot = key.indexOf("."); dot !== -1; dot = key.indexOf(".", dot + 1)) {
    const head = own(node, key.slice(0, dot))

    if (isGroup(head)) {
      const found = dataGet(head, key.slice(dot + 1))

      if (found !== undefined) return found
    }
  }

  return undefined
}

/** Like `dataGet()`, for language files: a top level string is a JSON line, not part of a group. */
function groupGet(tree: Messages, key: string): Messages[string] | undefined {
  const found = dataGet(tree, key)

  return typeof own(tree, key) === "string" ? undefined : found
}

function toText(value: unknown): string {
  if (value === null || value === undefined || value === false) return ""
  if (value === true) return "1"
  if (typeof value === "object" && "value" in value) return toText(value.value)

  return String(value)
}

function upperFirst(text: string): string {
  const first = String.fromCodePoint(text.codePointAt(0) ?? 0)

  return text === "" ? "" : first.toUpperCase() + text.slice(first.length)
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&")
}

/** `Translator::makeReplacements()`: `strtr()` semantics, so the longest placeholder wins and output isn't rescanned. */
export function makeReplacements(line: string, replace: Replacements): string {
  const entries = Object.entries(replace)

  if (entries.length === 0) return line

  const shouldReplace = new Map<string, string>()

  for (const [key, value] of entries) {
    if (typeof value === "function") {
      const pattern = new RegExp(`<${escapeRegExp(key)}>(.*?)</${escapeRegExp(key)}>`, "g")

      line = line.replace(pattern, (_, content: string) => String(value(content)))

      continue
    }

    const text = toText(value)

    shouldReplace.set(`:${upperFirst(key)}`, upperFirst(text))
    shouldReplace.set(`:${key.toUpperCase()}`, text.toUpperCase())
    shouldReplace.set(`:${key}`, text)
  }

  if (shouldReplace.size === 0) return line

  const pattern = [...shouldReplace.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp)

  return line.replace(new RegExp(pattern.join("|"), "g"), (match) => shouldReplace.get(match) as string)
}

function replaceDeep(group: Messages, replace: Replacements): Messages {
  const result: Messages = {}

  for (const [key, value] of Object.entries(group)) {
    if (typeof value === "string") result[key] = makeReplacements(value, replace)
    else if (isGroup(value)) result[key] = replaceDeep(value, replace)
    else result[key] = value
  }

  return result
}

function countOf(number: Countable): number {
  if (typeof number === "number") return number
  if (number instanceof Set || number instanceof Map) return number.size

  return number.length
}

/** What `import()` gives you: the JSON is on `default`. A translation key called `default` in plain data stays put. */
function unwrapModule(input: unknown): unknown {
  const module = input as { default?: unknown; __esModule?: boolean; [Symbol.toStringTag]?: string } | null

  return module?.[Symbol.toStringTag] === "Module" || module?.__esModule ? (module.default ?? module) : input
}

/** The Lang.js global the `lang:js` script sets up, so pages that already include it just work. */
function globalLangMessages(): Messages | undefined {
  const lang = (globalThis as { Lang?: { messages?: unknown } }).Lang

  return isGroup(lang?.messages) ? lang.messages : undefined
}

/**
 * Mirrors `Illuminate\Translation\Translator`. The translation methods are bound, so they can be passed around or
 * destructured.
 */
export class Translator {
  private readonly tree = new Map<string, Messages>()
  private readonly listeners = new Set<() => void>()
  private readonly pending = new Map<string, Promise<void>>()
  private readonly loaded = new Set<string>()
  private readonly pluralRules = new Map<string, PluralRule>()
  private locale?: string
  private fallback?: string | null
  private loader?: Loader
  private format?: string
  private missingKeyHandler?: MissingKeyHandler
  private handlingMissingKeys = true
  private readGlobalLang = false
  private globalLang?: Messages
  private version = 0

  constructor(options: TranslatorOptions = {}) {
    this.configure(options)
  }

  configure(options: TranslatorOptions): this {
    if (options.locale) this.locale = normalizeLocale(options.locale)
    if (options.fallback !== undefined) this.fallback = options.fallback && normalizeLocale(options.fallback)
    if (options.format) this.format = options.format

    for (const [locale, rule] of Object.entries(options.pluralRules ?? {})) {
      this.pluralRules.set(normalizeLocale(locale), rule)
    }

    if (options.messages !== undefined) this.load(options.messages)

    if (options.loader) {
      this.loader = options.loader
      this.loaded.clear()
      this.fetchLocale(this.getLocale())

      const fallback = this.getFallback()

      if (fallback) this.fetchLocale(fallback)
    }

    return this
  }

  /** Pick up `window.Lang` (Laravel JS Localization), including one whose script runs after this module. */
  useGlobalLang(): this {
    this.readGlobalLang = true

    return this
  }

  getLocale = (): string => {
    this.locale ??= detectLocale() ?? DEFAULT_LOCALE

    return this.locale
  }

  /** Switches right away. Lines from a loader follow; subscribers hear about it, or wait with `ready()`. */
  setLocale = (locale: string): void => {
    const next = normalizeLocale(locale)

    if (next === this.locale) return

    this.locale = next
    this.notify()
    this.fetchLocale(next)
  }

  getFallback = (): string | null => {
    if (this.fallback === undefined) this.fallback = detectFallbackLocale() ?? DEFAULT_LOCALE

    return this.fallback
  }

  setFallback = (fallback: string | null): void => {
    this.fallback = fallback && normalizeLocale(fallback)
    this.notify()
    if (this.fallback) this.fetchLocale(this.fallback)
  }

  /** `rtl` or `ltr`, for the current locale or the one given. */
  getDirection = (locale?: string | null): "rtl" | "ltr" => (this.isRtl(locale) ? "rtl" : "ltr")

  isRtl = (locale?: string | null): boolean => isRtlLocale(locale || this.getLocale())

  /**
   * Adds lines, merging with what's there. Takes an object or the text of a file, in any of these shapes:
   *
   * - Laravel JS Localization: `{ "en.messages": { … }, "dv.messages": { … } }`
   * - by locale: `{ en: { messages: { … } }, dv: { … } }`
   * - one locale (pass `{ locale }` to be explicit): `{ "Hello": "…", messages: { … } }`
   */
  load = (input: unknown, options: LoadOptions = {}): this => {
    const file = typeof input === "string" ? parseFile(input, options.format) : undefined
    const data: unknown = file ? file.messages : unwrapModule(input)

    if (!isGroup(data)) {
      throw new TypeError("Translations must be an object or the text of a translation file.")
    }

    const locale = options.locale ?? file?.locale

    if (locale) {
      this.merge(locale, data)
    } else {
      this.loadShaped(data)
    }

    this.notify()

    return this
  }

  /** `Translator::addLines()`: `{ "group.item": "line" }`. */
  addLines = (lines: Record<string, string>, locale: string, namespace = "*"): void => {
    for (const [key, value] of Object.entries(lines)) {
      const nested: Messages = {}
      let node = nested
      const segments = key.split(".")
      const last = segments.pop() as string

      segments.forEach((segment, index) => {
        const name = index === 0 && namespace !== "*" ? `${namespace}::${segment}` : segment

        node = node[name] = {}
      })
      node[last] = value
      this.merge(locale, nested)
    }

    this.notify()
  }

  /** Fetches a locale with the configured loader, if there is one and it hasn't yet. */
  loadLocale = (locale: string): Promise<void> => {
    this.fetchLocale(normalizeLocale(locale))

    return this.ready()
  }

  /** Resolves once everything the loader is fetching right now has arrived; rejects if any of it fails. */
  ready = async (): Promise<void> => {
    await Promise.all(this.pending.values())
  }

  /** Listens for locale and line changes. Returns the function that stops listening. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Goes up with every change, for change detection in UI bindings. */
  getVersion = (): number => this.version

  handleMissingKeysUsing = (handler: MissingKeyHandler | undefined): void => {
    this.missingKeyHandler = handler
  }

  has = (key: string, locale?: string | null, fallback = true): boolean => {
    const target = locale ? normalizeLocale(locale) : this.getLocale()
    const handling = this.handlingMissingKeys

    this.handlingMissingKeys = false

    const line = this.get(key, [], target, fallback)

    this.handlingMissingKeys = handling

    return this.jsonLine(key, target) !== undefined || line !== key
  }

  hasForLocale = (key: string, locale?: string | null): boolean => this.has(key, locale, false)

  /** `Translator::get()`. Returns the key, with replacements made, when there's no line. */
  get = (key: string, replace: Replacements = {}, locale?: string | null, fallback = true): Translation => {
    this.syncGlobalLang()

    const target = locale ? normalizeLocale(locale) : this.getLocale()
    const line = this.jsonLine(key, target)
    let missingKey = key

    if (line === undefined) {
      // Only a language file line or group falls back. Laravel doesn't fall back for JSON lines.
      const fallbackLocale = fallback ? this.getFallback() : null
      const locales = [...localeChain(target), ...(fallbackLocale ? localeChain(fallbackLocale) : [])]
      const path = key.replace(/\//g, ".")

      for (const candidate of locales) {
        const tree = this.tree.get(candidate)
        const found = tree && groupGet(tree, path)

        if (typeof found === "string") return makeReplacements(found, replace)
        if (isGroup(found) && Object.keys(found).length > 0) return replaceDeep(found, replace)
      }

      missingKey = this.handleMissingKey(key, replace, target, fallback)
    }

    return makeReplacements(line || missingKey, replace)
  }

  /** `Translator::choice()`. */
  choice = (key: string, number: Countable, replace: Replacements = {}, locale?: string | null): string => {
    const requested = locale ? normalizeLocale(locale) : this.getLocale()
    const target = this.hasForLocale(key, requested) ? requested : (this.getFallback() ?? "")
    const line = this.get(key, [], target)
    const count = countOf(number)
    const values: Replacements = Array.isArray(replace) ? { ...replace } : replace
    const withCount = (values as Record<string, unknown>).count == null ? { ...values, count } : values
    const rule = this.pluralRules.get(target) ?? this.pluralRules.get(target.split("_")[0] as string)

    return makeReplacements(chooseMessage(String(line), count, target, rule), withCount)
  }

  /** The `trans()` helper: the line, or the translator itself without a key. */
  trans: {
    (): Translator
    (key: null | undefined, replace?: Replacements, locale?: string | null): Translator
    <T extends Translation = string>(key: string, replace?: Replacements, locale?: string | null): T
  } = ((key?: string | null, replace?: Replacements, locale?: string | null) =>
    key === null || key === undefined ? this : this.get(key, replace, locale)) as Translator["trans"]

  /** The `__()` helper: the line, or `null` without a key. */
  __: {
    (): null
    (key: null | undefined, replace?: Replacements, locale?: string | null): null
    <T extends Translation = string>(key: string, replace?: Replacements, locale?: string | null): T
  } = ((key?: string | null, replace?: Replacements, locale?: string | null) =>
    key === null || key === undefined ? null : this.get(key, replace, locale)) as Translator["__"]

  /** The `trans_choice()` helper. */
  trans_choice = (key: string, number: Countable, replace?: Replacements, locale?: string | null): string =>
    this.choice(key, number, replace, locale)

  transChoice = this.trans_choice

  private jsonLine(key: string, locale: string): string | undefined {
    for (const candidate of localeChain(locale)) {
      const tree = this.tree.get(candidate)

      if (!tree) continue

      const line = own(tree, key)

      if (typeof line === "string") return line

      // `lang:js` puts lang/{locale}.json in the `strings` group, so bare keys are looked up there too.
      const strings = own(tree, "strings")
      const stringsLine = isGroup(strings) ? own(strings, key) : undefined

      if (typeof stringsLine === "string") return stringsLine
    }

    return undefined
  }

  private handleMissingKey(key: string, replace: Replacements, locale: string, fallback: boolean): string {
    if (!this.handlingMissingKeys || !this.missingKeyHandler) return key

    // A handler that translates something missing mustn't end up back here.
    this.handlingMissingKeys = false

    try {
      return this.missingKeyHandler(key, replace, locale, fallback) ?? key
    } finally {
      this.handlingMissingKeys = true
    }
  }

  private loadShaped(data: Messages): void {
    const entries = Object.entries(data)
    const shaped = (pattern: RegExp) => entries.length > 0 && entries.every(([k, v]) => pattern.test(k) && isGroup(v))

    if (shaped(PREFIXED_LOCALE)) {
      for (const [key, value] of entries) {
        const [, locale, group] = PREFIXED_LOCALE.exec(key) as RegExpExecArray

        this.merge(locale as string, { [group as string]: value })
      }
    } else if (shaped(BARE_LOCALE)) {
      for (const [locale, value] of entries) this.merge(locale, value as Messages)
    } else {
      this.merge(this.getLocale(), data)
    }
  }

  private merge(locale: string, lines: Messages): void {
    const name = normalizeLocale(locale)
    let tree = this.tree.get(name)

    if (!tree) {
      tree = {}
      this.tree.set(name, tree)
    }

    const normalized: Messages = {}

    // `__('dir/file.key')` is looked up as `dir.file.key`, which is how `lang:js` names nested files.
    for (const [key, value] of Object.entries(lines)) {
      if (key === "__proto__") continue

      normalized[isGroup(value) ? key.replace(/\//g, ".") : key] = value
    }

    mergeInto(tree, normalized)
  }

  private syncGlobalLang(): void {
    if (!this.readGlobalLang) return

    const messages = globalLangMessages()

    if (messages && messages !== this.globalLang) {
      this.globalLang = messages
      this.loadShaped(messages)
      this.version++
    }
  }

  private fetchLocale(locale: string): void {
    const loader = this.loader

    if (!loader) return

    const perLocale = typeof loader === "function" || loader.includes("{locale}")
    const id = perLocale ? locale : "*"

    if (this.loaded.has(id) || this.pending.has(id)) return

    const request = this.request(loader, locale, perLocale)
      .then(() => {
        this.loaded.add(id)
        this.pending.delete(id)
      })
      .catch((error: unknown) => {
        this.pending.delete(id)
        console.error(`[@javaabu/i18n] Couldn't load translations for "${locale}".`, error)

        throw error
      })

    // `ready()` reports failures; when nobody's waiting, the console.error above is enough.
    request.catch(() => {})
    this.pending.set(id, request)
  }

  private async request(loader: Loader, locale: string, perLocale: boolean): Promise<void> {
    const options: LoadOptions = perLocale ? { locale } : {}

    if (typeof loader === "function") {
      const data = await loader(locale)

      if (data !== undefined && data !== null) this.load(data, { ...options, format: this.format })

      return
    }

    const url = loader.replace("{locale}", encodeURIComponent(locale))
    const response = await fetch(url, { headers: { Accept: "application/json, text/plain, */*" } })

    if (!response.ok) {
      // A locale without a file is normal: its keys fall back. Anything else is a real failure.
      if (response.status === 404 && perLocale) return

      throw new Error(`${url} responded with ${response.status}.`)
    }

    this.load(await response.text(), { ...options, format: this.format ?? formatFromPath(url) })
  }

  private notify(): void {
    this.version++

    for (const listener of [...this.listeners]) listener()
  }
}

export function createTranslator(options?: TranslatorOptions): Translator {
  return new Translator(options)
}

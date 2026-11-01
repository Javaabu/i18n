/** A tree of translation lines: JSON-style lines at the top, groups (Laravel's language files) as nested objects. */
export interface Messages {
  [key: string]: MessageValue
}

export type MessageValue = string | number | boolean | null | Messages | MessageValue[]

/** Placeholder values. A function handles a `<tag>…</tag>` pair, as a Closure does in Laravel. */
export type Replacements = Record<string, unknown> | unknown[]

/** What a translation can be: a line, or a whole group when the key points at one (`__<Messages>("messages")`). */
export type Translation = string | Messages

/** Anything `trans_choice()` accepts as a number; collections are counted, as Countable is in Laravel. */
export type Countable = number | unknown[] | Set<unknown> | Map<unknown, unknown> | { length: number }

export interface LoadOptions {
  /** The locale these lines are for. Without it the locale comes from the data or the file, then the current locale. */
  locale?: string
  /** A format name for text input: `json`, `po`, `xliff`, `properties`, `arb` or one from `registerFormat()`. */
  format?: string
}

/** A URL (`{locale}` is filled in) or a function that returns the lines of a locale, for `import()` and friends. */
export type Loader = string | ((locale: string) => unknown)

export interface TranslatorOptions {
  /** Defaults to the locale of the page: see `detectLocale()`. */
  locale?: string
  /** Defaults to `<meta name="fallback-locale">`, then `en`. `null` turns the fallback off. */
  fallback?: string | null
  /** Lines to load straight away, in any shape `load()` accepts. */
  messages?: unknown
  /** Fetches lines on demand: the current and fallback locales now, and new locales on `setLocale()`. */
  loader?: Loader
  /** Format of what a URL loader returns. Defaults to the file extension of the URL. */
  format?: string
  /** Per-locale plural index overrides, for locales Laravel's table doesn't cover. */
  pluralRules?: Record<string, PluralRule>
}

export type PluralRule = (number: number) => number

export type MissingKeyHandler = (
  key: string,
  replace: Replacements,
  locale: string,
  fallback: boolean,
) => string | null | undefined | void

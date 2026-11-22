/**
 * Laravel spells locales `en_GB`; `<html lang>` spells them `en-GB`. Both end up as `en_GB`. Of a list like
 * `content-language` or `Accept-Language` (`dv, en;q=0.9`), the first locale is taken.
 */
export function normalizeLocale(locale: string): string {
  const first = locale.split(",").find((entry) => entry.trim() !== "") ?? ""
  const [language = "", ...rest] = (first.split(";")[0] as string).trim().split(/[-_]/)
  const parts = rest.map((part) => {
    if (/^[a-z]{2}$/i.test(part)) return part.toUpperCase()
    if (/^[a-z]{4}$/i.test(part)) return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    return part
  })

  return [language.toLowerCase(), ...parts].join("_")
}

/** `zh_Hant_TW`, `zh_Hant`, then `zh`, so `<html lang="dv-MV">` finds lines loaded for `dv`. */
export function localeChain(locale: string): string[] {
  const parts = locale.split("_")

  return parts.map((_, index) => parts.slice(0, parts.length - index).join("_"))
}

function metaContent(selector: string): string | undefined {
  return document.querySelector(selector)?.getAttribute("content")?.trim() || undefined
}

/**
 * The locale of the page: `<meta name="locale">`, `<meta http-equiv="content-language">`, `<html lang>`, then
 * `<meta property="og:locale">`. Undefined when there's no document or the page doesn't say.
 */
export function detectLocale(): string | undefined {
  if (typeof document === "undefined") return undefined

  const locale =
    metaContent('meta[name="locale"]') ??
    metaContent('meta[http-equiv="content-language" i]') ??
    (document.documentElement?.getAttribute("lang")?.trim() || undefined) ??
    metaContent('meta[property="og:locale"]')

  const normalized = locale && normalizeLocale(locale)

  return normalized || undefined
}

/** `<meta name="fallback-locale">`, for pages that want to pass on Laravel's `app.fallback_locale`. */
export function detectFallbackLocale(): string | undefined {
  if (typeof document === "undefined") return undefined

  const locale = metaContent('meta[name="fallback-locale"]')

  return locale ? normalizeLocale(locale) : undefined
}

/** Languages written right to left. Dhivehi first, it's why this package exists. */
const RTL_LANGUAGES = new Set(["dv", "ar", "arc", "ckb", "fa", "he", "ps", "sd", "ug", "ur", "yi"])

export function isRtlLocale(locale: string): boolean {
  const [language = "", ...rest] = normalizeLocale(locale).split("_")

  // A script subtag decides over the language: `az_Arab` is right to left, `ur_Latn` isn't.
  if (rest.includes("Latn")) return false

  return RTL_LANGUAGES.has(language) || rest.includes("Arab") || rest.includes("Hebr") || rest.includes("Thaa")
}

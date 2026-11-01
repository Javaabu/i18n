/** Laravel spells locales `en_GB`; `<html lang>` spells them `en-GB`. Both end up as `en_GB`. */
export function normalizeLocale(locale: string): string {
  const [language = "", ...rest] = locale.trim().split(/[-_]/)
  const parts = rest.map((part) => {
    if (/^[a-z]{2}$/i.test(part)) return part.toUpperCase()
    if (/^[a-z]{4}$/i.test(part)) return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    return part
  })

  return [language.toLowerCase(), ...parts].join("_")
}

/** `en_GB` then `en`, so `<html lang="dv-MV">` finds lines loaded for `dv`. */
export function localeChain(locale: string): string[] {
  const language = locale.split("_")[0] as string

  return language === locale ? [locale] : [locale, language]
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

  return locale ? normalizeLocale(locale) : undefined
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

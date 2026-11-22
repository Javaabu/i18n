# @javaabu/i18n

## 0.1.0

### Minor Changes

- cb07e98: First release: `__()`, `trans()` and `trans_choice()` with the same API and output as Laravel, locale detection from the page, loaders for Laravel JS Localization, JSON, gettext, XLIFF, properties and ARB files, RTL helpers, and React, Vue, jQuery and vanilla JS bindings. Ships its docs and a Laravel Boost skill.

### Patch Changes

- 810fe90: `trans_choice()` trims a matched form the way PHP's `trim()` does, keeping non-breaking and other Unicode spaces, as Laravel does.
- 7688aad: `configure({ locale })` and `configure({ fallback })`, including the Vue plugin's options, now tell subscribers and fetch the new locale with the loader, like `setLocale()` and `setFallback()`. Replacing the loader while a fetch is in flight now asks the new loader, and whatever the old one returns is ignored.
- ad74259: A JSON line of `"0"` returns the key, as Laravel's `$line ?: $key` does.
- c9593c8: Lists in language files (`'days' => ['އާދީއްތަ', 'ހޯމަ']`) can be returned whole, with replacements made in every item, and their items read by index (`messages.days.0`), as in Laravel. An empty list falls back, and loaded lists and groups are copied rather than shared with the caller.
- 527e84b: Every `{locale}` in a loader URL is filled in, not only the first.
- 70a2ba4: Locale detection takes the first locale of a list such as `<meta http-equiv="content-language" content="dv, en">`, and `normalizeLocale()` does the same for `en-US,en;q=0.9`. A locale with a script and region (`zh-Hant-TW`) now finds lines loaded for the script (`zh_Hant`) before the language (`zh`).
- 9b78350: Gettext files: an empty `Language:` header no longer takes the next header as the locale, and entries that aren't separated by blank lines are all read instead of only the last one.
- 5d7d28f: `.properties` files: a line ending in an escaped backslash (`C:\\dir\\`) or a comment ending in a backslash no longer swallows the next line.
- a009483: Sturdier with untrusted input: an XLIFF character reference outside Unicode (`&#99999999;`) is kept as written instead of failing the whole file; JSON is only sniffed as ARB when it has `@@locale` or an `@key` metadata object next to `key`, so a Laravel JSON file with a key like `@handle` keeps its groups and `{x}` text; and a malformed `data-trans-replace` is logged and ignored instead of stopping `translateDom()` partway through the page.

---
title: API reference
sidebar_position: 1.32
---

# Helpers

| Function                                                      | Laravel equivalent                           |
| ------------------------------------------------------------- | -------------------------------------------- |
| `__(key?, replace?, locale?)`                                 | `__()`. `null` without a key                 |
| `trans(key?, replace?, locale?)`                              | `trans()`. The translator without a key      |
| `trans_choice(key, number, replace?, locale?)`, `transChoice` | `trans_choice()`                             |
| `has(key, locale?, fallback?)`                                | `Lang::has()`                                |
| `addLines(lines, locale, namespace?)`                         | `Lang::addLines()`                           |
| `getLocale()`, `setLocale(locale)`                            | `App::getLocale()`, `App::setLocale()`       |
| `getFallback()`, `setFallback(locale)`                        | `Lang::getFallback()`, `Lang::setFallback()` |
| `translator.handleMissingKeysUsing(fn)`                       | `Lang::handleMissingKeysUsing()`             |

| Function                                         | What it does                                                   |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `configure(options)`                             | Sets the options below on the shared translator                |
| `load(input, { locale?, format? })`              | Adds lines from an object or the text of a file                |
| `ready()`                                        | Resolves when in-flight loads finish; rejects if one fails     |
| `subscribe(listener)`                            | Runs on locale and line changes. Returns a function to stop    |
| `getDirection(locale?)`, `isRtl(locale?)`        | The text direction of the current or given locale              |
| `syncDocument()`                                 | Sets `lang` and `dir` on `<html>` to the current locale        |
| `translatePage(root?)`                           | Translates [`data-trans` attributes](./frameworks/vanilla-js)  |
| `registerFormat(name, parser)`                   | Adds a [file format](./basic-usage/file-formats#other-formats) |
| `detectLocale()`, `detectFallbackLocale()`       | What the page says, or `undefined`                             |
| `normalizeLocale(locale)`, `isRtlLocale(locale)` | `en-gb` to `en_GB`; whether a locale is right to left          |
| `dhivehiPluralRule`                              | A [plural rule](./basic-usage/pluralization#dhivehi) for `dv`  |
| `createTranslator(options?)`                     | A separate translator, for server rendering                    |

# Options

| Option        | Default                               | What it does                                                             |
| ------------- | ------------------------------------- | ------------------------------------------------------------------------ |
| `locale`      | From the page                         | The current locale                                                       |
| `fallback`    | `<meta name="fallback-locale">`, `en` | The fallback locale. `null` turns it off                                 |
| `messages`    |                                       | Lines to load straight away                                              |
| `loader`      |                                       | A URL (`{locale}` is filled in) or a function returning a locale's lines |
| `format`      | From the URL or content               | The format of what a loader returns                                      |
| `pluralRules` |                                       | Plural rules by locale: `{ dv: (n) => (n === 1 ? 0 : 1) }`               |

# Translator

`translator` is the shared instance, and `createTranslator()` makes others. A translator has every function above as a method, apart from `translatePage()`, `syncDocument()` and `registerFormat()`, and also has `get()`, `choice()` and `hasForLocale()` like Laravel's. The methods stay bound if you destructure them.

# Entry points

| Import                 | Exports                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `@javaabu/i18n`        | Everything above                                                        |
| `@javaabu/i18n/react`  | `useTranslation()`, `I18nProvider`                                      |
| `@javaabu/i18n/vue`    | `i18n` (the plugin), `useTranslation()`                                 |
| `@javaabu/i18n/jquery` | `installJQuery($, translator?)`                                         |
| `@javaabu/i18n/global` | Nothing. Installs the helpers on `window`, and on jQuery if it's loaded |
| `dist/i18n.iife.js`    | The same as `global`, plus everything above on `window.I18n`            |

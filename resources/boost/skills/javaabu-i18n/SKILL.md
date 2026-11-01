---
name: javaabu-i18n
description: Translate strings in JavaScript or TypeScript with @javaabu/i18n, Laravel's __(), trans() and trans_choice() for React, Vue, jQuery and vanilla JS. Use whenever the project depends on @javaabu/i18n and the task adds user-facing text, loads translation files, switches locale, handles Dhivehi or RTL in JS, or migrates from Lang.js or the lang module of @javaabu/js-utilities.
license: MIT
metadata:
  author: Javaabu
---

# Translating with @javaabu/i18n

The API and output match Laravel's translator, so what you know about `__()` applies. The docs ship with the package: `node_modules/@javaabu/i18n/llms.txt` lists every page in `node_modules/@javaabu/i18n/docs/`.

## Which import to use

| Where                | Use                                                                         |
| -------------------- | --------------------------------------------------------------------------- |
| React component      | `const { __, trans_choice } = useTranslation()` from `@javaabu/i18n/react`  |
| Vue template         | `__('Key')` directly, once `app.use(i18n)` from `@javaabu/i18n/vue` has run |
| Vue `<script setup>` | `const { __ } = useTranslation()` from `@javaabu/i18n/vue`                  |
| jQuery               | `$.__('Key')` after `installJQuery($)` from `@javaabu/i18n/jquery`          |
| Plain modules        | `import { __ } from "@javaabu/i18n"`                                        |
| No bundler           | `window.__`, from `dist/i18n.iife.js`                                       |

In React, use the hook rather than the imported `__`, or components won't re-render when the locale changes.

## Rules

- Never hard-code user-facing text. Use the English text as the key for short strings (`__('Save')`) and add it to `lang/dv.json`. Use a group key (`messages.welcome`) for lines in PHP language files.
- Pass values as placeholders, `__('Hello, :name', { name })`, never by joining strings. Word order differs in Dhivehi.
- Don't add `i18next`, `vue-i18n`, `laravel-vue-i18n`, `Lang.js` or a custom `t()` helper.
- Don't set the locale from code unless the task is a language switcher: it's detected from `<html lang>`.
- The result isn't escaped. Escape anything you insert before using `innerHTML`, `v-html` or `dangerouslySetInnerHTML`.

## Things that differ from what you might assume

- JSON lines don't fall back: a key that's only in `en.json` returns the key in `dv`. Language file lines do fall back.
- **`trans_choice('one|many', 5)` returns `one` in Dhivehi**, because Laravel has no plural rule for `dv`. For Dhivehi lines, write ranges, `{1} …|[2,*] …`, which work on the server too.
- Don't add `pluralRules` for `dv` unless the server has the same rule, or the two will disagree.
- `__()` returns a string in TypeScript. Use `__<Messages>('group')` when a key returns a whole group.

## RTL

`getDirection()` and `isRtl()` give the direction of the current locale, and `direction` comes with `useTranslation()`. Use `subscribe(syncDocument)` to keep `<html lang dir>` in step with a language switcher.

Translations from PHP language files can't load in the browser: export them with `php artisan lang:js --json`.

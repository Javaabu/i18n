---
title: Requirements
sidebar_position: 1.1
---

The package has no runtime dependencies and runs in any browser from the last few years.

Each integration needs its own library, already in your project:

| Entry point            | Needs                 |
| ---------------------- | --------------------- |
| `@javaabu/i18n`        | Nothing               |
| `@javaabu/i18n/react`  | React 18 or 19        |
| `@javaabu/i18n/vue`    | Vue 3.3 or later      |
| `@javaabu/i18n/jquery` | Any version of jQuery |

Vue 2 isn't supported.

Bundlers need to understand the `exports` field of `package.json` to resolve the entry points above: Vite, webpack 5, Laravel Mix 6 and later all do. On webpack 4, use the [script tag](./installation-and-setup#without-a-bundler).

The package doesn't need anything on the Laravel side. To export PHP language files (`lang/en/messages.php`), which can't be read in the browser, install [mariuzzo/laravel-js-localization](https://github.com/rmariuzzo/Laravel-JS-Localization).

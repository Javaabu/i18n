---
title: Loading translations
sidebar_position: 4
---

Pick whichever suits the project. Everything merges into what's already loaded.

# An existing `lang:js` script

If the page has Laravel JS Localization's script, there's nothing to do. The shared translator reads `window.Lang`, including when that script runs later.

```html
<script src="/js/messages.js"></script>
```

# From a URL

The format comes from the file extension. `{locale}` is filled in, and only the locales you use get fetched. A 404 for a locale just means its keys fall back.

```js
configure({ loader: "/messages.json" }) // php artisan lang:js --json public/messages.json
configure({ loader: "/lang/{locale}.json" })
configure({ loader: "/lang/{locale}.po" })
```

# Bundled with your code

For example, Laravel's own `lang/*.json`:

```js
configure({ loader: (locale) => import(`../../lang/${locale}.json`) })
```

# From the server

For example, Inertia shared props or Blade:

```js
import { load } from "@javaabu/i18n"

load(page.props.translations, { locale: page.props.locale })
```

# PHP language files

`lang/en/messages.php` can't be read in the browser, so export those with `php artisan lang:js`.

# Loading failures

A failed load is logged with `console.error` and the keys fall back. To handle it yourself, catch it from `ready()`:

```js
await ready().catch(showError)
```

See [File formats](./file-formats) for everything `load()` and the loaders accept.

---
title: Migrating from js-utilities
sidebar_position: 1.34
---

`lang` from [`@javaabu/js-utilities`](https://github.com/Javaabu/js-utilities) wraps `Lang.js` and needs its script on the page. This package reads the same data and doesn't need `Lang.js` to translate.

Replace the import, and drop the `init()` call. The locale is detected by itself.

```diff
- import { lang } from "@javaabu/js-utilities"
- lang.init()
- lang.__("Hello :name", { name: "Ali" })
+ import { __ } from "@javaabu/i18n"
+ __("Hello :name", { name: "Ali" })
```

If you keep the `lang:js` script, nothing else changes. To stop shipping `Lang.js` with it, export JSON instead:

```bash
php artisan lang:js --json public/messages.json
```

```js
configure({ loader: "/messages.json" })
```

Differences to check:

- **JSON lines don't fall back.** With `Lang.js`, a line from `en.json` could show up in another locale if a fallback was set. Here it matches Laravel: you get the key.
- **Plurals follow Laravel's rules**, rather than `Lang.js`'s. See [Pluralization](./basic-usage/pluralization).

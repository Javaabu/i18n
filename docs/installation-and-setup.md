---
title: Installation & Setup
sidebar_position: 1.2
---

# Installation

```bash
pnpm add @javaabu/i18n
```

Tell it where the translations are, then use the helpers anywhere:

```js
import { __, trans_choice, configure } from "@javaabu/i18n"

configure({ loader: (locale) => import(`../../lang/${locale}.json`) })

__("Welcome, :name!", { name: "Ali" })
trans_choice("messages.apples", 3)
```

The locale comes from the page, so a Laravel layout's `<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">` is all it needs. See [Locale and direction](./basic-usage/locale-and-direction).

If the page already includes a Laravel JS Localization script, you can leave out `configure()`: `window.Lang` is picked up automatically. See [Loading translations](./basic-usage/loading-translations).

Next, see how to use it with [React](./frameworks/react), [Vue](./frameworks/vue), [jQuery](./frameworks/jquery) or [vanilla JS](./frameworks/vanilla-js).

# Without a bundler

The `dist` folder has a ready-made build. It puts `__`, `trans` and `trans_choice` on `window`, the rest of the API on `window.I18n`, and the helpers on `$` if jQuery has already loaded.

```html
<script src="https://unpkg.com/@javaabu/i18n/dist/i18n.iife.js"></script>
<script>
  I18n.load({ dv: { Message: "މެސެޖު" } })

  console.log(__("Message"))
</script>
```

# Examples

The [`examples`](https://github.com/Javaabu/i18n/tree/main/examples) folder has a small Dhivehi and English page for each integration. Run them with `pnpm install && pnpm examples`.

`examples/script-tag.html` needs no build step or server: run `pnpm build`, then open the file.

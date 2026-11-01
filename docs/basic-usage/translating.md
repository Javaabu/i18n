---
title: Translating text
sidebar_position: 1
---

These work like their Laravel counterparts.

```js
import { __, trans, has } from "@javaabu/i18n"

__("Welcome, :name!", { name: "Ali" })
trans("messages.welcome")
__("messages.welcome", {}, "dv") // a specific locale
has("messages.welcome")
```

`__()` and `trans()` are the same, apart from what they do without a key: `__()` returns `null` and `trans()` returns the translator.

# Lookups

A key is looked up in this order:

1. A JSON line, like `"Hello"` in `lang/dv.json`, for the current locale.
2. A language file line, like `hello` in `lang/dv/messages.php`, for the current locale.
3. The same language file line for the fallback locale.

When nothing is found you get the key back, with replacements made. So `__("Hello, :name", { name: "Ali" })` gives `Hello, Ali` even with no translations loaded.

:::note

JSON lines don't fall back, in Laravel or here. If `Hello` is only in `en.json`, `__("Hello")` in `dv` returns `Hello`. Language file lines (`messages.hello`) do fall back.

:::

These key styles all work:

```js
__("messages.nested.line")
__("dir/file.line") // lang/en/dir/file.php
__("package::file.line") // vendor packages
```

A key that points at a group returns the whole group. TypeScript assumes a string, so say when you expect a group:

```ts
import { __, type Messages } from "@javaabu/i18n"

const messages = __<Messages>("messages")
```

# Replacements

The case of the placeholder sets the case of the value:

```js
__("Welcome, :name", { name: "ali" }) // Welcome, ali
__("Welcome, :Name", { name: "ali" }) // Welcome, Ali
__("Welcome, :NAME", { name: "ali" }) // Welcome, ALI
```

A function handles a pair of tags:

```js
__("Read the <link>terms</link>", { link: (text) => `<a href="/terms">${text}</a>` })
```

:::caution

As in Laravel, the result isn't escaped. Escape anything you insert before putting the result in `innerHTML`, `v-html` or `dangerouslySetInnerHTML`.

:::

# Missing keys

To log keys that have no translation, or show something else for them:

```js
import { translator } from "@javaabu/i18n"

translator.handleMissingKeysUsing((key, replace, locale) => {
  console.warn(`No ${locale} translation for ${key}`)
})
```

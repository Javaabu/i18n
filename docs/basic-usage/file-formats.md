---
title: File formats
sidebar_position: 5
---

`load()` takes an object or the text of a file, and loaders can return either.

| Input                    | Example                                                   | Notes                                           |
| ------------------------ | --------------------------------------------------------- | ----------------------------------------------- |
| Laravel JS Localization  | `{ "en.messages": { … }, "en.strings": { … } }`           | `Lang.js` and `lang:js --json`                  |
| By locale                | `{ en: { messages: { … } }, dv: { … } }`                  |                                                 |
| One locale               | `{ "Hello": "…", messages: { welcome: "…" } }`            | Top level strings act like `lang/{locale}.json` |
| Flat JSON                | `{ "messages.welcome": "…" }`                             | `laravel-vue-i18n`, i18next's flat files        |
| Gettext (`po`)           | `msgid "Hello"` / `msgstr "…"`                            | Reads `Language:`; plurals become `one\|many`   |
| XLIFF 1.2, 2.x (`xliff`) | `<trans-unit id="…"><source>…</source><target>…</target>` | Reads `target-language` / `trgLang`             |
| Java (`properties`)      | `messages.welcome = …`                                    | Dotted keys are groups                          |
| Flutter (`arb`)          | `{ "@@locale": "dv", "hello": "Hi {name}" }`              | Reads `@@locale`; `{name}` becomes `:name`      |

Without a `format` option, text is recognised from its content, and URLs from their extension.

# Saying which locale

Pass `{ locale }` when you know it:

```js
load(lines, { locale: "dv" })
```

Without it, an object whose top level keys all look like locales with objects inside (`{ en: {…}, dv: {…} }`) is read as "by locale", and anything else goes to the current locale. So a one-locale file with only short group names (`{ ui: {…} }`) needs the option.

# Placeholders

Placeholders are always Laravel's `:name`. Apart from ARB, formats with other placeholder syntax are loaded as written. ICU and gettext plural _expressions_ aren't evaluated.

# Gettext

Fuzzy and untranslated entries are skipped, as `msgfmt` does. An entry with `msgctxt` gets the key `context.msgid`.

# XLIFF

The key is the unit's `resname` or `name`, then its `id` unless that's just a number, then its source text. Inline tags such as `<g>` are removed, keeping their text. A unit with no target uses its source.

# Other formats

Add any format with a parser. The name is also the file extension loaders recognise:

```js
import { registerFormat, configure } from "@javaabu/i18n"
import YAML from "js-yaml"

registerFormat("yaml", (text) => ({ messages: YAML.load(text) }))
configure({ loader: "/lang/{locale}.yaml" })
```

A parser can also return the `locale` a file says it's for. An explicit `locale` option wins over it.

---
title: Locale and direction
sidebar_position: 3
---

# Detecting the locale

Without a `locale` option, the first of these wins:

1. `<meta name="locale" content="dv">`
2. `<meta http-equiv="content-language" content="dv">`
3. `<html lang="dv">`
4. `<meta property="og:locale" content="dv">`
5. `en`

`en-GB` and `en_GB` are the same locale. Detection runs the first time it's needed, so the tags can come after the script.

# Fallback locale

The fallback is `en`, as in a new Laravel app. To change it, add a tag or set the option. `null` turns it off.

```html
<meta name="fallback-locale" content="{{ config('app.fallback_locale') }}" />
```

```js
configure({ fallback: "en" })
```

# Switching

```js
import { getLocale, setLocale, ready, subscribe } from "@javaabu/i18n"

setLocale("dv") // switches right away
await ready() // waits for a loader to fetch its lines

const stop = subscribe(() => console.log(getLocale())) // on any locale or line change
```

The React and Vue integrations re-render by themselves.

# Text direction

The package knows which locales are right to left, including `dv`:

```js
import { getDirection, isRtl } from "@javaabu/i18n"

getDirection() // "rtl" for dv
getDirection("en") // "ltr"
isRtl("dv-MV") // true
```

To keep `lang` and `dir` on `<html>` in step when the locale changes:

```js
import { subscribe, syncDocument } from "@javaabu/i18n"

subscribe(syncDocument)
```

The package doesn't touch `<html>` unless you ask it to, as Laravel usually renders those attributes already.

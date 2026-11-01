---
title: Differences from Laravel
sidebar_position: 1.33
---

Everything here only adds behaviour for cases Laravel's translator never sees. For anything Laravel handles, the output is the same, and the tests check that against the real translator.

- **Regional locales find their language.** `dv-MV` uses `dv` lines and `en-XX` uses English plural rules, because `<html lang>` values are often more specific than the language folders.
- **`strings` is searched for bare keys.** `lang:js` turns `lang/en.json` into a `strings` group, so `__("Hello")` looks there too.
- **`pluralRules`** is an addition, for languages Laravel's table doesn't cover. See [Pluralization](./basic-usage/pluralization#dhivehi).
- **Replacement values follow JS types.** A `Date` or anything else without a `value` property is converted with `String()`. An object with a `value` property is treated like a PHP backed enum.

`stringable()` and `determineLocalesUsing()` from Laravel's `Translator` aren't included.

---
"@javaabu/i18n": patch
---

`configure({ locale })` and `configure({ fallback })`, including the Vue plugin's options, now tell subscribers and fetch the new locale with the loader, like `setLocale()` and `setFallback()`. Replacing the loader while a fetch is in flight now asks the new loader, and whatever the old one returns is ignored.

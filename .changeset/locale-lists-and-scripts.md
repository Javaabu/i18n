---
"@javaabu/i18n": patch
---

Locale detection takes the first locale of a list such as `<meta http-equiv="content-language" content="dv, en">`, and `normalizeLocale()` does the same for `en-US,en;q=0.9`. A locale with a script and region (`zh-Hant-TW`) now finds lines loaded for the script (`zh_Hant`) before the language (`zh`).

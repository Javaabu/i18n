---
"@javaabu/i18n": patch
---

Gettext files: an empty `Language:` header no longer takes the next header as the locale, and entries that aren't separated by blank lines are all read instead of only the last one.

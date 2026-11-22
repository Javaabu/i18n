---
"@javaabu/i18n": patch
---

`trans_choice()` trims a matched form the way PHP's `trim()` does, keeping non-breaking and other Unicode spaces, as Laravel does.

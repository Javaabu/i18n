---
"@javaabu/i18n": patch
---

Sturdier with untrusted input: an XLIFF character reference outside Unicode (`&#99999999;`) is kept as written instead of failing the whole file; JSON is only sniffed as ARB when it has `@@locale` or an `@key` metadata object next to `key`, so a Laravel JSON file with a key like `@handle` keeps its groups and `{x}` text; and a malformed `data-trans-replace` is logged and ignored instead of stopping `translateDom()` partway through the page.

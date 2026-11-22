---
"@javaabu/i18n": patch
---

Lists in language files (`'days' => ['އާދީއްތަ', 'ހޯމަ']`) can be returned whole, with replacements made in every item, and their items read by index (`messages.days.0`), as in Laravel. An empty list falls back, and loaded lists and groups are copied rather than shared with the caller.

---
title: Pluralization
sidebar_position: 2
---

`trans_choice()` picks a form from a line separated by `|`. `transChoice` is the same function.

```js
// "messages.apples": "There is one apple|There are many apples"
trans_choice("messages.apples", 1) // There is one apple
trans_choice("messages.apples", 5) // There are many apples
```

Ranges say exactly which number gets which form, in any language:

```js
// "messages.unread": "{0} No new messages|{1} One new message|[2,*] :count new messages"
trans_choice("messages.unread", 25) // 25 new messages
```

`:count` is filled in for you. Arrays, Sets and Maps are counted:

```js
trans_choice("messages.unread", messages)
```

# Dhivehi

Laravel's plural table has no entry for Dhivehi, so a plain `one|many` line always takes the first form: `trans_choice("one|many", 5)` is `one` in `dv`, on the server and here.

There are two ways to get both forms.

**Ranges (recommended)** work the same on the server and in the browser, with no setup:

```json
{ "messages.unread": "{0} އައު މެސެޖެއް ނެތް|{1} އައު މެސެޖެއް|[2,*] :count އައު މެސެޖު" }
```

**A plural rule** applies to every `one|many` line:

```js
import { configure, dhivehiPluralRule } from "@javaabu/i18n"

configure({ pluralRules: { dv: dhivehiPluralRule } })
```

:::caution

A plural rule here doesn't change Laravel. If the same line is also rendered on the server, the two will disagree unless you add the same rule there.

:::

`pluralRules` works for any locale. A rule takes the number and returns the index of the form to use.

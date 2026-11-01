---
title: Vanilla JS
sidebar_position: 4
---

Import the helpers:

```js
import { __ } from "@javaabu/i18n"

__("Message")
```

Or install them on `window`, which the [script tag](../installation-and-setup#without-a-bundler) does by itself:

```js
import "@javaabu/i18n/global"

__("Message")
```

# Translating markup

Add attributes to your HTML and call `translatePage()`. It can take an element to only translate part of the page.

```html
<h1 data-trans="messages.welcome" data-trans-replace='{"name":"Ali"}'></h1>
<input data-trans-attr-placeholder="Search" />
<p data-trans="messages.apples" data-trans-count="3"></p>
```

```js
import { translatePage, subscribe } from "@javaabu/i18n"

translatePage()
subscribe(() => translatePage())
```

| Attribute            | What it does                                 |
| -------------------- | -------------------------------------------- |
| `data-trans`         | The key for the element's text               |
| `data-trans-attr-*`  | The key for an attribute, like `placeholder` |
| `data-trans-replace` | Placeholder values, as JSON                  |
| `data-trans-count`   | Uses `trans_choice()` with this number       |

It sets text, never HTML, and keeps the attributes so it can run again after a locale change.

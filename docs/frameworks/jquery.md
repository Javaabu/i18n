---
title: jQuery
sidebar_position: 3
---

```js
import $ from "jquery"
import { installJQuery } from "@javaabu/i18n/jquery"

installJQuery($)

$.__("Message")
$.trans("Message")
$.trans_choice("messages.apples", 3)
$.i18n.setLocale("dv") // the translator
```

With the [script tag](../installation-and-setup#without-a-bundler), this happens by itself if jQuery loads first. If it loads later, call `I18n.installJQuery(jQuery)`.

`$(el).translate()` translates the [translation attributes](./vanilla-js#translating-markup) in the matched elements and everything inside them:

```js
$("#contact-form").translate()
```

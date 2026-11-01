---
title: Introduction
sidebar_position: 1.0
---

# i18n

[i18n](https://github.com/Javaabu/i18n) gives JavaScript the same `__()`, `trans()` and `trans_choice()` functions that Laravel has, with the same arguments and the same output. It works with React, Vue, jQuery and vanilla JS.

```vue
<Forms.Text name="message" :label="__('Message')" />
```

- **The same as Laravel.** JSON and group lookups, fallbacks, `:name` / `:Name` / `:NAME` placeholders, `<tag>` callbacks, and pluralization for every locale in Laravel's table. The tests compare against output from the real `Illuminate\Translation\Translator`.
- **Finds the locale itself** from the page head and `<html lang>`, and knows the text direction, including for Dhivehi.
- **Loads your existing translations:** the [Laravel JS Localization](https://github.com/rmariuzzo/Laravel-JS-Localization) format (including a `window.Lang` already on the page), JSON, gettext `.po`, XLIFF, `.properties`, ARB, and anything else through `registerFormat()`.
- **No dependencies.** About 5.6 kB gzipped.

Using an AI coding assistant? See [AI assistants](./ai-assistants).

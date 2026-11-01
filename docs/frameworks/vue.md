---
title: Vue
sidebar_position: 2
---

```js
import { createApp } from "vue"
import { i18n } from "@javaabu/i18n/vue"

createApp(App)
  .use(i18n, { loader: (locale) => import(`../../lang/${locale}.json`) })
  .mount("#app")
```

`__()`, `trans()`, `trans_choice()` and `transChoice()` are then in every template, and update when the locale changes:

```vue
<Forms.Text name="message" :label="__('Message')" />
```

In `<script setup>` and composables:

```vue
<script setup>
import { useTranslation } from "@javaabu/i18n/vue"

const { __, locale, direction, setLocale } = useTranslation()
</script>
```

The plugin's options are the same as `configure()`, plus `translator` to pass your own instance (one per request when rendering on the server). The translator itself is also available in templates as `$i18n`.

# Templates compiled in the browser

In-DOM templates and the `template` option work too, but in development Vue logs a warning that `__` starts with a reserved prefix. Use `trans()` there to avoid it. Templates in `.vue` files don't have this.

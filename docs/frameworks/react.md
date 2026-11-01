---
title: React
sidebar_position: 1
---

Import `__` directly when the locale never changes after the page loads. Use the hook when it can, so components re-render:

```jsx
import { useTranslation } from "@javaabu/i18n/react"

function ContactForm() {
  const { __, trans_choice, locale, direction, setLocale } = useTranslation()

  return (
    <form dir={direction}>
      <Forms.Text name="message" label={__("Message")} />
    </form>
  )
}
```

The functions get a new identity on a change, so `useMemo` and `memo()` that depend on them update too.

# Inertia

Share the locale and translations from Laravel, and keep them in sync with the page:

```jsx
import { load, setLocale } from "@javaabu/i18n"
import { usePage } from "@inertiajs/react"
import { useEffect } from "react"

const { locale, translations } = usePage().props

useEffect(() => {
  load(translations, { locale })
  setLocale(locale)
}, [locale, translations])
```

# Server rendering

Give each request its own translator so requests don't share a locale:

```jsx
import { createTranslator } from "@javaabu/i18n"
import { I18nProvider } from "@javaabu/i18n/react"

const translator = createTranslator({ locale, messages })

renderToString(
  <I18nProvider translator={translator}>
    <App />
  </I18nProvider>,
)
```

Components under the provider have to use the hook. The directly imported `__` always uses the shared translator.

import { computed, hasInjectionContext, inject, shallowRef, type App, type ComputedRef, type ShallowRef } from "vue"
import { translator as defaultTranslator } from "./default-translator.js"
import type { Translator } from "./translator.js"
import type { TranslatorOptions } from "./types.js"
import "./global-types.js"

const I18N_KEY = Symbol("javaabu-i18n")

export interface I18nPluginOptions extends TranslatorOptions {
  /** Use your own instance, e.g. one per request when rendering on the server. */
  translator?: Translator
}

export interface UseTranslation {
  __: Translator["__"]
  trans: Translator["trans"]
  trans_choice: Translator["trans_choice"]
  transChoice: Translator["trans_choice"]
  has: Translator["has"]
  locale: ComputedRef<string>
  direction: ComputedRef<"rtl" | "ltr">
  setLocale: Translator["setLocale"]
  translator: Translator
}

const versions = new WeakMap<Translator, ShallowRef<number>>()

/** A ref that changes with the translator, so whatever reads a translation in a render or computed follows along. */
function versionOf(translator: Translator): ShallowRef<number> {
  let version = versions.get(translator)

  if (!version) {
    const created = shallowRef(translator.getVersion())

    translator.subscribe(() => {
      created.value = translator.getVersion()
    })
    versions.set(translator, created)
    version = created
  }

  return version
}

function helpersFor(translator: Translator): UseTranslation {
  const version = versionOf(translator)
  const track = () => version.value

  const __ = ((...args: Parameters<Translator["__"]>) => {
    track()

    return translator.__(...args)
  }) as Translator["__"]
  const trans = ((...args: Parameters<Translator["trans"]>) => {
    track()

    return translator.trans(...args)
  }) as Translator["trans"]
  const trans_choice: Translator["trans_choice"] = (...args) => {
    track()

    return translator.trans_choice(...args)
  }
  const has: Translator["has"] = (...args) => {
    track()

    return translator.has(...args)
  }

  return {
    __,
    trans,
    trans_choice,
    transChoice: trans_choice,
    has,
    locale: computed(() => {
      track()

      return translator.getLocale()
    }),
    direction: computed(() => {
      track()

      return translator.getDirection()
    }),
    setLocale: translator.setLocale,
    translator,
  }
}

/** `app.use(i18n, options)`: adds `__()`, `trans()` and `trans_choice()` to every template, updating on a locale change. */
export const i18n = {
  install(app: App, options: I18nPluginOptions = {}): void {
    const { translator = defaultTranslator, ...config } = options

    translator.configure(config)

    const helpers = helpersFor(translator)
    const properties = app.config.globalProperties as unknown as Record<string, unknown>

    properties.__ = helpers.__
    properties.trans = helpers.trans
    properties.trans_choice = helpers.trans_choice
    properties.transChoice = helpers.trans_choice
    properties.$i18n = translator

    // Templates compiled in the browser (in-DOM ones) skip the component for names starting with `_` and look `__` up
    // as a global instead, so it has to be there too. Build-time templates and the server only use the property above.
    if (typeof window !== "undefined") window.__ = helpers.__

    app.provide(I18N_KEY, translator)
  },
}

/** The helpers for `<script setup>` and composables. */
export function useTranslation(): UseTranslation {
  const translator = hasInjectionContext() ? inject<Translator>(I18N_KEY, defaultTranslator) : defaultTranslator

  return helpersFor(translator)
}

declare module "vue" {
  interface ComponentCustomProperties {
    __: Translator["__"]
    trans: Translator["trans"]
    trans_choice: Translator["trans_choice"]
    transChoice: Translator["trans_choice"]
    $i18n: Translator
  }
}

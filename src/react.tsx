import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react"
import { translator as defaultTranslator } from "./default-translator.js"
import type { Translator } from "./translator.js"

const I18nContext = createContext<Translator | null>(null)

export interface I18nProviderProps {
  /** Use your own instance, e.g. one per request when rendering on the server. */
  translator: Translator
  children?: ReactNode
}

export function I18nProvider({ translator, children }: I18nProviderProps) {
  return <I18nContext.Provider value={translator}>{children}</I18nContext.Provider>
}

export interface UseTranslation {
  __: Translator["__"]
  trans: Translator["trans"]
  trans_choice: Translator["trans_choice"]
  transChoice: Translator["trans_choice"]
  has: Translator["has"]
  locale: string
  direction: "rtl" | "ltr"
  setLocale: Translator["setLocale"]
  translator: Translator
}

/**
 * The translation helpers, re-rendering the component when the locale or the lines change. The functions get a new
 * identity on a change, so `useMemo` and `memo()` that depend on them update too.
 */
export function useTranslation(): UseTranslation {
  const translator = useContext(I18nContext) ?? defaultTranslator
  const version = useSyncExternalStore(translator.subscribe, translator.getVersion, translator.getVersion)

  return useMemo(() => {
    const __ = ((...args: Parameters<Translator["__"]>) => translator.__(...args)) as Translator["__"]
    const trans = ((...args: Parameters<Translator["trans"]>) => translator.trans(...args)) as Translator["trans"]
    const trans_choice: Translator["trans_choice"] = (...args) => translator.trans_choice(...args)

    return {
      __,
      trans,
      trans_choice,
      transChoice: trans_choice,
      has: translator.has,
      locale: translator.getLocale(),
      direction: translator.getDirection(),
      setLocale: translator.setLocale,
      translator,
    }
    // `version` is what makes the helpers new when the translator changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translator, version])
}

import { translator } from "./default-translator.js"
import { translateDom } from "./dom.js"
import type { TranslatorOptions } from "./types.js"

export { translator }
export { createTranslator, makeReplacements, Translator } from "./translator.js"
export { detectFallbackLocale, detectLocale, isRtlLocale, normalizeLocale } from "./locale.js"
export { chooseMessage, dhivehiPluralRule, getPluralIndex } from "./message-selector.js"
export { registerFormat } from "./formats.js"
export type { FormatParser, ParsedFile } from "./formats.js"
export type {
  Countable,
  Loader,
  LoadOptions,
  Messages,
  MissingKeyHandler,
  PluralRule,
  Replacements,
  Translation,
  TranslatorOptions,
} from "./types.js"

export const __ = translator.__
export const trans = translator.trans
export const trans_choice = translator.trans_choice
export const transChoice = translator.transChoice

export const load = translator.load
export const addLines = translator.addLines
export const has = translator.has
export const getLocale = translator.getLocale
export const setLocale = translator.setLocale
export const getFallback = translator.getFallback
export const setFallback = translator.setFallback
export const getDirection = translator.getDirection
export const isRtl = translator.isRtl
export const ready = translator.ready
export const subscribe = translator.subscribe

export function configure(options: TranslatorOptions): typeof translator {
  return translator.configure(options)
}

/** Translates the `data-trans` attributes in a part of the page, the whole document by default. */
export function translatePage(root: ParentNode = document): void {
  translateDom(root, translator)
}

/** Sets `lang` and `dir` on `<html>` to the current locale, e.g. with `subscribe(syncDocument)` so RTL follows along. */
export function syncDocument(): void {
  document.documentElement.lang = translator.getLocale().replace(/_/g, "-")
  document.documentElement.dir = translator.getDirection()
}

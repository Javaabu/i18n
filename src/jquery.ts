import { translator as defaultTranslator } from "./default-translator.js"
import { translateDom } from "./dom.js"
import type { Translator } from "./translator.js"

/** The parts of jQuery used here, so this works with any version and doesn't depend on `@types/jquery`. */
interface JQueryLike {
  fn: Record<string, unknown>
  [key: string]: unknown
}

/** Adds `$.__()`, `$.trans()`, `$.trans_choice()`, `$.i18n` and `$(el).translate()`. Returns `$`. */
export function installJQuery<T extends object>($: T, translator: Translator = defaultTranslator): T {
  const jq = $ as unknown as JQueryLike

  jq.__ = translator.__
  jq.trans = translator.trans
  jq.trans_choice = translator.trans_choice
  jq.transChoice = translator.trans_choice
  jq.i18n = translator
  jq.fn.translate = function (this: Iterable<Element> & { each(fn: (this: Element) => void): unknown }) {
    return this.each(function () {
      translateDom(this, translator)
    })
  }

  return $
}

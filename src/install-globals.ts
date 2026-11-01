import { translator } from "./default-translator.js"
import "./global-types.js"
import { installJQuery } from "./jquery.js"

/** Puts the helpers on `window`, and on jQuery if it has already loaded. */
export function installGlobals(): void {
  globalThis.__ = translator.__
  globalThis.trans = translator.trans
  globalThis.trans_choice = translator.trans_choice
  globalThis.transChoice = translator.trans_choice

  const jQuery = (globalThis as { jQuery?: object }).jQuery

  if (jQuery) installJQuery(jQuery)
}

import type { Translator } from "./translator.js"

declare global {
  var __: Translator["__"]
  var trans: Translator["trans"]
  var trans_choice: Translator["trans_choice"]
  var transChoice: Translator["trans_choice"]
}

export {}

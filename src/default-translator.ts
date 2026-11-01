import { Translator } from "./translator.js"

/** The translator behind the imported `__()` and `trans()`, shared by every binding in a page. */
export const translator = new Translator().useGlobalLang()

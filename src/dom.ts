import type { Translator } from "./translator.js"
import type { Replacements } from "./types.js"

const ATTRIBUTE_PREFIX = "data-trans-attr-"

function translation(element: Element, key: string, translator: Translator): string | undefined {
  const rawReplace = element.getAttribute("data-trans-replace")
  const rawCount = element.getAttribute("data-trans-count")
  const replace = (rawReplace ? JSON.parse(rawReplace) : {}) as Replacements

  if (rawCount !== null) return translator.choice(key, Number(rawCount), replace)

  const line = translator.get(key, replace)

  return typeof line === "string" ? line : undefined
}

function translateElement(element: Element, translator: Translator): void {
  const key = element.getAttribute("data-trans")

  if (key) {
    const line = translation(element, key, translator)

    if (line !== undefined) element.textContent = line
  }

  for (const { name, value } of [...element.attributes]) {
    if (!name.startsWith(ATTRIBUTE_PREFIX)) continue

    const line = translation(element, value, translator)

    if (line !== undefined) element.setAttribute(name.slice(ATTRIBUTE_PREFIX.length), line)
  }
}

/**
 * Translates an element and everything in it, driven by attributes. Sets text only, never HTML, and keeps the attributes
 * so it can run again after a locale change:
 *
 * - `data-trans="messages.welcome"`: the text
 * - `data-trans-attr-placeholder="Search"`: an attribute
 * - `data-trans-replace='{"name":"Ali"}'`: placeholder values
 * - `data-trans-count="3"`: use `trans_choice()`
 */
export function translateDom(root: ParentNode, translator: Translator): void {
  if (root instanceof Element) translateElement(root, translator)

  for (const element of root.querySelectorAll("*")) {
    if (
      element.hasAttribute("data-trans") ||
      [...element.attributes].some((a) => a.name.startsWith(ATTRIBUTE_PREFIX))
    ) {
      translateElement(element, translator)
    }
  }
}

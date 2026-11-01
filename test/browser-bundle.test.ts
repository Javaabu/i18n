import { readFileSync } from "node:fs"
import { JSDOM } from "jsdom"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")

/** The built bundle in a page, next to the real jQuery and what a `php artisan lang:js` script sets up with Lang.js. */
function page() {
  const { window } = new JSDOM(
    `<!doctype html><html lang="dv-MV"><body>
      <input id="search" data-trans-attr-placeholder="Search">
      <p id="hi" data-trans="messages.hi" data-trans-replace='{"name":"Ali"}'></p>
    </body></html>`,
    { runScripts: "outside-only" },
  )

  window.eval(read("node_modules/jquery/dist/jquery.min.js"))
  window.eval(read("node_modules/lang.js/dist/lang.min.js"))
  window.eval(`
    window.Lang = new Lang()
    Lang.setMessages({
      "dv.messages": { hi: "ހައި :name", n: "އެއް|ގިނަ" },
      "dv.strings": { Search: "ހޯދާ", Save: "ސޭވް" },
    })
  `)
  window.eval(read("dist/i18n.iife.js"))

  return window
}

describe("the <script> bundle", () => {
  const window = page()

  it("detects the locale and direction", () => {
    expect(window.eval(`I18n.getLocale()`)).toBe("dv_MV")
    expect(window.eval(`I18n.getDirection()`)).toBe("rtl")
  })

  it("installs the helpers on window, reading window.Lang", () => {
    expect(window.eval(`__("messages.hi", { name: "ali" })`)).toBe("ހައި ali")
    expect(window.eval(`trans("Save")`)).toBe("ސޭވް")
    expect(window.eval(`trans("Nope :a", { a: 1 })`)).toBe("Nope 1")
    expect(window.eval(`trans_choice("messages.n", 1)`)).toBe("އެއް")
  })

  it("installs the helpers on jQuery", () => {
    expect(window.eval(`$.__("Save")`)).toBe("ސޭވް")

    window.eval(`$("body").translate()`)

    expect(window.document.querySelector("#search")?.getAttribute("placeholder")).toBe("ހޯދާ")
    expect(window.document.querySelector("#hi")?.textContent).toBe("ހައި Ali")
  })
})

import $ from "jquery"
import { translator as defaultTranslator } from "./default-translator"
import { translateDom } from "./dom"
import { installJQuery } from "./jquery"
import { Translator } from "./translator"

const messages = {
  en: { Search: "Search", "Hi :name": "Hi :name", apples: { n: "one|many" }, group: { a: "A" } },
  dv: { Search: "ހޯދާ", "Hi :name": "ހައި :name", apples: { n: "އެއް|ގިނަ" } },
}

describe("jQuery", () => {
  it("adds the helpers to $", () => {
    const translator = new Translator({ locale: "dv", messages })

    expect(installJQuery($, translator)).toBe($)

    const jq = $ as unknown as Translator & { i18n: Translator }

    expect(jq.__("Search")).toBe("ހޯދާ")
    expect(jq.trans("Search")).toBe("ހޯދާ")
    expect(jq.trans_choice("apples.n", 1)).toBe("އެއް")
    expect(jq.i18n).toBe(translator)
  })

  it("$(el).translate() translates the matched elements and what's in them", () => {
    const translator = new Translator({ locale: "dv", messages })

    installJQuery($, translator)

    const root = $(`<div data-trans="Search"></div><section><input data-trans-attr-placeholder="Search"></section>`)
    const result = (root as unknown as { translate(): unknown }).translate()

    expect(result).toBe(root)
    expect(root.eq(0).text()).toBe("ހޯދާ")
    expect(root.find("input").attr("placeholder")).toBe("ހޯދާ")
  })

  it("defaults to the shared translator", () => {
    installJQuery($)

    expect(($ as unknown as { i18n: Translator }).i18n).toBe(defaultTranslator)
  })
})

describe("translateDom", () => {
  function fixture(html: string) {
    const root = document.createElement("div")

    root.innerHTML = html

    return root
  }

  it("handles text, attributes, replacements and counts", () => {
    const root = fixture(`
      <p id="text" data-trans="Search"></p>
      <input id="attr" data-trans-attr-placeholder="Search" data-trans-attr-title="Search">
      <p id="replace" data-trans="Hi :name" data-trans-replace='{"name":"Ali"}'></p>
      <p id="count" data-trans="apples.n" data-trans-count="2"></p>
      <p id="group" data-trans="group">untouched</p>
    `)
    const t = new Translator({ locale: "en", messages })

    translateDom(root, t)

    expect(root.querySelector("#text")?.textContent).toBe("Search")
    expect(root.querySelector("#attr")?.getAttribute("placeholder")).toBe("Search")
    expect(root.querySelector("#attr")?.getAttribute("title")).toBe("Search")
    expect(root.querySelector("#replace")?.textContent).toBe("Hi Ali")
    expect(root.querySelector("#count")?.textContent).toBe("many")
    expect(root.querySelector("#group")?.textContent).toBe("untouched")

    t.setLocale("dv")
    translateDom(root, t)

    expect(root.querySelector("#text")?.textContent).toBe("ހޯދާ")
    expect(root.querySelector("#count")?.textContent).toBe("އެއް")
  })

  it("never writes HTML", () => {
    const root = fixture(`<p data-trans="x"></p>`)

    translateDom(root, new Translator({ locale: "en", messages: { en: { x: "<img src=x onerror=alert(1)>" } } }))

    expect(root.querySelector("img")).toBeNull()
    expect(root.querySelector("p")?.textContent).toBe("<img src=x onerror=alert(1)>")
  })
})

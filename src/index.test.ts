import { dhivehiPluralRule, getDirection, load, setLocale, subscribe, syncDocument, trans_choice, __ } from "./index"
import { Translator } from "./translator"

afterEach(() => {
  setLocale("en")
  document.documentElement.removeAttribute("lang")
  document.documentElement.removeAttribute("dir")
})

describe("Dhivehi", () => {
  it("translates with Thaana lines, placeholders and right to left direction", () => {
    load({ "މަރުޙަބާ، :name": "މަރުޙަބާ، :name!" }, { locale: "dv" })
    setLocale("dv-MV")

    expect(__("މަރުޙަބާ، :name", { name: "ޢަލީ" })).toBe("މަރުޙަބާ، ޢަލީ!")
    expect(getDirection()).toBe("rtl")
  })

  it("sets lang and dir on the page when told to, following locale changes", () => {
    const stop = subscribe(syncDocument)

    setLocale("dv-MV")

    expect(document.documentElement.lang).toBe("dv-MV")
    expect(document.documentElement.dir).toBe("rtl")

    setLocale("en")

    expect(document.documentElement.dir).toBe("ltr")

    stop()
  })

  it("takes the first plural form like Laravel, unless given the Dhivehi rule", () => {
    const messages = { dv: { apples: { n: "އެއް އާފަލު|:count އާފަލު" } } }
    const withRule = new Translator({ locale: "dv", messages, pluralRules: { dv: dhivehiPluralRule } })

    load(messages)

    expect(trans_choice("apples.n", 5, {}, "dv")).toBe("އެއް އާފަލު")
    expect(withRule.trans_choice("apples.n", 1)).toBe("އެއް އާފަލު")
    expect(withRule.trans_choice("apples.n", 5)).toBe("5 އާފަލު")
  })
})

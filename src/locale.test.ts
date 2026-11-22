import { detectFallbackLocale, detectLocale, isRtlLocale, localeChain, normalizeLocale } from "./locale"
import { Translator } from "./translator"

afterEach(() => {
  document.documentElement.removeAttribute("lang")
  document.head.innerHTML = ""
})

describe("normalizeLocale", () => {
  it.each([
    ["en", "en"],
    ["EN", "en"],
    ["en-GB", "en_GB"],
    ["en_gb", "en_GB"],
    ["pt-br", "pt_BR"],
    ["zh-hant-tw", "zh_Hant_TW"],
    ["es-419", "es_419"],
    ["dv, en", "dv"],
    ["en-US,en;q=0.9", "en_US"],
    ["dv-MV;q=0.8", "dv_MV"],
    [" , dv", "dv"],
  ])("%s becomes %s", (input, expected) => {
    expect(normalizeLocale(input)).toBe(expected)
  })
})

describe("localeChain", () => {
  it.each([
    ["dv", ["dv"]],
    ["dv_MV", ["dv_MV", "dv"]],
    ["zh_Hant_TW", ["zh_Hant_TW", "zh_Hant", "zh"]],
  ])("%s looks in %j", (locale, expected) => {
    expect(localeChain(locale)).toEqual(expected)
  })
})

describe("detectLocale", () => {
  it("reads <html lang>", () => {
    document.documentElement.lang = "dv"

    expect(detectLocale()).toBe("dv")
  })

  it("normalizes what Laravel's layout writes", () => {
    document.documentElement.lang = "en-GB"

    expect(detectLocale()).toBe("en_GB")
  })

  it("prefers the meta tags in the head", () => {
    document.documentElement.lang = "en"
    document.head.innerHTML =
      '<meta http-equiv="Content-Language" content="fr"><meta property="og:locale" content="de">'

    expect(detectLocale()).toBe("fr")

    document.head.insertAdjacentHTML("beforeend", '<meta name="locale" content="dv">')

    expect(detectLocale()).toBe("dv")
  })

  it("takes the first locale of a content-language list", () => {
    document.head.innerHTML = '<meta http-equiv="content-language" content="dv-MV, en">'

    expect(detectLocale()).toBe("dv_MV")
  })

  it("falls back on og:locale", () => {
    document.head.innerHTML = '<meta property="og:locale" content="dv_MV">'

    expect(detectLocale()).toBe("dv_MV")
  })

  it("ignores empty values", () => {
    document.documentElement.lang = " "
    document.head.innerHTML = '<meta name="locale" content="">'

    expect(detectLocale()).toBeUndefined()
  })

  it("reads the fallback locale from a meta tag", () => {
    expect(detectFallbackLocale()).toBeUndefined()

    document.head.innerHTML = '<meta name="fallback-locale" content="en-GB">'

    expect(detectFallbackLocale()).toBe("en_GB")
  })
})

describe("Translator", () => {
  it("uses the page's locale when it isn't told one", () => {
    document.documentElement.lang = "dv"
    document.head.innerHTML = '<meta name="fallback-locale" content="fr">'

    const t = new Translator()

    expect(t.getLocale()).toBe("dv")
    expect(t.getFallback()).toBe("fr")
  })

  it("defaults to en without any hints, and detects as late as its first use", () => {
    const t = new Translator()

    document.documentElement.lang = "dv"

    expect(t.getLocale()).toBe("dv")
    expect(new Translator({ locale: "en" }).getFallback()).toBe("en")
  })

  it("finds lines for the script from a locale with a script and region", () => {
    document.documentElement.lang = "zh-Hant-TW"

    const t = new Translator({ fallback: null, messages: { zh_Hant: { Hi: "你好" }, zh: { messages: { hi: "嗨" } } } })

    expect(t.__("Hi")).toBe("你好")
    expect(t.__("messages.hi")).toBe("嗨")
  })

  it("doesn't need a document", () => {
    vi.stubGlobal("document", undefined)

    const t = new Translator()

    expect(t.getLocale()).toBe("en")
    expect(t.getFallback()).toBe("en")

    vi.unstubAllGlobals()
  })
})

describe("direction", () => {
  it.each([
    ["dv", true],
    ["dv-MV", true],
    ["ar_SA", true],
    ["he", true],
    ["en", false],
    ["en-GB", false],
    ["ur-Latn", false],
    ["az-Arab", true],
  ])("isRtlLocale(%s) is %s", (locale, expected) => {
    expect(isRtlLocale(locale)).toBe(expected)
  })

  it("follows the translator's locale", () => {
    const t = new Translator({ locale: "dv" })

    expect(t.isRtl()).toBe(true)
    expect(t.getDirection()).toBe("rtl")
    expect(t.getDirection("en")).toBe("ltr")

    t.setLocale("en")

    expect(t.getDirection()).toBe("ltr")
  })
})

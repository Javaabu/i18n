import { makeReplacements, Translator } from "./translator"

describe("message shapes", () => {
  it("reads the Laravel JS Localization shape, including nested and vendor files", () => {
    const t = new Translator({
      locale: "dv",
      messages: {
        "dv.strings": { Hello: "ހެލޯ", "Sentence. With dots.": "ޖުމްލަ" },
        "dv.messages": { welcome: "މަރުޙަބާ" },
        "dv.dir.sub": { line: "ލައިން" },
        "dv.forms::strings": { save: "ސޭވް" },
      },
    })

    expect(t.__("Hello")).toBe("ހެލޯ")
    expect(t.__("Sentence. With dots.")).toBe("ޖުމްލަ")
    expect(t.__("strings.Hello")).toBe("ހެލޯ")
    expect(t.__("messages.welcome")).toBe("މަރުޙަބާ")
    expect(t.__("dir/sub.line")).toBe("ލައިން")
    expect(t.__("dir.sub.line")).toBe("ލައިން")
    expect(t.__("forms::strings.save")).toBe("ސޭވް")
  })

  it("reads lines keyed by locale", () => {
    const t = new Translator({ locale: "dv", messages: { en: { Hi: "Hello" }, dv: { messages: { hi: "ހެލޯ" } } } })

    expect(t.__("messages.hi")).toBe("ހެލޯ")
    expect(t.__("Hi", {}, "en")).toBe("Hello")
  })

  it("treats anything else as lines for the current locale, or the locale it's told", () => {
    const t = new Translator({ locale: "dv", fallback: null })

    t.load({ Hello: "ހެލޯ", messages: { hi: "ހައި" } })
    t.load({ auth: { failed: "Failed" } }, { locale: "en" })

    expect(t.__("Hello")).toBe("ހެލޯ")
    expect(t.__("messages.hi")).toBe("ހައި")
    expect(t.__("auth.failed", {}, "en")).toBe("Failed")
    expect(t.__("auth.failed")).toBe("auth.failed")
  })

  it("takes an explicit locale over what short group names look like", () => {
    const t = new Translator({ locale: "en", messages: {} })

    t.load({ ui: { save: "Save" } }, { locale: "en" })

    expect(t.__("ui.save")).toBe("Save")
  })

  it("merges rather than replaces", () => {
    const t = new Translator({ locale: "en", messages: { en: { a: { one: "1" } } } })

    t.load({ en: { a: { two: "2" } } })

    expect(t.__("a.one")).toBe("1")
    expect(t.__("a.two")).toBe("2")
  })

  it("unwraps what import() returns, without touching a key called default", () => {
    const module = Object.defineProperty({ default: { Hello: "Hi" } }, Symbol.toStringTag, { value: "Module" })
    const t = new Translator({ locale: "en", messages: module })

    t.load({ default: "Default" }, { locale: "en" })

    expect(t.__("Hello")).toBe("Hi")
    expect(t.__("default")).toBe("Default")
  })

  it("rejects things that aren't translations", () => {
    expect(() => new Translator().load(5)).toThrow(TypeError)
    expect(() => new Translator().load(null)).toThrow(TypeError)
  })

  it("doesn't let translation data reach Object.prototype or read from it", () => {
    const t = new Translator({ locale: "en" })

    t.load(JSON.parse('{"__proto__": {"polluted": "yes"}, "group": {"__proto__": {"polluted": "yes"}}}'))

    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(t.__("constructor")).toBe("constructor")
    expect(t.__("toString")).toBe("toString")
    expect(t.__("group.constructor.name")).toBe("group.constructor.name")
  })

  it("can translate keys named after Object.prototype members", () => {
    const t = new Translator({ locale: "en", messages: { en: { constructor: "Builder" } } })

    expect(t.__("constructor")).toBe("Builder")
  })
})

describe("locales", () => {
  it("accepts either spelling of a regional locale", () => {
    const t = new Translator({ locale: "pt-br", messages: { pt_BR: { Hi: "Oi" } } })

    expect(t.getLocale()).toBe("pt_BR")
    expect(t.__("Hi")).toBe("Oi")
    expect(t.__("Hi", {}, "pt-BR")).toBe("Oi")
  })

  it("finds the language's lines from a regional locale", () => {
    const t = new Translator({ locale: "dv-MV", messages: { dv: { Hi: "ހައި", messages: { hi: "ހެލޯ" } } } })

    expect(t.__("Hi")).toBe("ހައި")
    expect(t.__("messages.hi")).toBe("ހެލޯ")
  })

  it("uses the plural rule of a regional locale's language", () => {
    const t = new Translator({ locale: "en-GB", messages: { en: { apples: { n: "one|many" } } } })

    expect(t.choice("apples.n", 5)).toBe("many")
  })

  it("lets plural rules be added for locales Laravel doesn't cover", () => {
    const messages = { dv: { apples: { n: "އެއް|ގިނަ" } } }
    const laravel = new Translator({ locale: "dv", messages })
    const custom = new Translator({ locale: "dv", messages, pluralRules: { dv: (n) => (n === 1 ? 0 : 1) } })

    expect(laravel.choice("apples.n", 5)).toBe("އެއް")
    expect(custom.choice("apples.n", 5)).toBe("ގިނަ")
  })
})

describe("replacements", () => {
  it("passes tag contents to functions", () => {
    expect(
      makeReplacements("Read the <terms>terms</terms> and <terms>more</terms>, :name", {
        terms: (content: string) => `[${content}]`,
        name: "Ali",
      }),
    ).toBe("Read the [terms] and [more], Ali")
  })

  it("leaves the line alone without replacements", () => {
    expect(makeReplacements("Hello :name", {})).toBe("Hello :name")
    expect(makeReplacements("Hello :name", [])).toBe("Hello :name")
  })

  it("inserts values literally", () => {
    expect(makeReplacements("a :x b", { x: "$& $1 $$" })).toBe("a $& $1 $$ b")
    expect(makeReplacements("a <x>y</x> b", { x: () => "$&" })).toBe("a $& b")
  })

  it("reads the value of enum-like objects", () => {
    expect(makeReplacements("Status: :status", { status: { value: "active" } })).toBe("Status: active")
  })

  it("applies to every line of a group, without changing the loaded lines", () => {
    const t = new Translator({ locale: "en", messages: { en: { g: { a: "A :x", b: { c: "C :x" } } } } })

    expect(t.trans("g", { x: "1" })).toEqual({ a: "A 1", b: { c: "C 1" } })
    expect(t.__("g.a")).toBe("A :x")
  })
})

describe("helpers", () => {
  const t = new Translator({ locale: "en", messages: { en: { Hi: "Hello", g: { n: "one|many" } } } })

  it("__() without a key is null, like Laravel", () => {
    expect(t.__()).toBeNull()
    expect(t.__(null)).toBeNull()
  })

  it("trans() without a key is the translator, like Laravel", () => {
    expect(t.trans()).toBe(t)
  })

  it("can be detached from the translator", () => {
    const { __, trans, trans_choice, transChoice } = t

    expect(__("Hi")).toBe("Hello")
    expect(trans("Hi")).toBe("Hello")
    expect(trans_choice("g.n", 2)).toBe("many")
    expect(transChoice("g.n", 1)).toBe("one")
  })

  it("trans_choice() counts collections", () => {
    expect(t.trans_choice("g.n", new Set([1, 2]))).toBe("many")
    expect(t.trans_choice("g.n", new Map([[1, 1]]))).toBe("one")
    expect(t.trans_choice("g.n", { length: 3 })).toBe("many")
  })

  it("addLines() adds to a group, like Laravel", () => {
    const lines = new Translator({ locale: "en" })

    lines.addLines({ "foo.bar": "Foo :x", "foo.deep.er": "Deep" }, "en")
    lines.addLines({ "foo.bar": "Pkg" }, "en", "pkg")

    expect(lines.__("foo.bar", { x: "1" })).toBe("Foo 1")
    expect(lines.__("foo.deep.er")).toBe("Deep")
    expect(lines.__("pkg::foo.bar")).toBe("Pkg")
  })

  it("handleMissingKeysUsing() sees missing keys, but not has() checks or found keys", () => {
    const missing: string[] = []
    const handled = new Translator({ locale: "en", messages: { en: { Hi: "Hello" } } })

    handled.handleMissingKeysUsing((key) => {
      missing.push(key)

      return `!!${key}!!`
    })

    expect(handled.__("Hi")).toBe("Hello")
    expect(handled.has("nope")).toBe(false)
    expect(missing).toEqual([])
    expect(handled.__("nope")).toBe("!!nope!!")
    expect(missing).toEqual(["nope"])
  })
})

describe("changes", () => {
  it("tells subscribers about locale and line changes until they unsubscribe", () => {
    const t = new Translator({ locale: "en" })
    const listener = vi.fn()
    const unsubscribe = t.subscribe(listener)
    const version = t.getVersion()

    t.setLocale("dv")
    t.setLocale("dv")
    t.load({ Hi: "ހައި" })
    t.addLines({ "a.b": "c" }, "dv")

    expect(listener).toHaveBeenCalledTimes(3)
    expect(t.getVersion()).toBe(version + 3)

    unsubscribe()
    t.setLocale("en")

    expect(listener).toHaveBeenCalledTimes(3)
  })
})

describe("loader", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("loads the current and fallback locales, and new locales when switching", async () => {
    const loader = vi.fn((locale: string) => Promise.resolve({ Hi: `Hi in ${locale}` }))
    const t = new Translator({ locale: "dv", fallback: "en", loader })

    await t.ready()

    expect(loader.mock.calls.map(([locale]) => locale)).toEqual(["dv", "en"])
    expect(t.__("Hi")).toBe("Hi in dv")

    const listener = vi.fn()

    t.subscribe(listener)
    t.setLocale("fr")

    expect(t.getLocale()).toBe("fr")

    await t.ready()

    expect(t.__("Hi")).toBe("Hi in fr")
    expect(listener).toHaveBeenCalledTimes(2)

    t.setLocale("en")
    await t.ready()

    expect(loader).toHaveBeenCalledTimes(3)
  })

  it("fetches a URL template and reads the format from the extension", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response('msgid "Hello"\nmsgstr "ހެލޯ"\n', { status: 200 })))

    vi.stubGlobal("fetch", fetchMock)

    const t = new Translator({ locale: "dv", fallback: null, loader: "/lang/{locale}.po" })

    await t.ready()

    expect((fetchMock.mock.calls[0] as unknown[])[0]).toBe("/lang/dv.po")
    expect(t.__("Hello")).toBe("ހެލޯ")
  })

  it("fetches a single multi-locale file once", async () => {
    const body = JSON.stringify({ "en.messages": { hi: "Hi" }, "dv.messages": { hi: "ހެލޯ" } })
    const fetchMock = vi.fn(() => Promise.resolve(new Response(body, { status: 200 })))

    vi.stubGlobal("fetch", fetchMock)

    const t = new Translator({ locale: "dv", fallback: "en", loader: "/messages.json" })

    await t.ready()
    t.setLocale("en")
    await t.ready()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(t.__("messages.hi")).toBe("Hi")
    expect(t.__("messages.hi", {}, "dv")).toBe("ހެލޯ")
  })

  it("treats a missing per-locale file as no lines, and other failures as errors", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})

    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("", { status: 404 }))),
    )

    await expect(new Translator({ locale: "dv", fallback: null, loader: "/lang/{locale}.json" }).ready()).resolves.toBe(
      undefined,
    )

    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("", { status: 500 }))),
    )

    await expect(
      new Translator({ locale: "dv", fallback: null, loader: "/lang/{locale}.json" }).ready(),
    ).rejects.toThrow("500")
    expect(errors).toHaveBeenCalled()

    errors.mockRestore()
  })

  it("can retry a locale after a failure", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})
    const loader = vi
      .fn<(locale: string) => Promise<object>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ Hi: "ހައި" })
    const t = new Translator({ locale: "dv", fallback: null, loader })

    await expect(t.ready()).rejects.toThrow("offline")
    await t.loadLocale("dv")

    expect(t.__("Hi")).toBe("ހައި")

    errors.mockRestore()
  })
})

describe("window.Lang", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("picks up the Lang.js global, even one that arrives later", () => {
    const t = new Translator({ locale: "en" }).useGlobalLang()

    expect(t.__("messages.hi")).toBe("messages.hi")

    vi.stubGlobal("Lang", { messages: { "en.messages": { hi: "Hi" }, "en.strings": { Hello: "Hello there" } } })

    expect(t.__("messages.hi")).toBe("Hi")
    expect(t.__("Hello")).toBe("Hello there")
  })

  it("leaves translators that didn't ask for it alone", () => {
    vi.stubGlobal("Lang", { messages: { "en.messages": { hi: "Hi" } } })

    expect(new Translator({ locale: "en" }).__("messages.hi")).toBe("messages.hi")
  })
})

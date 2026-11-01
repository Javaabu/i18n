import $ from "jquery"

describe("global install", () => {
  beforeEach(() => {
    vi.resetModules()
    document.documentElement.lang = "dv"
  })

  afterEach(() => {
    document.documentElement.removeAttribute("lang")
    vi.unstubAllGlobals()
  })

  it("installs the helpers on window, and on jQuery if it's there", async () => {
    vi.stubGlobal("jQuery", $)

    const { load } = await import("./index")

    await import("./global")

    load({ dv: { Hi: "ހައި", apples: { n: "އެއް|ގިނަ" } } })

    expect(window.__("Hi")).toBe("ހައި")
    expect(window.trans("Hi")).toBe("ހައި")
    expect(window.trans_choice("apples.n", 1)).toBe("އެއް")
    expect(($ as unknown as { __: typeof window.__ }).__("Hi")).toBe("ހައި")
  })

  it("shares one translator with the imported helpers and reads window.Lang", async () => {
    vi.stubGlobal("Lang", { messages: { "dv.strings": { Legacy: "ލެގަސީ" } } })

    const { __, translatePage } = await import("./index")

    await import("./global")

    expect(__("Legacy")).toBe("ލެގަސީ")
    expect(window.__("Legacy")).toBe("ލެގަސީ")

    document.body.innerHTML = `<p data-trans="Legacy"></p>`
    translatePage()

    expect(document.querySelector("p")?.textContent).toBe("ލެގަސީ")
  })
})

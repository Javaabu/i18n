import { compileScript, compileTemplate, parse } from "@vue/compiler-sfc"
import { createApp, defineComponent, h, nextTick, type Component } from "vue"
import { Translator } from "./translator"
import { i18n, useTranslation } from "./vue"

const messages = {
  en: { Message: "Message", apples: { n: "one|many" } },
  dv: { Message: "މެސެޖު", apples: { n: "އެއް|ގިނަ" } },
}

const Text = defineComponent({
  props: ["name", "label"],
  setup: (props) => () => h("label", { for: props.name }, props.label),
})

function mount(component: Component, translator: Translator) {
  const app = createApp(component)
  const element = document.createElement("div")

  app.use(i18n, { translator })
  app.mount(element)

  return { element, app }
}

describe("templates compiled at build time", () => {
  it("handles the example from the brief and follows the locale", async () => {
    const translator = new Translator({ locale: "en", messages })
    const { code, errors } = compileTemplate({
      source: `<FormsText name="message" :label="__('Message')" /><b>{{ trans_choice('apples.n', 2) }}</b>`,
      id: "test",
      filename: "test.vue",
      compilerOptions: { prefixIdentifiers: true },
    })

    expect(errors).toEqual([])
    expect(code).toContain("_ctx.__")

    const Vue = await import("vue")
    const body = code
      .replace(/^import \{(.*)\} from "vue"$/m, (_, names: string) => `const {${names.replace(/ as /g, ": ")}} = Vue`)
      .replace("export function render", "return function render")
    const render = new Function("Vue", body)(Vue)
    const { element } = mount({ components: { FormsText: Text }, render }, translator)

    expect(element.querySelector("label")?.textContent).toBe("Message")
    expect(element.querySelector("label")?.getAttribute("for")).toBe("message")
    expect(element.querySelector("b")?.textContent).toBe("many")

    translator.setLocale("dv")
    await nextTick()

    expect(element.querySelector("label")?.textContent).toBe("މެސެޖު")
    // Laravel's plural table has no `dv`, so Dhivehi always takes the first form.
    expect(element.querySelector("b")?.textContent).toBe("އެއް")
  })

  it("compiles a namespaced component in <script setup>", () => {
    const { descriptor } = parse(`
      <script setup>
      import { Forms } from "./forms"
      </script>
      <template><Forms.Text name="message" :label="__('Message')" /></template>
    `)
    const { content } = compileScript(descriptor, { id: "test", inlineTemplate: true })

    expect(content).toContain("_unref(Forms).Text")
    expect(content).toContain("_ctx.__('Message')")
  })
})

describe("templates compiled in the browser", () => {
  afterEach(() => {
    delete (globalThis as { __?: unknown }).__
  })

  it("exposes the other helpers", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const translator = new Translator({ locale: "en", messages })
    const { element } = mount(
      { template: `<b>{{ trans('Message') }}</b><i>{{ transChoice('apples.n', 1) }}</i>` },
      translator,
    )

    expect(element.querySelector("b")?.textContent).toBe("Message")
    expect(element.querySelector("i")?.textContent).toBe("one")

    translator.setLocale("dv")
    await nextTick()

    expect(element.querySelector("b")?.textContent).toBe("މެސެޖު")
    expect(warn).not.toHaveBeenCalled()

    warn.mockRestore()
  })

  it("resolves __() and follows the locale", async () => {
    // Vue warns in development that `__` is a reserved prefix, but only for templates compiled in the browser.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const translator = new Translator({ locale: "en", messages })
    const { element } = mount(
      { components: { FormsText: Text }, template: `<forms-text name="message" :label="__('Message')" />` },
      translator,
    )

    expect(element.querySelector("label")?.textContent).toBe("Message")

    translator.setLocale("dv")
    await nextTick()

    expect(element.querySelector("label")?.textContent).toBe("މެސެޖު")

    warn.mockRestore()
  })
})

describe("useTranslation", () => {
  it("gives setup functions reactive helpers", async () => {
    const translator = new Translator({ locale: "en", messages })
    const { element } = mount(
      defineComponent({
        setup() {
          const { __, locale, direction } = useTranslation()

          return () => h("p", { lang: locale.value, dir: direction.value }, __("Message"))
        },
      }),
      translator,
    )
    const paragraph = element.querySelector("p") as HTMLElement

    expect(paragraph.textContent).toBe("Message")

    translator.setLocale("dv")
    await nextTick()

    expect(paragraph.textContent).toBe("މެސެޖު")
    expect(paragraph.lang).toBe("dv")
    expect(paragraph.dir).toBe("rtl")
  })

  it("updates when lines arrive", async () => {
    const translator = new Translator({ locale: "en" })
    const { element } = mount(
      { render: (ctx: { trans: Translator["trans"] }) => h("p", ctx.trans("Late")) },
      translator,
    )

    expect(element.textContent).toBe("Late")

    translator.load({ Late: "On time" })
    await nextTick()

    expect(element.textContent).toBe("On time")
  })
})

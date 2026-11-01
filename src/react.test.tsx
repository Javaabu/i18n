import { act, cleanup, render, screen } from "@testing-library/react"
import { memo } from "react"
import { renderToString } from "react-dom/server"
import { I18nProvider, useTranslation } from "./react"
import { translator as defaultTranslator } from "./default-translator"
import { Translator } from "./translator"

afterEach(cleanup)

const messages = {
  en: { Message: "Message", apples: { n: "one|many" } },
  dv: { Message: "މެސެޖު", apples: { n: "އެއް|ގިނަ" } },
}

function Field({ label }: { label: string }) {
  return <label>{label}</label>
}

function Example() {
  const { __, trans_choice, locale, direction } = useTranslation()

  return (
    <div data-testid="root" data-locale={locale} dir={direction}>
      <Field label={__("Message")} />
      <span>{trans_choice("apples.n", 2)}</span>
    </div>
  )
}

describe("useTranslation", () => {
  it("renders the example from the docs and updates on a locale change", () => {
    const translator = new Translator({ locale: "en", messages })

    render(
      <I18nProvider translator={translator}>
        <Example />
      </I18nProvider>,
    )

    expect(screen.getByText("Message").tagName).toBe("LABEL")
    expect(screen.getByText("many")).toBeTruthy()

    act(() => translator.setLocale("dv"))

    expect(screen.getByText("މެސެޖު")).toBeTruthy()
    expect(screen.getByTestId("root").dataset.locale).toBe("dv")
    expect(screen.getByTestId("root").dir).toBe("rtl")
  })

  it("updates when lines arrive", () => {
    const translator = new Translator({ locale: "en" })

    render(
      <I18nProvider translator={translator}>
        <Example />
      </I18nProvider>,
    )

    expect(screen.queryByText("many")).toBeNull()

    act(() => {
      translator.load(messages)
    })

    expect(screen.getByText("many")).toBeTruthy()
  })

  it("uses the default translator without a provider", () => {
    defaultTranslator.load({ "Default provider": "Works" }, { locale: "en" })
    defaultTranslator.setLocale("en")

    function Plain() {
      return <p>{useTranslation().__("Default provider")}</p>
    }

    render(<Plain />)

    expect(screen.getByText("Works")).toBeTruthy()
  })

  it("gives memoized children new functions on a change", () => {
    const translator = new Translator({ locale: "en", messages })
    const Child = memo(({ __ }: { __: Translator["__"] }) => <em>{__("Message")}</em>)

    function Parent() {
      const { __ } = useTranslation()

      return <Child __={__} />
    }

    render(
      <I18nProvider translator={translator}>
        <Parent />
      </I18nProvider>,
    )
    act(() => translator.setLocale("dv"))

    expect(screen.getByText("މެސެޖު")).toBeTruthy()
  })

  it("renders on the server", () => {
    const html = renderToString(
      <I18nProvider translator={new Translator({ locale: "dv", messages })}>
        <Example />
      </I18nProvider>,
    )

    expect(html).toContain("މެސެޖު")
  })
})

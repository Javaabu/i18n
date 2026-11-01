import { formatFromPath, parseFile, registerFormat } from "./formats"
import { Translator } from "./translator"

function load(text: string, options?: { locale?: string; format?: string }) {
  return new Translator({ locale: "en", fallback: null }).load(text, options)
}

describe("JSON", () => {
  it("reads flat and nested files", () => {
    const t = load('{"The sun.": "ހިރު", "a.b": "flat", "nested": {"c": {"d": "deep :x"}}}', { locale: "en" })

    expect(t.__("The sun.")).toBe("ހިރު")
    expect(t.__("a.b")).toBe("flat")
    expect(t.__("nested.c.d", { x: "1" })).toBe("deep 1")
  })

  it("reads lang:js --json output", () => {
    const t = load('{"en.messages": {"hi": "Hi"}, "dv.messages": {"hi": "ހެލޯ"}}')

    expect(t.__("messages.hi")).toBe("Hi")
    expect(t.__("messages.hi", {}, "dv")).toBe("ހެލޯ")
  })
})

describe("gettext", () => {
  const po = String.raw`# Translator comment
msgid ""
msgstr ""
"Project-Id-Version: demo\n"
"Language: dv_MV\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\n"

#: src/a.js:1
msgid "Hello"
msgstr "ހެލޯ"

msgid "Long "
"line"
msgstr "ދިގު "
"ލައިން\n"

msgid "Quote \"me\""
msgstr "\"ޤުޯޓް\""

msgctxt "button"
msgid "Save"
msgstr "ސޭވް"

msgid "one apple"
msgid_plural ":count apples"
msgstr[0] "އެއް އާފަލު"
msgstr[1] ":count އާފަލު"

#, fuzzy
msgid "Unsure"
msgstr "ޝައްކު"

msgid "Untranslated"
msgstr ""

#~ msgid "Obsolete"
#~ msgstr "ބާ"
`

  it("reads the locale, lines, escapes, context and plurals", () => {
    const t = load(po)

    expect(t.__("Hello", {}, "dv_MV")).toBe("ހެލޯ")
    t.setLocale("dv_MV")
    expect(t.__("Long line")).toBe("ދިގު ލައިން\n")
    expect(t.__('Quote "me"')).toBe('"ޤުޯޓް"')
    expect(t.__("button.Save")).toBe("ސޭވް")
    expect(t.trans_choice("one apple", 1)).toBe("އެއް އާފަލު")
  })

  it("skips fuzzy, untranslated and obsolete entries", () => {
    const { messages } = parseFile(po, "po")

    expect(Object.keys(messages)).not.toContain("Unsure")
    expect(Object.keys(messages)).not.toContain("Untranslated")
    expect(Object.keys(messages)).not.toContain("Obsolete")
  })

  it("lets an explicit locale win over the header", () => {
    const t = load(po, { locale: "en" })

    expect(t.__("Hello")).toBe("ހެލޯ")
  })
})

describe("XLIFF", () => {
  it("reads 1.2 with resnames, numeric ids, entities, CDATA and inline tags", () => {
    const t = load(`<?xml version="1.0"?>
      <xliff version="1.2"><file source-language="en" target-language="dv" datatype="plaintext"><body>
        <trans-unit id="1" resname="messages.hi"><source>Hi</source><target>ހެލޯ</target></trans-unit>
        <trans-unit id="2"><source>Source as key</source><target state="translated">ސޯސް</target></trans-unit>
        <trans-unit id="form.save"><source>Save</source><target>ސޭވް</target></trans-unit>
        <trans-unit id="amp"><source>A</source><target>Tom &amp; Jerry &lt;3 &#65;</target></trans-unit>
        <trans-unit id="cdata"><source>A</source><target><![CDATA[<b>bold</b> &amp;]]></target></trans-unit>
        <trans-unit id="inline"><source>A</source><target>Hi <g id="1">there</g></target></trans-unit>
        <trans-unit id="untranslated"><source>Only source</source></trans-unit>
      </body></file></xliff>`)

    t.setLocale("dv")

    expect(t.__("messages.hi")).toBe("ހެލޯ")
    expect(t.__("Source as key")).toBe("ސޯސް")
    expect(t.__("form.save")).toBe("ސޭވް")
    expect(t.__("amp")).toBe("Tom & Jerry <3 A")
    expect(t.__("cdata")).toBe("<b>bold</b> &amp;")
    expect(t.__("inline")).toBe("Hi there")
    expect(t.__("untranslated")).toBe("Only source")
  })

  it("reads 2.x", () => {
    const t = load(`<xliff version="2.0" srcLang="en" trgLang="dv"><file id="f"><unit id="hello" name="greet.hello">
      <segment><source>Hello</source><target>ހެލޯ</target></segment></unit></file></xliff>`)

    expect(t.__("greet.hello", {}, "dv")).toBe("ހެލޯ")
  })
})

describe("properties", () => {
  it("reads separators, comments, continuations and escapes", () => {
    const t = load(
      String.raw`# comment
! comment
messages.hi = Hi :name
colon: value
space value
long = first \
       second
escaped\=key = a\nb
unicode = ހ
empty =
`,
      { locale: "en" },
    )

    expect(t.__("messages.hi", { name: "Ali" })).toBe("Hi Ali")
    expect(t.__("colon")).toBe("value")
    expect(t.__("space")).toBe("value")
    expect(t.__("long")).toBe("first second")
    expect(t.__("escaped=key")).toBe("a\nb")
    expect(t.__("unicode")).toBe("ހ")
  })

  it("lets dotted keys fall back, since they're groups", () => {
    const t = new Translator({ locale: "dv", fallback: "en" })

    t.load("messages.hi = Hi", { locale: "en", format: "properties" })

    expect(t.__("messages.hi")).toBe("Hi")
  })

  it("can't be used to reach Object.prototype", () => {
    load("__proto__.polluted = yes\nconstructor.prototype.polluted = yes", { locale: "en" })

    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe("ARB", () => {
  it("reads the locale and lines, drops metadata and converts placeholders", () => {
    const t = load('{"@@locale": "dv", "hello": "Hi {name}", "@hello": {"description": "x"}}')

    expect(t.__("hello", { name: "Ali" }, "dv")).toBe("Hi Ali")
    expect(t.__("@hello", {}, "dv")).toBe("@hello")
  })
})

describe("format detection", () => {
  it("sniffs text", () => {
    expect(parseFile('{"a": "b"}').messages).toEqual({ a: "b" })
    expect(parseFile('{"@@locale": "en", "a": "b"}').locale).toBe("en")
    expect(parseFile('msgid "a"\nmsgstr "b"').messages).toEqual({ a: "b" })
    expect(parseFile('<xliff><trans-unit id="a"><source>b</source></trans-unit></xliff>').messages).toEqual({ a: "b" })
    expect(parseFile("a = b").messages).toEqual({ a: "b" })
  })

  it("reads file extensions", () => {
    expect(formatFromPath("/lang/dv.PO?v=1")).toBe("po")
    expect(formatFromPath("/lang/dv.xlf#x")).toBe("xlf")
    expect(formatFromPath("/lang/dv.xliff")).toBe("xliff")
    expect(formatFromPath("/lang/dv")).toBeUndefined()
    expect(formatFromPath("/lang/dv.unknown")).toBeUndefined()
  })

  it("complains about unknown formats and bad JSON", () => {
    expect(() => parseFile("a", "toml")).toThrow(/registerFormat/)
    expect(() => parseFile("{oops", "json")).toThrow(SyntaxError)
  })

  it("takes custom formats", () => {
    registerFormat("csv", (text) => ({
      messages: Object.fromEntries(text.split("\n").map((row) => row.split(",") as [string, string])),
    }))

    expect(load("Hi,Hello\nBye,Goodbye", { format: "csv", locale: "en" }).__("Bye")).toBe("Goodbye")
    expect(formatFromPath("/x.csv")).toBe("csv")
  })
})

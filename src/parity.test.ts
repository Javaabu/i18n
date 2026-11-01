import cases from "../test/parity/cases.json"
import golden from "../test/parity/golden.json"
import { getPluralIndex, chooseMessage } from "./message-selector"
import { Translator } from "./translator"
import type { Countable, Replacements } from "./types"

/** The expected values come from running the real Laravel translator: see test/parity/generate.php. */
type Case = { key: string; replace?: Replacements; locale?: string; current?: string; fallback?: boolean }

const { langJs } = golden

function translator(current = "en", fallback: string | null = "en") {
  return new Translator({ locale: current, fallback, messages: langJs })
}

describe("matches Laravel's Translator", () => {
  describe("get()", () => {
    it.each((cases.get as Case[]).map((c, i) => [JSON.stringify(c), c, golden.get[i]] as const))(
      "%s",
      (_, { key, replace, locale, current }, expected) => {
        expect(translator(current).get(key, replace, locale)).toEqual(expected)
      },
    )
  })

  describe("choice()", () => {
    it.each(
      cases.choice.map((c, i) => [JSON.stringify(c), c as Case & { number: Countable }, golden.choice[i]] as const),
    )("%s", (_, { key, number, replace, locale, current }, expected) => {
      expect(translator(current).choice(key, number, replace, locale)).toBe(expected)
    })
  })

  describe("has()", () => {
    it.each((cases.has as Case[]).map((c, i) => [JSON.stringify(c), c, golden.has[i]] as const))(
      "%s",
      (_, { key, locale, fallback, current }, expected) => {
        expect(translator(current).has(key, locale, fallback)).toBe(expected)
      },
    )
  })

  describe("without a fallback locale", () => {
    it.each((cases.noFallback as Case[]).map((c, i) => [JSON.stringify(c), c, golden.noFallback[i]] as const))(
      "%s",
      (_, { key, replace, locale, current }, expected) => {
        expect(translator(current, null).get(key, replace, locale)).toBe(expected)
      },
    )
  })

  describe("MessageSelector::choose()", () => {
    it.each(cases.select.map((c, i) => [JSON.stringify(c), c, golden.select[i]] as const))(
      "%s",
      (_, { line, number, locale }, expected) => {
        expect(chooseMessage(line, number, locale)).toBe(expected)
      },
    )
  })

  it("has the same plural index for every locale in Laravel's table", () => {
    const { numbers, locales } = golden.plural

    for (const [locale, expected] of Object.entries(locales)) {
      const actual = numbers.map((number) => getPluralIndex(locale, number))

      expect({ locale, indexes: actual }).toEqual({ locale, indexes: expected })
    }
  })
})

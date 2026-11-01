import type { PluralRule } from "./types.js"

/** Rule groups of `Illuminate\Translation\MessageSelector::getPluralIndex()`, by language. Unlisted languages get 0. */
const pluralRules: [string, PluralRule][] = [
  ["az bo dz id ja jv ka km kn ko ms th tr vi zh", () => 0],
  [
    "af bn bg ca da de el en eo es et eu fa fi fo fur fy gl gu ha he hu is it ku lb ml mn mr nah nb ne nl nn no om or pa pap ps pt so sq sv sw ta te tk ur zu",
    (n) => (n === 1 ? 0 : 1),
  ],
  ["am bh fil fr gun hi hy ln mg nso ti wa xbr", (n) => (n === 0 || n === 1 ? 0 : 1)],
  [
    "be bs hr ru sr uk",
    (n) => {
      const i = Math.trunc(n)
      if (i % 10 === 1 && i % 100 !== 11) return 0
      return i % 10 >= 2 && i % 10 <= 4 && (i % 100 < 10 || i % 100 >= 20) ? 1 : 2
    },
  ],
  ["cs sk", (n) => (n === 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2)],
  ["ga", (n) => (n === 1 ? 0 : n === 2 ? 1 : 2)],
  [
    "lt",
    (n) => {
      const i = Math.trunc(n)
      if (i % 10 === 1 && i % 100 !== 11) return 0
      return i % 10 >= 2 && (i % 100 < 10 || i % 100 >= 20) ? 1 : 2
    },
  ],
  [
    "sl",
    (n) => {
      const i = Math.trunc(n) % 100
      return i === 1 ? 0 : i === 2 ? 1 : i === 3 || i === 4 ? 2 : 3
    },
  ],
  ["mk", (n) => (Math.trunc(n) % 10 === 1 ? 0 : 1)],
  [
    "mt",
    (n) => {
      const i = Math.trunc(n) % 100
      if (n === 1) return 0
      if (n === 0 || (i > 1 && i < 11)) return 1
      return i > 10 && i < 20 ? 2 : 3
    },
  ],
  [
    "lv",
    (n) => {
      const i = Math.trunc(n)
      return n === 0 ? 0 : i % 10 === 1 && i % 100 !== 11 ? 1 : 2
    },
  ],
  [
    "pl",
    (n) => {
      const i = Math.trunc(n)
      if (n === 1) return 0
      return i % 10 >= 2 && i % 10 <= 4 && (i % 100 < 12 || i % 100 > 14) ? 1 : 2
    },
  ],
  ["cy", (n) => (n === 1 ? 0 : n === 2 ? 1 : n === 8 || n === 11 ? 2 : 3)],
  [
    "ro",
    (n) => {
      const i = Math.trunc(n) % 100
      return n === 1 ? 0 : n === 0 || (i > 0 && i < 20) ? 1 : 2
    },
  ],
  [
    "ar",
    (n) => {
      const i = Math.trunc(n) % 100
      if (n === 0 || n === 1 || n === 2) return n
      if (i >= 3 && i <= 10) return 3
      return i >= 11 && i <= 99 ? 4 : 5
    },
  ],
]

const ruleByLanguage = new Map<string, PluralRule>(
  pluralRules.flatMap(([languages, rule]) => languages.split(" ").map((language) => [language, rule] as const)),
)

/**
 * Singular and plural forms for Dhivehi. Laravel's table has no `dv`, so it always takes the first form; this isn't the
 * default because the browser would then disagree with the server unless Laravel gets the same rule.
 */
export const dhivehiPluralRule: PluralRule = (number) => (number === 1 ? 0 : 1)

export function getPluralIndex(locale: string, number: number): number {
  const rule = ruleByLanguage.get(locale.split(/[-_]/)[0] as string)

  return rule ? rule(number) : 0
}

/** PHP's `$number >= $string`: numeric when the string is numeric, a string comparison when it isn't. */
function compare(number: number, value: string): number {
  if (value.trim() !== "" && !Number.isNaN(Number(value))) return number - Number(value)

  const text = String(number)

  return text < value ? -1 : text > value ? 1 : 0
}

function extractFromString(part: string, number: number): string | null {
  const matches = /^[{[]([-?\d|*,.*]*)[}\]]([\s\S]*)/.exec(part)

  if (!matches) return null

  const condition = matches[1] as string
  const value = matches[2] as string

  if (condition.includes(",")) {
    const comma = condition.indexOf(",")
    const from = condition.slice(0, comma)
    const to = condition.slice(comma + 1)

    if (to === "*" && compare(number, from) >= 0) return value
    if (from === "*" && compare(number, to) <= 0) return value
    if (compare(number, from) >= 0 && compare(number, to) <= 0) return value
  }

  return compare(number, condition) === 0 ? value : null
}

/** `Illuminate\Translation\MessageSelector::choose()`. */
export function chooseMessage(line: string, number: number, locale: string, pluralRule?: PluralRule): string {
  const segments = line.split("|")

  for (const part of segments) {
    const value = extractFromString(part, number)

    if (value !== null) return value.trim()
  }

  const stripped = segments.map((part) => part.replace(/^[{[][-?\d|*,.*]*[}\]]/, ""))
  const index = pluralRule ? pluralRule(number) : getPluralIndex(locale, number)

  return stripped[index] ?? (stripped[0] as string)
}

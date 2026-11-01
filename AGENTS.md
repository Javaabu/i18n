# i18n: notes for AI coding agents

`@javaabu/i18n` is Laravel's `__()`, `trans()` and `trans_choice()` for JavaScript, with React, Vue, jQuery and vanilla JS bindings.

## Layout

| Path                                                            | What                                                                                               |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/translator.ts`                                             | `Translator`, a port of `Illuminate\Translation\Translator`, plus loading and shapes               |
| `src/message-selector.ts`                                       | Port of `MessageSelector`: `{0}`, `[1,*]` conditions and the plural table                          |
| `src/formats.ts`                                                | File parsers (`po`, `xliff`, `properties`, `arb`, `json`) and `registerFormat()`                   |
| `src/locale.ts`                                                 | Locale normalization and detection from the page                                                   |
| `src/default-translator.ts`                                     | The instance shared by every entry point; shared chunks keep it a singleton                        |
| `src/react.tsx`, `src/vue.ts`, `src/jquery.ts`, `src/global.ts` | Bindings, each its own entry point                                                                 |
| `src/browser.ts`                                                | Entry for the `<script>` tag build                                                                 |
| `test/parity`                                                   | Generates `golden.json` from the real Laravel translator                                           |
| `docs`, `llms.txt`                                              | Docusaurus pages for docs.javaabu.com and the index for AI assistants, both shipped in the package |
| `resources/boost`                                               | Laravel Boost skill and guideline, found through `package.json`; shipped in the package            |
| `examples`                                                      | One Dhivehi and English page per integration: `pnpm examples`                                      |

## Rules

- Output must match Laravel. A change to translation behaviour needs a case in `test/parity/cases.json`, then `pnpm parity:generate`; never edit `golden.json` by hand. Additions that go beyond Laravel go in `docs/differences-from-laravel.md`.
- No runtime dependencies. The core must not import React, Vue or jQuery.
- Translation data can be untrusted: keep `__proto__` out of merges, and read with own-property checks.
- `translateDom()` sets text and attributes only, never HTML.
- Every change needs tests (`*.test.ts(x)` next to the code), a page in `docs` (linked from `llms.txt`), the skill if it changes how the package should be used, and a changeset (`pnpm changeset`).
- Dhivehi and RTL come first: use Thaana in examples and tests of user-facing behaviour.

## Commands

```bash
pnpm install
pnpm lint && pnpm format:check && pnpm typecheck
pnpm test:coverage
pnpm build && pnpm test:browser
pnpm examples
```

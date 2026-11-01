# @javaabu/i18n

[![Tests](https://github.com/Javaabu/i18n/actions/workflows/ci.yml/badge.svg)](https://github.com/Javaabu/i18n/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/Javaabu/i18n/branch/main/graph/badge.svg)](https://codecov.io/gh/Javaabu/i18n)
[![npm](https://img.shields.io/npm/v/@javaabu/i18n)](https://www.npmjs.com/package/@javaabu/i18n)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

Laravel's `__()`, `trans()` and `trans_choice()` for JavaScript, with the same arguments and the same output. It works with React, Vue, jQuery and vanilla JS, finds the locale from the page, knows RTL, and loads Laravel JS Localization, JSON, gettext, XLIFF, properties and ARB translations.

```vue
<Forms.Text name="message" :label="__('Message')" />
```

## Documentation

You'll find the documentation on [https://docs.javaabu.com/i18n](https://docs.javaabu.com/i18n), and in the [`docs`](docs) folder.

AI coding assistants can start from [`llms.txt`](llms.txt). The package ships a [Laravel Boost](https://github.com/laravel/boost) skill and guideline, which Boost finds by itself. See [AI assistants](docs/ai-assistants.md).

## Quick start

```bash
pnpm add @javaabu/i18n
```

```js
import { __, trans_choice, configure } from "@javaabu/i18n"

configure({ loader: (locale) => import(`../../lang/${locale}.json`) })

__("Welcome, :name!", { name: "Ali" })
trans_choice("messages.apples", 3)
```

Without a bundler:

```html
<script src="https://unpkg.com/@javaabu/i18n/dist/i18n.iife.js"></script>
```

| Using      | Read                                                             | Example                                                |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| React      | [React](docs/frameworks/react.md)                                | [`examples/react.tsx`](examples/react.tsx)             |
| Vue        | [Vue](docs/frameworks/vue.md)                                    | [`examples/App.vue`](examples/App.vue)                 |
| jQuery     | [jQuery](docs/frameworks/jquery.md)                              | [`examples/jquery.ts`](examples/jquery.ts)             |
| Vanilla JS | [Vanilla JS](docs/frameworks/vanilla-js.md)                      | [`examples/vanilla.ts`](examples/vanilla.ts)           |
| Script tag | [Installation](docs/installation-and-setup.md#without-a-bundler) | [`examples/script-tag.html`](examples/script-tag.html) |

Run the examples with `pnpm install && pnpm examples`. Each one switches between Dhivehi and English.

## Testing

```bash
pnpm test             # includes the comparison against test/parity/golden.json
pnpm test:coverage
pnpm build && pnpm test:browser
pnpm parity:generate  # refreshes that file from the real Laravel translator (needs PHP and Composer)
```

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for what has changed recently.

## Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md) for details.

## Security

If you discover any security related issues, please email [info@javaabu.com](mailto:info@javaabu.com) instead of using the issue tracker.

## License

MIT. See [LICENSE.md](LICENSE.md).

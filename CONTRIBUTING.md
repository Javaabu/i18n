# Contributing

Contributions are welcome via pull requests on [GitHub](https://github.com/Javaabu/i18n).

- Match Laravel's translator. For behaviour changes, add a case to `test/parity/cases.json` and run `pnpm parity:generate` (needs PHP and Composer).
- Add tests for new behaviour and keep `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm test:browser` passing.
- Update the page in `docs`, `llms.txt` and the skill in `resources/boost` where it applies.
- Describe the change with `pnpm changeset`.

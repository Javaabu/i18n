# Contributing

Contributions are welcome via pull requests on [GitHub](https://github.com/Javaabu/i18n).

- Match Laravel's translator. For behaviour changes, add a case to `test/parity/cases.json` and run `pnpm parity:generate` (needs PHP and Composer).
- Add tests for new behaviour and keep `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm test:browser` passing.
- Update the page in `docs`, `llms.txt` and the skill in `resources/boost` where it applies.
- Describe the change with `pnpm changeset`.

## Releasing

Releases go out from `main` through `.github/workflows/release.yml`. Once changesets land, it opens a "Release" pull request that bumps the version and updates `CHANGELOG.md`. Merging that pull request publishes the new version to npm and tags and releases it on GitHub. There's nothing to run by hand.

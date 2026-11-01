---
title: AI assistants
sidebar_position: 1.35
---

The docs are plain Markdown written for people and AI coding assistants alike, and the package ships them, so they always match the version you have installed.

| File                                          | What                                            |
| --------------------------------------------- | ----------------------------------------------- |
| `node_modules/@javaabu/i18n/llms.txt`         | The rules for using the package, and every page |
| `node_modules/@javaabu/i18n/docs/`            | The pages                                       |
| `node_modules/@javaabu/i18n/resources/boost/` | The Laravel Boost skill and guideline           |

# Laravel Boost

[Laravel Boost](https://github.com/laravel/boost) finds the skill and guideline by itself when `@javaabu/i18n` is a direct dependency in your `package.json`. Run this after installing or updating the package:

```bash
php artisan boost:update
```

Choose `@javaabu/i18n` if Boost asks which third-party packages to use.

# Other assistants

Point your assistant at the docs from the project's instructions file (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, `.github/copilot-instructions.md`):

```md
## Translations

JS strings use @javaabu/i18n. Before translating in JS, read node_modules/@javaabu/i18n/llms.txt.
```

Or copy `node_modules/@javaabu/i18n/resources/boost/skills/javaabu-i18n` into your assistant's skills folder, such as `.claude/skills/`.

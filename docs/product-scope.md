# Argot product scope

Argot is an **opinionated semantic custom-property convention**, not a general
CSS build tool.

## In scope

| Piece                   | Role                                                                    |
| ----------------------- | ----------------------------------------------------------------------- |
| [`tokens/`](../tokens/) | DTCG-shaped source of truth (names, descriptions, tiers, pairsWith)     |
| `argot generate`        | Emit a CSS `:root` template from those tokens                           |
| Stylelint plugin/config | Shareable `@keithjgrant/argot/stylelint/config` (rules stubbed for now) |
| Docs site (planned)     | Token reference generated from the same JSON                            |

## Out of scope

| Piece                                          | Where it lives instead                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| PostCSS `@import` / minify preset or CLI       | Sibling package `@keithjgrant/postcss-preset` (local checkout: `../postcss-preset`) |
| HMR / dev server                               | Host tools (Vite, 11ty/BrowserSync)                                                 |
| Primitive palettes / multi-platform token sync | Consumer projects (and optionally Style Dictionary later)                           |

## Dependency rule

Applications may use:

1. Argot alone (`generate` + Stylelint), or
2. The PostCSS preset alone (token-agnostic pipeline), or
3. Both together

The PostCSS preset **must not** hard-require Argot. Argot **must not** ship
`argot run` or a default PostCSS pipeline that implies token lint-on-build.

See also: [token-source-and-tooling.md](./token-source-and-tooling.md).

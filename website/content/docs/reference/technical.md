---
layout: docs.njk
title: Technical details
description:
  Package layout, exports, runtime requirements, and module boundaries.
permalink: /docs/reference/technical/
---

# Technical details

Consumer-facing packaging and architecture notes. For command syntax see
[CLI]({{ '/docs/reference/' | url }}); for APIs see the package’s
[`docs/api.md`](https://github.com/keithjgrant/argot/blob/main/docs/api.md).

## Runtime

| Requirement              | Detail                                                                  |
| ------------------------ | ----------------------------------------------------------------------- |
| Node.js                  | **≥ 22.18.0** (CLI and Node entrypoints)                                |
| Module system            | **Native ESM only** (`"type": "module"`). No CommonJS build.            |
| TypeScript for consumers | **Not required** — published JS + `.d.ts`                               |
| Stylelint                | Optional peer when using lint plugins outside the processor bundle path |

## Published package layout

npm package name: **`argot-css`**.

Included in the tarball (high level):

| Path           | Role                                                           |
| -------------- | -------------------------------------------------------------- |
| `bin/argot.js` | CLI executable (loads compiled `dist/`)                        |
| `dist/`        | Compiled ESM + declarations for library entrypoints            |
| `tokens/`      | Semantic vocabulary JSON (source of truth for names/metadata)  |
| `templates/`   | Static CSS starters (semantics templates; scaffold tree files) |
| `docs/api.md`  | Public API reference                                           |

The documentation **website** is not part of the published library package.

## Package exports

There is **no root** `import 'argot-css'` JavaScript entry. Use subpaths:

| Subpath                                      | Environment           | Provides                                                       |
| -------------------------------------------- | --------------------- | -------------------------------------------------------------- |
| `argot-css/palette`                          | Browser-safe          | Palette normalize/serialize, generate, render, `parseCssColor` |
| `argot-css/palette/node`                     | Node                  | `loadPaletteDefinition`, `writePalette`                        |
| `argot-css/semantics`                        | Node                  | `generateCss`, `renderCss`, `writeTemplate`                    |
| `argot-css/stylelint`                        | Node (Stylelint host) | Plugin exports                                                 |
| `argot-css/stylelint/config`                 | Node                  | Shareable Stylelint config                                     |
| `argot-css/stylelint-default`                | Node                  | Processor’s default Stylelint config object                    |
| `argot-css/tokens/*`                         | Any (JSON)            | Packaged token files                                           |
| `argot-css/templates/semantics.css`          | CSS                   | Static core template                                           |
| `argot-css/templates/semantics-extended.css` | CSS                   | Static core + extended                                         |

**Browser-safe** means the palette entrypoint does not require Node built-ins or
browser globals; resolve the package with a bundler or other ESM loader as
usual.

## Module boundaries

Internal responsibilities stay separated so consumers only load what they
import:

| Concern                | Responsibility                                                                  |
| ---------------------- | ------------------------------------------------------------------------------- |
| **Tokens / semantics** | Load vocabulary JSON; render empty or valued templates                          |
| **Palette**            | Headless scale math + CSS serialization; no DOM or filesystem in the core entry |
| **Processor**          | Token-agnostic PostCSS pipeline: import assemble → Stylelint → cssnano → write  |
| **Stylelint**          | Optional rules using token metadata; not required to import palette/semantics   |
| **Scaffold**           | Compose starter files and ownership-safe writes                                 |
| **CLI**                | Thin argv dispatch over the libraries                                           |

Generation **never** silently runs the processor, and the processor **never**
silently runs generation. Lint can run inside the processor or standalone.

## Development vs published binaries

| Context           | How code runs                                                                          |
| ----------------- | -------------------------------------------------------------------------------------- |
| Published install | `bin/argot.js` → `dist/` (compiled by `tsc`)                                           |
| Repo checkout     | `npm run cli -- …` runs TypeScript source via the dev CLI helper (no `dist/` required) |
| Website           | Eleventy imports the native TS token loader and uses the processor on site CSS         |

Source conventions in `src/`: `.ts` import extensions, erasable TypeScript
syntax, strict checking separate from Node’s type stripping.

Do not rely on a bundler, CJS dual package, or `ts-node`-style runtime for the
published package.

## Processor pipeline (implementation)

Order inside `processStylesheet`:

1. Custom **at-import** plugin (local inline, remote/`data:` left alone)
2. **Stylelint** (user config file or built-in default)
3. **cssnano**
4. **postcss-reporter**
5. Write destination file

Import behavior and limitations: [Processor]({{ '/docs/processor/' | url }}).

## Errors

Library and CLI paths generally **throw** or exit nonzero on failure. Palette
validation errors name the invalid field. Error messages are human-oriented;
there is no separate machine-readable error-code API.

## Independence checklist

You can use:

1. Palette generation alone
2. Semantic templates alone (± Stylelint)
3. Scaffold alone
4. Processor alone
5. The full workflow

without pulling unused subsystems into your import graph, provided you stick to
the listed subpath exports.

## Related

- [Configuration]({{ '/docs/reference/configuration/' | url }})
- [Installation]({{ '/docs/installation/' | url }})
- [CLI]({{ '/docs/reference/' | url }})

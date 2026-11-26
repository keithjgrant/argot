---
layout: docs.njk
title: Processor
description: Assemble local @import, lint with Stylelint, and minify CSS.
permalink: /docs/processor/
human-reviewed: true
---

# Processor

The Argot preprocessor turns a CSS **input file** into a single **output file**.

## Command

```bash
argot <input.css> <output.css> [--lint-config=path/to/config.js]
```

| Argument / flag        | Meaning                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| first filepath         | Entry stylesheet (required)                                                  |
| second filepath        | Destination path (required). Directories are created if needed.              |
| `--lint-config` / `-c` | Optional Stylelint config file. When omitted, Argot uses a built-in default. |

If the first argument ends in `.css`, the CLI runs the processor. See
[CLI]({{ '/docs/reference/' | url }}) for other commands.

The processor does not require Argot’s semantic vocabulary, palette, or
scaffold. Point it at any project CSS that uses local `@import`.

Examples:

```bash
argot styles/index.css dist/styles.css
argot styles/index.css dist/styles.css --lint-config="./stylelint.config.js"
```

See [Getting started]({{ '/docs/getting-started/' | url }}) for a short
walkthrough and [CLI]({{ '/docs/reference/' | url }}) for the full command list.

## Pipeline

The processor performs the following things, in order:

1. **Assemble** — resolve and inline local `@import`s (Argot’s import plugin).
2. **Lint** — Stylelint against the assembled tree.
3. **Minify** — cssnano.

The final output is

## `@import` behavior

Native CSS only allows `@import` at the top of a stylesheet. Argot treats local
imports more like a lightweight preprocessor: **imports may appear anywhere** in
a file, including after other rules.

Example usage:

```css
@import 'reset.css';
@import 'base.css';
@import 'modules/dialog.css';
@import 'modules/dropdown.css';
```

### Supported preludes

A quoted paths is required. The `url(…)` function may also be used. Bare
unquoted paths (`@import base.css`) are not accepted.

After the path, prelude modifiers may appear. These apply `@layer`, `@scope`,
`@supports`, and/or `@media` to the imported stylesheet. Layer, scope, and
supports may be specified in any order; media queries must be listed last.

Examples:

```css
@import 'partial.css';
@import 'partial.css' layer(modules);
@import 'partial.css' layer; /* anonymous layer */
@import 'partial.css' supports(contrast-color(#ccc));
@import 'partial.css' scope(.aside);
@import 'partial.css' scope((.a) to (.b)) screen and (min-width: 560px);
@import 'partial.css' (width >= 500px);
@import 'partial.css' layer(base) supports(display: grid) (width >= 40rem);
```

Argot wraps the imported styles to preserve meaning:

| Prelude       | Result                |
| ------------- | --------------------- |
| `layer(name)` | `@layer name { … }`   |
| `scope(…)`    | `@scope … { … }`      |
| `supports(…)` | `@supports (…) { … }` |
| media queries | `@media … { … }`      |

When multiple preludes are specified, they are applied layer, scope, supports,
then media.

### Local vs remote

Import paths that do not appear to be local imports are ignored:

| URI                                          | Behavior             |
| -------------------------------------------- | -------------------- |
| Relative / local file                        | Inlined by processor |
| `https:` / `http:` / protocol-relative `//…` | Left unchanged       |
| `data:`                                      | Left unchanged       |

Missing local files fail the build with an error. Circular import chains fail. A
file imported more than once is **deduplicated**: the first is imported as
specified and later `@import`s of the same resolved path are dropped (including
any different `layer(...)` wrapper on the later import).

### Spec vs browser

Mid-file `@import` and Argot’s inlining are **processor semantics**, not what a
browser does with raw source. If you plan to later skip Argot and ship source
CSS directly, keep imports at the top for a spec-following tool (or accept that
mid-file imports will not work in the browser).

## Linting in the pipeline

[Stylelint](https://stylelint.io/) always runs as part of the processor.

- **Default config**: extends `stylelint-config-recommended`. This is
  [a minimal ruleset](https://github.com/stylelint/stylelint-config-recommended#readme)
  that does not impose any strong opinions.
- **Custom config**: pass `--lint-config` to use any Stylelint config file of
  your choosing.

See [Linting]({{ '/docs/processor/linting/' | url }}) for more information.

## Minification

[cssnano](https://cssnano.github.io/cssnano/) runs with its defaults after lint.

There is not yet a flag to disable minify, choose a browserslist, or emit source
maps. Those are on the processor roadmap.

## What the processor does not do

- Create or regenerate scaffold / token / palette files
- Understand portable palette or semantic definition JSON
- Transpile or autoprefix as a product feature
- Watch mode or a dev server (use your host tool for this)

## Related

- [Linting]({{ '/docs/processor/linting/' | url }})
- [Configuration file]({{ '/docs/reference/configuration/' | url }})

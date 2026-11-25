---
layout: docs.njk
title: Preprocessor
description: Assemble local @import, lint with Stylelint, and minify CSS.
permalink: /docs/processor/
---

# Preprocessor

The Argot preprocessor turns a CSS **input file** into a single **output file**.
It is token-agnostic: it does not require Argot’s semantic vocabulary, palette,
or scaffold. Point it at any project CSS that uses local `@import`.

## Command

```bash
argot <input.css> <output.css> [--lint-config=path/to/config.js]
```

| Argument / flag        | Meaning                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| `input.css`            | Entry stylesheet (required)                                                  |
| `output.css`           | Destination path (required). Parent directories are created if needed.       |
| `--lint-config` / `-c` | Optional Stylelint config file. When omitted, Argot uses a built-in default. |

There is no separate `process` subcommand: if the first argument ends in `.css`,
the CLI runs the processor.

Examples:

```bash
argot styles/index.css dist/styles.css
argot styles/index.css dist/styles.css --lint-config=./stylelint.config.js
```

See [Getting started]({{ '/docs/getting-started/' | url }}) for a short
walkthrough and [CLI]({{ '/docs/reference/' | url }}) for the full command list.

## Pipeline

In order:

1. **Assemble** — resolve and inline local `@import`s (Argot’s import plugin).
2. **Lint** — Stylelint against the assembled tree.
3. **Minify** — cssnano.
4. **Report** — postcss-reporter prints remaining messages.
5. **Write** — UTF-8 CSS to the output path.

Generation tools (`argot semantics`, `argot palette`) are **not** invoked. The
processor only builds the CSS you give it.

## `@import` behavior

Native CSS only allows `@import` at the top of a stylesheet. Argot treats local
imports more like a lightweight preprocessor: **imports may appear anywhere** in
a file, including after other rules. That matches how cascade-layer entrypoints
are usually written:

```css
@layer reset, base, theme, layout, modules;

@import 'reset.css' layer(reset);
@import 'base.css' layer(base);
@import 'primitives.css' layer(theme);
@import 'semantics.css' layer(theme);
```

### Supported preludes

Quoted paths or `url(...)` are required. Bare unquoted paths
(`@import base.css`) are **not** accepted.

After the path, these modifiers may appear (layer, scope, and supports in any
order; media last):

```css
@import 'partial.css';
@import 'partial.css' layer(modules);
@import 'partial.css' layer;
@import 'partial.css' supports(contrast-color(#ccc));
@import 'partial.css' scope(.aside);
@import 'partial.css' scope((.a) to (.b));
@import 'partial.css' (width >= 500px);
@import 'partial.css' layer(base) supports(display: grid) (width >= 40rem);
```

When inlined, Argot wraps the imported nodes to preserve meaning:

- `layer(name)` → `@layer name { … }` (bare `layer` → anonymous `@layer { … }`)
- `scope(...)` → `@scope … { … }`
- `supports(...)` → `@supports (…) { … }`
- media queries → `@media … { … }`

Nesting order when several apply: **layer → scope → supports → media →
content**.

### Local vs remote

| URI                                          | Behavior                                 |
| -------------------------------------------- | ---------------------------------------- |
| Relative / local file                        | Read, parse, inline (recursively)        |
| `https:` / `http:` / protocol-relative `//…` | Left as a native `@import` (not inlined) |
| `data:`                                      | Left unchanged                           |

Missing local files fail the build with a clear error. Circular import chains
fail. A file imported more than once is **deduped**: the first occurrence wins;
later `@import`s of the same resolved path are dropped (including any different
`layer(...)` wrapper on the later import).

### Spec vs browser

Mid-file `@import` and Argot’s inlining are **processor semantics**, not what a
browser does with raw source. If you skip Argot and ship source CSS directly,
keep imports at the top for a spec-following tool (or accept that mid-file
imports will not work in the browser).

## Linting in the pipeline

Stylelint always runs as part of the processor today.

- **Default config** (no `--lint-config`): extends
  `stylelint-config-recommended` and enables `argot/color-contrast`.
- **Custom config**: pass `--lint-config` to any Stylelint config file your
  project already uses.

You can also lint **outside** the processor with the shareable package config.
Details: [Linting]({{ '/docs/processor/linting/' | url }}).

## Minification

cssnano runs with its defaults after lint. There is not yet a flag to disable
minify, choose a browserslist, or emit source maps. Those are on the processor
roadmap ([configuration]({{ '/docs/reference/configuration/' | url }}) is still
a stub).

## What the processor does not do

- Create or regenerate scaffold / token / palette files
- Understand portable palette or semantic definition JSON
- Transpile or autoprefix as a product feature
- Watch mode or a dev server (use your host tool)

## Related

- [Linting]({{ '/docs/processor/linting/' | url }})
- [Scaffold architecture]({{ '/docs/scaffold/architecture/' | url }}) — layer
  file map this site uses
- [Installation]({{ '/docs/installation/' | url }})

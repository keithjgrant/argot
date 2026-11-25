---
layout: docs.njk
title: Getting started
description: First-hour walkthrough—process CSS, adopt semantic tokens, optional palette and lint.
permalink: /docs/getting-started/
---

# Getting started

This page is a short path through Argot’s shipped pieces. For package requirements,
install options, and library entrypoints, see
[Installation]({{ '/docs/installation/' | url }}).

You do not need every step. Pick the path that matches what you are doing.

## 0. Install

```bash
npm install argot-css
```

Node.js **22.18+**. The CLI binary is `argot` (via `npx argot` or an npm script).

## 1. Process a stylesheet

If you already have CSS with local `@import`s, point Argot at an entry file and an
output path:

```bash
argot styles/index.css dist/styles.css
```

Argot will:

1. Inline local `@import`s (including mid-file imports and `layer(...)`)
2. Run Stylelint (default recommended + Argot color-contrast, or your config)
3. Minify with cssnano
4. Write the result

Example entry shape (this site’s tree is similar):

```css
@layer reset, base, theme, layout, modules;

@import 'reset.css' layer(reset);
@import 'base.css' layer(base);
@import 'primitives.css' layer(theme);
@import 'semantics.css' layer(theme);
@import 'layout.css' layer(layout);
@import 'modules/index.css' layer(modules);
```

Custom lint config:

```bash
argot styles/index.css dist/styles.css --lint-config=./stylelint.config.js
```

More detail: [Processor]({{ '/docs/processor/' | url }}).

## 2. Adopt semantic token names

Generate an empty template of shared intent-based custom properties, then fill
in values (usually from your primitives):

```bash
argot semantics ./styles/semantics.css
# or include extended-tier names:
argot semantics --extended ./styles/semantics-extended.css
```

Assign values:

```css
:root {
  --text-primary: var(--gray-16);
  --bg-body: var(--gray-2);
  /* … */
}
```

Use semantic names in components:

```css
.card {
  background: var(--bg-raised);
  color: var(--text-primary);
}
```

Browse the full vocabulary:
[Browse tokens]({{ '/docs/tokens/' | url }}).
Read the model:
[Custom property structure]({{ '/docs/custom-property-structure/' | url }}).

## 3. Optional: generate a primitive palette

Define seed colors as numeric OKLCH, then emit `--name-1` … `--name-16` scales:

```json
{
  "version": 1,
  "colors": [
    { "name": "gray", "l": 0.6, "c": 0.015, "h": 250 },
    { "name": "brand", "l": 0.6, "c": 0.2, "h": 250 }
  ],
  "options": {
    "lightnessCurve": "inclusive",
    "chromaCurve": "weighted"
  }
}
```

```bash
argot palette ./palette.json ./styles/primitives.css
```

Existing output needs `--force`. Preview with `--dry-run`. Map those primitives
into your semantic file from step 2.

Details: [Palette generator]({{ '/docs/scaffold/palette-generator/' | url }}).

## 4. Optional: standalone Stylelint

Lint without running the full processor:

```js
// stylelint.config.js
export default {
  extends: ['argot-css/stylelint/config'],
};
```

That enables `argot/color-contrast` today. More rules are planned. See
[Linting]({{ '/docs/processor/linting/' | url }}).

## Suggested npm scripts

```json
{
  "scripts": {
    "css": "argot styles/index.css dist/styles.css",
    "tokens": "argot semantics ./styles/semantics.css",
    "palette": "argot palette ./palette.json ./styles/primitives.css --force"
  }
}
```

## What is not in this walkthrough yet

**Project scaffold** (`argot scaffold` / `init`)—a starter layered CSS tree—is
documented as the target shape under
[Scaffold]({{ '/docs/scaffold/' | url }}) but is not shipped. Until then, copy a
layout you like (including this site’s `website/styles/`) or grow files by hand
and keep using the processor.

## Next reading

- [Custom property structure]({{ '/docs/custom-property-structure/' | url }}) —
  primitive → semantic → module
- [Installation]({{ '/docs/installation/' | url }}) — library subpaths, checkout
  workflow
- [CLI reference]({{ '/docs/reference/' | url }}) — command cheat sheet
- [Mindset]({{ '/approach/' | url }}) — why the toolset is modular

---
layout: docs.njk
title: Semantic tokens
description: Shared intent-based custom property vocabulary, templates, and reference.
permalink: /docs/scaffold/semantic-tokens/
---

# Semantic tokens

Argot ships a **shared vocabulary** of CSS custom property names for UI intent:
surfaces, text, borders, type, space, motion, layout, and more. Names stay
stable across projects; **values** are yours.

The vocabulary is the second tier in
[custom property structure]({{ '/docs/custom-property-structure/' | url }})
(primitive → **semantic** → module).

## Browse the reference

The live catalog is generated from the same token JSON the CLI uses:

**[Browse tokens]({{ '/docs/tokens/' | url }})**

Each group includes descriptions, core/extended tier, optional `pairsWith` /
`related` links, and a short usage example.

## Emit a CSS template

```bash
argot semantics                         # ./semantics.css (core)
argot semantics ./styles/semantics.css
argot semantics --extended ./styles/semantics-extended.css
```

| Option | Meaning |
| --- | --- |
| `[path]` | Output file (default `./semantics.css`) |
| `--extended` | Include extended-tier names as well as core |

The file is a `:root { … }` block of empty (or starter) declarations, grouped
with comments matching the token sections. **Assign values** after emit—usually
by referencing primitives from a palette or hand-written scales:

```css
:root {
  /* color — text */
  --text-primary: light-dark(var(--gray-16), var(--gray-1));
  --text-secondary: light-dark(var(--gray-14), var(--gray-3));
  /* … */
}
```

**Note:** semantic generation overwrites the output path if it already exists
(unlike palette, which requires `--force`). It refuses to write onto a
directory.

## Core vs extended

| Tier | Intent |
| --- | --- |
| **Core** | Common UI needs most projects share |
| **Extended** | Optional extras (e.g. chart series, some icon roles) |

Default CLI and library generation emit **core only**. Pass `--extended` or
`{ extended: true }` for both.

## Groups

Token JSON lives in the package under `tokens/*.json` (and is importable as
`argot-css/tokens/*`). Groups include:

- Surfaces (`color-bg`)
- Text (`color-text`)
- Borders (`color-border`)
- Icons (`color-icon`, extended-heavy)
- Charts (`color-chart`, extended)
- Typography, spacing, borders (radius/width), motion, layout, misc (focus,
  shadow, …)

## Package entrypoints

| Path | Role |
| --- | --- |
| `argot-css/semantics` | `generateCss`, `renderCss`, `writeTemplate` (Node) |
| `argot-css/templates/semantics.css` | Static core template |
| `argot-css/templates/semantics-extended.css` | Static core + extended |
| `argot-css/tokens/*.json` | DTCG-shaped source records (names, metadata, tiers) |

There is no promise of full DTCG interchange compatibility—the JSON is Argot’s
vocabulary source of truth shaped for tooling.

```js
import { writeTemplate } from 'argot-css/semantics';

writeTemplate('./styles/semantics.css', { extended: false });
```

## Pairings and lint

Many color tokens declare **`pairsWith`** partners (e.g. text on surfaces). The
[color-contrast]({{ '/docs/processor/linting/color-contrast/' | url }}) rule uses
those relationships when both sides resolve to concrete colors. Pair metadata is
guidance plus lint fuel—not a guarantee that every theme assignment passes WCAG.

## With the scaffold

In a full tree, semantics load in the `theme` layer **after** primitives:

```css
@import 'primitives.css' layer(theme);
@import 'semantics.css' layer(theme);
```

Components and base styles should prefer semantic names so themes swap under the
hood. See [Architecture]({{ '/docs/scaffold/architecture/' | url }}).

## Related

- [Browse tokens]({{ '/docs/tokens/' | url }})
- [Palette generator]({{ '/docs/scaffold/palette-generator/' | url }})
- [Scaffold overview]({{ '/docs/scaffold/' | url }})
- [Getting started]({{ '/docs/getting-started/' | url }})

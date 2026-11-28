---
layout: docs.njk
title: Color contrast rule
description:
  Stylelint rule argot/color-contrast checks WCAG contrast for paired semantic
  tokens.
permalink: /docs/processor/linting/color-contrast/
---

# Color contrast rule

**Rule name:** `argot/color-contrast`

Checks that **paired semantic color tokens** meet a **WCAG 2.1 contrast ratio of
4.5:1** when both sides of a pair are declared and resolve to concrete colors.

## Enable

Via shareable config:

```js
export default {
  extends: ['argot-css/stylelint/config'],
};
```

Or explicitly:

```js
import { colorContrast } from 'argot-css/stylelint';

export default {
  plugins: [colorContrast],
  rules: {
    'argot/color-contrast': true,
  },
};
```

The processor’s default config enables this rule automatically.

## What it looks at

1. **Custom properties** in the stylesheet (`--*`).
2. **Primitives** — names matching a scale step pattern (`--name-1`,
   `--gray-16`, …) whose values look like colors (hex or common color functions
   such as `oklch()`, `rgb()`, …). These build a lookup table.
3. **Semantic tokens** — custom properties whose names appear in Argot’s
   packaged vocabulary (core tier loaded by the rule). Values are resolved
   through `var(...)` chains into primitives or other semantics when possible.
4. **`pairsWith` metadata** on each semantic token (from [Browse
   tokens]({{ '/docs/tokens/' | url }})). Only listed partners are compared.

If either side of a pair is missing, unresolved, or not a parseable color, that
pair is skipped (no report).

## Reporting

When a pair fails the 4.5:1 goal, Stylelint reports **on both declarations**,
for example:

```text
"--text-primary" and "--bg-main" have an insufficient contrast ratio of 1.16:1 (goal: 4.5:1) (argot/color-contrast)
"--bg-main" and "--text-primary" have an insufficient contrast ratio of 1.16:1 (goal: 4.5:1) (argot/color-contrast)
```

Each unique unordered pair is reported once per side (not duplicated further).

### Accept (strong contrast)

```css
:root {
  --gray-1: #ffffff;
  --gray-16: #000000;
  --text-primary: var(--gray-1);
  --bg-main: var(--gray-16);
}
```

### Reject (weak contrast)

```css
:root {
  --gray-1: #ffffff;
  --gray-16: #eeeeee;
  --text-primary: var(--gray-1);
  --bg-main: var(--gray-16);
}
```

## What it does not do

- Guarantee accessibility of the whole UI (components, states, images, focus)
- Compare arbitrary properties (only vocabulary tokens with `pairsWith`)
- Understand non-token authoring patterns or runtime theme switches outside the
  declared custom properties in the file under lint
- Enforce AAA (7:1); the threshold is AA-style **4.5:1** today
- Treat keyword colors (e.g. `red`) as primitives yet—prefer hex or color
  functions in checked values

`light-dark()` and other relative color syntax may not fully resolve; unresolved
values are skipped rather than false-failed when Color.js cannot parse them.

## How pairs are defined

Pairings live in token source (`tokens/*.json`) as `pairsWith` lists—typically
text/icon colors paired with surface backgrounds they are meant to sit on. The
browsable reference shows the same relationships under each token’s **Pairs
with** section.

Palette generation does **not** promise that mapped semantics will pass this
rule; assign and lint after mapping.

## Related

- [Linting overview]({{ '/docs/processor/linting/' | url }})
- [Custom property structure]({{ '/docs/custom-property-structure/' | url }})
- [Browse tokens]({{ '/docs/tokens/' | url }})

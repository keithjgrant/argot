---
layout: docs.njk
title: Custom property structure
description: Primitive, semantic, and module tiers for CSS custom properties.
permalink: /docs/custom-property-structure/
---

# Custom property structure

Argot’s main structural opinion is a **three-tier** split for CSS custom
properties. The model is encouraged inside a scaffolded project and useful
anywhere you want stable names with swappable values. It is not required if you
only use the [processor]({{ '/docs/processor/' | url }}).

Background reading:
[A structured approach to custom properties](https://keithjgrant.com/posts/2024/06/a-structured-approach-to-custom-properties/).

## The three tiers

### 1. Primitive

Raw materials: palette steps, font stacks, fixed scales. Names describe the
value, not where it appears in the UI.

```css
:root {
  --gray-3: oklch(93% 0.006 245deg);
  --gray-14: oklch(35% 0.02 245deg);
  --mint-7: oklch(72% 0.12 165deg);
  --font-body: system-ui, sans-serif;
  --space-md: 1rem;
}
```

Primitives can come from hand-written CSS or from the
[palette generator]({{ '/docs/scaffold/palette-generator/' | url }}).

### 2. Semantic

Intent: what the value is *for*. Semantic names stay stable across themes;
only the mapping to primitives changes.

```css
:root {
  --text-primary: light-dark(var(--gray-16), var(--gray-1));
  --text-secondary: light-dark(var(--gray-14), var(--gray-3));
  --bg-raised: light-dark(var(--gray-3), var(--gray-11));
  --border-color: var(--gray-10);
}
```

Argot ships a curated set of semantic names as JSON and as CSS templates. See
[Semantic tokens]({{ '/docs/scaffold/semantic-tokens/' | url }}) and
[Browse tokens]({{ '/docs/tokens/' | url }}).

### 3. Module

Component-local decisions. Prefer a short prefix tied to the component so the
property does not leak into the global design language.

```css
.card {
  --card-padding: var(--space-md);
  --card-radius: var(--border-radius-md);

  padding: var(--card-padding);
  border-radius: var(--card-radius);
  background: var(--bg-raised);
  color: var(--text-primary);
}
```

Module properties may reference semantic or primitive tokens. Avoid reaching for
raw palette steps from deep in a component tree when a semantic name already
exists—that is how themes stay coherent.

## How the tiers relate

```text
primitives  →  semantics  →  modules / components
(raw values)   (intent)      (local decisions)
```

- **Theme by reassigning semantics** (and primitives underneath them), not by
  hunting through components for `--gray-14`.
- **Style components with semantic and module names** so markup does not hard-code
  palette steps.
- **Keep module names out of the shared vocabulary** unless a value truly is
  cross-cutting; then promote it to semantic.

## Core vs extended

Semantic tokens are marked **core** or **extended**. Core aims to cover common
UI needs; extended covers charts, icon colors, and other optional surface area.
Generate only core, or core plus extended, when you emit a template.

## Where this shows up in Argot

| Concern | Where |
| --- | --- |
| Vocabulary + metadata | `tokens/*.json`, browsable at [Browse tokens]({{ '/docs/tokens/' | url }}) |
| Empty semantic template | `argot semantics` / [Semantic tokens]({{ '/docs/scaffold/semantic-tokens/' | url }}) |
| Primitive scales | `argot palette` / [Palette generator]({{ '/docs/scaffold/palette-generator/' | url }}) |
| Starter file layout | [Scaffold]({{ '/docs/scaffold/' | url }}) |
| Contrast of paired semantics | [Color contrast rule]({{ '/docs/processor/linting/color-contrast/' | url }}) |

## Mild opinion, held loosely

You can process any CSS with Argot and ignore this model. You can adopt the
semantic names without the palette engine. You can generate a palette without
using the semantic template. The tiers are a shared language when you want one,
not a gate on the rest of the toolset.

See also [Mindset]({{ '/approach/' | url }}).

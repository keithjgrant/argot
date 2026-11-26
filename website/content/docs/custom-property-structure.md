---
layout: docs.njk
title: Custom property structure
description: Primitive, semantic, and module tiers for CSS custom properties.
permalink: /docs/custom-property-structure/
human-reviewed: true
---

# Custom property structure

Argot’s main prescriptive opinion is a **three-tier** approach to CSS custom
properties. This model is encouraged inside a scaffolded project and useful
anywhere you want stable names with swappable values.

Argot's tools all still work if you don't follow this approach, but the provided
[lint rules]({{ '/docs/processor/linting/#rules' | url }}) are built to enforce
it.

Background reading:
[A structured approach to custom properties](https://keithjgrant.com/posts/2024/06/a-structured-approach-to-custom-properties/).

## The three tiers

Every CSS custom property belongs to one of three categories. When writing or
using any custom property, it should be clear which tier that property belongs
to.

### 1. Primitive

_Primitive_ properties are static, raw values used to build your site's design.
This primary includes color palettes, but it can sometimes be useful to
articulate font families or spacing in this tier as well.

```css
:root {
  --gray-3: oklch(93% 0.006 245deg);
  --gray-14: oklch(35% 0.02 245deg);
  --mint-7: oklch(72% 0.12 165deg);

  --font-body: system-ui, sans-serif;
}
```

Primitives can come from hand-written CSS or from Argot's [palette
generator]({{ '/docs/scaffold/palette-generator/' | url }}).

### 2. Semantic

_Semantic_ properties define the intent of various design tokens. Use this tier
of custom properties to apply your primitive values to specific design purposes.

```css
:root {
  --text-primary: light-dark(var(--gray-16), var(--gray-1));
  --text-secondary: light-dark(var(--gray-14), var(--gray-3));
  --bg-raised: light-dark(var(--gray-3), var(--gray-11));
  --border-color: var(--gray-10);
}
```

Argot ships a curated set of semantic names as JSON and as CSS templates. Many
projects will require more semantic properties beyond these, but these are
provided as universally applicable starting point, and provide a common language
you can use across various projects.

Semantic properties are globally available on your site, but they may
dynamically change based on color theme, media query, or other purposes. See
[Semantic tokens]({{ '/docs/scaffold/semantic-tokens/' | url }}) for a more
detailed look.

### 3. Module

_Module_ properties are values used for individual components in your design.
Argot's suggested approach is to begin these properties with an underscore to
indicate this intent. Module properties may reference semantic or primitive
tokens.

```css
.card {
  --_card-padding: var(--space-md);
  --_card-radius: var(--border-radius-md);

  padding: var(--card-padding);
  border-radius: var(--card-radius);
  background: var(--bg-raised);
  color: var(--text-primary);
}
```

## How the tiers relate

Values from primitive properties are used to build out semantic properties.
Values from either may be used to build out model properties.

```text
primitives  →  semantics  →  modules
(raw values)   (intent)      (local decisions)
```

- **Primitive values never change**. `--blue-3` is always the same value,
  regardless of light or dark theme.
- **Build your theme by defining/editing semantic properties**, not by hunting
  through styles for `--gray-14`.
- **Style modules with semantic and module properties** so there is always a
  configurable layer of abstraction between primitive values and your design.
- **Keep module names out of the semantic properties**. If a value is
  cross-cutting, promote it to semantic property.

## Core vs extended

Argot's semantic properties are built from a set of [design
tokens]({{ '/docs/scaffold/semantic-tokens' | url }}). Each is are marked
**core** or **extended**. Core properties to cover common UI needs; extended
values add support for charts, icon colors, and other design needs.

## This is only a suggestion

You can process any CSS with Argot and ignore this model. You can adopt the
semantic names without the palette engine. You can generate a palette without
using the semantic template. The tiers are a shared language when you want one,
not a requirement to use the toolset.

Argot's Stylelint rules are the only place where this approach is expected. They
are primarily designed to help apply this consistently.

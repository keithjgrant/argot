---
layout: base.njk
title: Getting started
description:
  Generate a semantic token template, assign your own values, and use Argot in
  your CSS.
permalink: /getting-started/
---

# Getting started

Argot is a set of semantic CSS custom property names—not a component library,
primitive palette, or CSS framework. Generate a template, assign your values,
and use the shared names in your stylesheets.

## 1. Generate a template

The CLI requires Node.js 22.16 or newer.

Run this from your project directory:

```sh
npx @keithjgrant/argot generate
```

This writes the core tokens to `semantics.css`. To include extended tokens or
choose another output file:

```sh
npx @keithjgrant/argot generate --extended
npx @keithjgrant/argot generate ./styles/tokens.css
```

Treat generation as a starting step: generating again at the same path
overwrites that file, including any values you have assigned.

## 2. Assign your values

Most tokens intentionally have no assigned value. Fill them in directly or map
them to your own primitive tokens. A few, such as easing curves and z-index
levels, already have starter values in the generated template.

```css
:root {
  /* Primitives: values specific to your design */
  --neutral-50: #f7fafb;
  --neutral-950: #18242b;
  --blue-700: #174ea6;

  /* Semantics: what those values are for */
  --bg-main: var(--neutral-50);
  --text-primary: var(--neutral-950);
  --text-interactive: var(--blue-700);
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --border-radius-md: 0.5rem;
}
```

These values are examples, not Argot defaults. Assign every token you use: an
empty custom property is not a useful design value. Check contrast for your
actual foreground/background combinations, including hover and focus states.

## 3. Style with semantic names

Load your filled-in stylesheet before the styles that consume it.

```html
<link rel="stylesheet" href="/styles/semantics.css" />
<link rel="stylesheet" href="/styles/components.css" />
```

```css
.card {
  color: var(--text-primary);
  background: var(--bg-main);
  padding: var(--space-lg);
  border-radius: var(--border-radius-md);
}
```

Components refer to intent rather than palette steps. To add another theme,
override the semantic assignments under your theme selector.

## Core and extended tokens

**Core** covers common needs: surfaces, text, borders, typography, spacing,
motion, layout, focus, and shadow. **Extended** adds roles such as independent
icon colors, chart series, and extra surface levels. These are breadth tiers,
not the primitive/semantic/component layers—all Argot tokens are semantic.

Use the subset your project needs. You can add project-specific semantics and
component properties alongside Argot.

<p><a href="{{ '/tokens/' | url }}">Browse the complete token reference →</a></p>

## Beta feedback

Argot is ready for beta use. Feedback from real projects is especially useful:
missing roles, unclear distinctions, or names that do not fit how you build.
Names may be refined during beta.

[Share your experience on GitHub](https://github.com/keithjgrant/argot/issues).

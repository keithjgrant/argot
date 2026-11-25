---
layout: docs.njk
title: What is Argot?
description:
  A modular CSS toolset—processor, optional lint, palette, semantic tokens, and
  stylesheet scaffold.
permalink: /docs/
human-reviewed: true
---

# What is Argot?

Argot is a modular **CSS toolset** built for developing with modern CSS.

The era of the CSS preprocessor has essentially passed, as native CSS can do
nearly everything developers once relied on preprocessors to do: variables,
color manipulation, nesting, mathematical calculations, and mixins.

Argot is a toolset designed not to get in the way of modern CSS, but instead
supplement your development workflow to streamline daily development, guide CSS
architecture, and speed the early stages of project setup.

- **[Processor]({{ '/docs/processor/' | url }})** — resolve `@import`s locally,
  lint, and minify to an output CSS file.
- **[Stylesheet scaffold]({{ '/docs/scaffold/' | url }})** — create a starter
  CSS tree (layers, reset, primitives, semantics). Incorporates color palettes
  and "semantic" custom properties.
- **[Palette generator]({{ '/docs/scaffold/palette-generator/' | url }})** —
  turn given color "seeds" into a palettes of 16 color shades for your site.
- **[Semantic tokens]({{ '/docs/scaffold/semantic-tokens/' | url }})** — a
  shared vocabulary of intent-based custom properties, plus a [browsable
  reference]({{ '/docs/tokens/' | url }}).
- **[Linting]({{ '/docs/processor/linting/' | url }})** — run Stylelint as part
  of the processor workflow. Argot provides extra lint rules to guide the use of
  custom properties for palette primitives and semantic tokens.

Argot provides some opinions on how to best structure your custom properties,
but you are not required to follow this. The processor will work no matter how
you author your stylesheets; you are free to use the generated palettes however
you wish; Argot does not apply its opinionated lint rules unless you opt in to
them.

Use the features that are useful to you and disregard the rest.

## Start here

1. [Getting started]({{ '/docs/getting-started/' | url }}) — process CSS, adopt
   tokens, optional palette and lint.
2. [Installation]({{ '/docs/installation/' | url }}) — requirements and package
   entrypoints.
3. [Custom property structure]({{ '/docs/custom-property-structure/' | url }}) —
   the three-tier model Argot is built around.

For the product mindset (modularity, ownership, mild opinions), see
[Mindset]({{ '/approach/' | url }}).

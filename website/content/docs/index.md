---
layout: docs.njk
title: What is Argot?
description: A modular CSS toolset—processor, optional lint, palette, semantic tokens, and a planned scaffold.
permalink: /docs/
---

# What is Argot?

Argot is a **modular CSS toolset** for projects that already lean on modern CSS.
It helps with the parts that stay hard: assembling stylesheets, agreeing on
custom-property names, and (soon) starting from a small layered architecture.

Use the pieces you need. Nothing silently pulls in the rest.

## What’s available now

- **[Processor]({{ '/docs/processor/' | url }})** — resolve local `@import`s
  (including mid-file and `layer()`), lint, and minify to a single CSS file.
- **[Palette generator]({{ '/docs/scaffold/palette-generator/' | url }})** —
  turn numeric OKLCH seeds into primitive color scales.
- **[Semantic tokens]({{ '/docs/scaffold/semantic-tokens/' | url }})** — a shared
  vocabulary of intent-based custom properties, plus a
  [browsable reference]({{ '/docs/tokens/' | url }}).
- **[Linting]({{ '/docs/processor/linting/' | url }})** — optional Stylelint
  rules; color contrast ships today.

## What’s still cooking

- **[Stylesheet scaffold]({{ '/docs/scaffold/' | url }})** — a starter CSS tree
  (layers, reset, primitives, semantics, modules). Documented as the target
  shape; the `scaffold` / `init` command is not shipped yet.
- Additional lint rules for property naming and usage.

## Start here

1. [Getting started]({{ '/docs/getting-started/' | url }}) — process CSS, adopt
   tokens, optional palette and lint.
2. [Installation]({{ '/docs/installation/' | url }}) — requirements and package
   entrypoints.
3. [Custom property structure]({{ '/docs/custom-property-structure/' | url }}) —
   the three-tier model Argot is built around.

For the product mindset (modularity, ownership, mild opinions), see
[Mindset]({{ '/approach/' | url }}).

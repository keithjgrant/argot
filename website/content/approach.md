---
layout: base.njk
title: Mindset
description: Mild opinions, held loosely—modularity, ownership, and three-tier custom properties.
permalink: /approach/
---

# Mild opinions, held loosely

Argot is a **toolset**, not a component framework. Modern CSS already covers most of what preprocessors used to do. What’s still hard is structure: cascade layers, a clear file map, and custom properties that mean the same thing from project to project.

## Use the pieces you want

Adopt independently:

- **Processor** alone on any CSS
- **Scaffold** alone as a starting tree
- **Palette** generation alone
- **Semantic token** template alone
- **Stylelint** only if you want the guardrails

Nothing should silently pull in the rest.

## Three-tier custom properties

Inside the scaffold, the main opinion is a simple split:

1. **Primitive** — raw materials (`--gray-12`, fonts, fixed scales)
2. **Semantic** — intent (`--text-primary`, `--bg-raised`)
3. **Module** — component-local decisions (`--card-padding`)

That model is encouraged, not mandatory, if you only use the processor.

## Your CSS after scaffold

Scaffold output is a starting point you own. Regeneration is explicit. The processor builds the CSS it’s given; it does not claim your source tree.

<div class="shell-placeholder">Fuller essay and diagrams later. File-level detail lives in Docs → Scaffold.</div>

<p><a href="{{ '/docs/scaffold/custom-properties/' | url }}">Custom properties in docs</a> · <a href="{{ '/docs/getting-started/' | url }}">Get started</a></p>

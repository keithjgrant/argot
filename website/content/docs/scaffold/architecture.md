---
layout: docs.njk
title: Architecture
description: Cascade layer order and stylesheet file map for an Argot scaffold.
permalink: /docs/scaffold/architecture/
---

# Architecture

Scaffolded CSS is organized around **cascade layers** and a thin **file map**.
The goal is predictable override order without a heavy framework.

This site’s entrypoint is the working model:

```css
@layer reset, base, theme, layout, modules, utilities;

@import 'reset.css' layer(reset);
@import 'base.css' layer(base);
@import 'primitives.css' layer(theme);
@import 'semantics.css' layer(theme);
@import 'layout.css' layer(layout);
@import 'modules/index.css' layer(modules);
```

Packaged starter templates under `templates/` use the same layer list (layout
may be omitted until you need it).

## Layer order

Layers are listed **weakest → strongest** in the `@layer` rule. Later layers win
when specificity is equal.

| Layer       | Role                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------- |
| `reset`     | Normalize box model, margins, media defaults, reduced-motion                                 |
| `base`      | Document-level element styles (`body`, links, headings, form controls) using semantic tokens |
| `theme`     | Design tokens: primitives and semantic custom properties                                     |
| `layout`    | Shared page structure (containers, stacks, docs chrome)                                      |
| `modules`   | Component and feature styles                                                                 |
| `utilities` | Reserved for small, intentional overrides                                                    |

Put **token definitions in `theme`**, not in `modules`, so components consume
`var(--text-primary)` instead of re-declaring palette steps.

Primitives and semantics both sit in `theme` so token cascades stay together;
load primitives **before** semantics so `var(--gray-16)` resolves when semantics
reference them.

## File responsibilities

### `styles.css` (entry)

Declares layer order and imports partials **into** those layers via
`@import '…' layer(name)`. With Argot’s
[processor]({{ '/docs/processor/' | url }}), imports may appear after the
`@layer` statement (mid-file imports are supported when assembling). Keep this
file short—it is a map, not a dumping ground.

### `reset.css`

Browser-normalization only. Prefer unset margins, inherited form fonts, and
responsive media defaults. Avoid colors and type scales here; those belong in
theme + base.

### `base.css`

Element defaults wired to **semantic** tokens (`--bg-body`, `--text-primary`,
`--font-body`, …). This is where `color-scheme`, focus rings, and heading rhythm
usually live.

### `primitives.css`

Raw materials: palette steps (`--gray-1` … `--gray-16`, `--brand`, …), and any
other non-semantic scales you choose to hand-author. Often produced by the
[palette generator]({{ '/docs/scaffold/palette-generator/' | url }}).

### `semantics.css`

Intent names from Argot’s vocabulary (`--text-primary`, `--bg-raised`,
`--space-md`, …) mapped to primitives or literals. Start from `argot semantics`
or the packaged templates; see [Semantic
tokens]({{ '/docs/scaffold/semantic-tokens/' | url }}).

### `layout.css`

Optional shared structure (content width, page frames, sidebar grids). Skip the
file until layout patterns repeat.

### `modules/`

One partial per component or UI area, aggregated by `modules/index.css`:

```css
@import 'skip-link.css';
@import 'page-header.css';
/* … */
```

Module-tier custom properties stay **local** to the component (`--card-padding`)
when they are not part of the shared vocabulary. See [Custom property
structure]({{ '/docs/custom-property-structure/' | url }}).

## Build output vs source

```text
styles/          # source (yours)
dist/styles.css  # processor output (generated)
```

The processor writes **only** the designated output path. It does not modify
scaffold source. Keep generated CSS out of the source tree you edit by hand.

## Without the processor

If you skip Argot’s assembler:

- Prefer top-of-file `@import`s for native CSS or tools that follow the spec,
  **or**
- Use another bundler that inlines imports the same way.

Layer wrappers (`layer(name)` on `@import`) still need a tool that understands
them when inlining; Argot’s processor does.

## Related

- [Scaffold overview]({{ '/docs/scaffold/' | url }}) — ownership and init
- [Processor]({{ '/docs/processor/' | url }}) — assemble, lint, minify

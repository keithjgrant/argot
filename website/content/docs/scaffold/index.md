---
layout: docs.njk
title: Scaffold
description:
  Starter CSS tree—layers, reset, base, primitives, semantics, and modules you
  own.
permalink: /docs/scaffold/
---

# Scaffold

The scaffold drops a **small, layered CSS project** into your repo: an entry
stylesheet, reset, base styles, hooks for primitives and semantics, and a place
for modules. After write, those files are ordinary project source—edit them,
commit them, and build them with the [processor]({{ '/docs/processor/' | url }})
(or any other tool you prefer).

Scaffold is independent of the processor. You can adopt the tree without Argot’s
build step, or process CSS that never came from a scaffold.

## Command

```bash
argot scaffold [directory]
```

Default target is the current working directory (or a path you pass). The
command refuses to overwrite existing project files unless you pass an explicit
force flag; prefer a dry-run first when unsure. See [CLI
reference]({{ '/docs/reference/' | url }}) for flags, and
[Architecture]({{ '/docs/scaffold/architecture/' | url }}) for the file map
(aligned with packaged `templates/` and this site’s `website/styles/`).

## What you get

A typical layout (names may match `styles/` in the app):

```text
styles/
  styles.css          # entry: @layer order + @import into layers
  reset.css           # box model, form fonts, reduced-motion baseline
  base.css            # document defaults using semantic tokens
  primitives.css      # palette scales / raw values (often generated)
  semantics.css       # intent tokens mapped to primitives
  layout.css          # optional shared layout helpers
  modules/
    index.css         # @import each module partial
    ….css
```

This documentation site’s `website/styles/` follows the same pattern and is a
live example of the architecture.

## Ownership

| Kind of file                             | Who owns it after scaffold                                                                                |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Entrypoint, reset, base, layout, modules | **You** — edit freely; scaffold does not reclaim them                                                     |
| Semantic mappings (`semantics.css`)      | **You** — fill and maintain values; regenerate only when you choose a fresh template                      |
| Primitive palette CSS                    | **Generator-owned** when produced by `argot palette` — regenerate from the JSON definition with `--force` |
| Build output (`dist/…`)                  | **Processor** — never confuses source with output                                                         |

Rules of thumb:

- **Generation is never an implicit build step.** Processing CSS does not run
  scaffold, palette, or semantics generation.
- **Regeneration is explicit.** Palette rewrite needs `--force` (and supports
  `--dry-run`). Semantic template write currently overwrites the target path;
  point it at a path you intend to replace, or keep mappings in a file you own
  by hand.
- **Destructive replacement of consumer-owned source is refused by default** on
  scaffold init.

## Compose the pieces

You do not have to take the whole tree:

1. **Scaffold only** — get layers and file habits; assign token values yourself.
2. **Semantics only** — `argot semantics` without a full scaffold (see [Semantic
   tokens]({{ '/docs/scaffold/semantic-tokens/' | url }})).
3. **Palette only** — `argot palette` into any primitives file (see [Palette
   generator]({{ '/docs/scaffold/palette-generator/' | url }})).
4. **Full path** — scaffold → palette → fill semantics →
   `argot styles/styles.css dist/styles.css`.

## Next

- [Architecture]({{ '/docs/scaffold/architecture/' | url }}) — cascade layers
  and file responsibilities
- [Custom property structure]({{ '/docs/custom-property-structure/' | url }}) —
  primitive → semantic → module
- [Getting started]({{ '/docs/getting-started/' | url }})

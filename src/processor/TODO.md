# Processor TODO

## Core

1. Import .argot.json
2. Support key cli args -- cli should override .argot.json

- sourceFile
- destFile
- browserlist (for cssnano)
- minify flag

## atImport test gaps

Code already claims these behaviors; add coverage:

6. **`data:` and protocol-relative `//…`** — leave remote/data URIs unchanged
   (only `https://` is tested today).
7. **Self-import** — `@import` of the entry file should cycle (or dedupe)
   cleanly.

## Semantic / product cases

Fixtures and tests do not stress the scaffold pattern:

8. **Layer order + import** — `@layer reset, base, modules;` then
   `@import … layer(base)`; order declaration should survive and inlined rules
   should sit in `@layer base`.
9. **Dedupe vs layers** — first import wins; a later
   `@import './shared.css' layer(base)` is dropped (content not re-wrapped).
   Lock or revisit this behavior.
10. **Nested layer wrapping** — `A` imports `B layer(outer)`, `B` imports
    `C layer(inner)` → nested `@layer outer { @layer inner { … } }`.
11. **Same file via different relative paths** — `./shared.css` vs
    `../x/shared.css` should resolve once and dedupe.

## Intentional limitations

Document or reject-test (do not expand support unless the contract changes):

- **Bare unquoted paths** (`@import base.css`) — not string/`url()`; parser
  returns null. -- what does CSS spec allow?

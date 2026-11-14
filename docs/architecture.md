# Argot architecture

This document records boundaries for the expanded
[product scope](./product-scope.md). Module responsibilities and ownership rules
are agreed direction; directory names, new command names, and API signatures
below are provisional. See the [roadmap](./roadmap.md) for sequencing.

## Current foundation

`tokens/` defines the semantic vocabulary. `src/load-tokens.js` loads it for CSS
generation and the existing Eleventy website. `src/generate.js` already
separates rendering from writing files. The CLI currently generates semantic
templates; Stylelint entrypoints exist, but the token rule is a placeholder.

The PostCSS sibling contains a proposed pipeline, not an implementation. Theme
Machine contains reusable palette algorithms, but its current palette module
imports browser-oriented application context and uses different semantic names
from Argot.

## Module boundaries

- **Tokens:** load and index the semantic vocabulary and render templates.
  Names, descriptions, tiers, and relationships remain authoritative in
  `tokens/*.json`.
- **Palette:** calculate structured color scales from explicit inputs, then
  serialize them through a separate CSS renderer. No DOM, Lit, URL state, or
  filesystem dependency in the calculation layer.
- **Scaffold:** compose palette output, semantic mappings, and static templates;
  handle safe source-file creation.
- **PostCSS:** expose a token-agnostic preset and processing API. Start with
  import resolution and optional minification; lint remains separate.
- **Build:** adapt the processing API to input/output paths, source maps,
  errors, and CLI exit status.
- **Stylelint:** optional integration that can use token metadata without
  becoming a dependency of generation or processing.
- **Website:** consume shared token data and eventually document all
  capabilities; it is not a dependency of the published runtime.

Keep the CLI thin. Library consumers should not have to invoke a subprocess.
Token/template consumers should not load processing or lint modules merely by
importing their own entrypoint.

## Vocabulary versus theme

Semantic names and their metadata are not a default design. Keep starter values
and semantic-to-primitive mappings in separate presets rather than filling the
shared vocabulary with one palette's values.

Preserve two use cases:

- **Template mode:** emit semantic names with empty values for consumers to fill
  in, as the current generator does.
- **Starter mode:** provide usable primitives and semantic values for the
  included base styles. It need not populate every extended token.

Retain the current lightweight token tooling. Style Dictionary or Terrazzo is
worth revisiting only if additional output formats justify it.

Palette generation alone does not guarantee accessible semantic pairings.
Contrast reporting can later build on explicit mappings and `pairsWith`
metadata; it must not imply a blanket accessibility guarantee.

## Proposed source layout

Evolve the existing package incrementally rather than reorganizing everything
before the first feature:

- `src/tokens/`: existing loading, indexing, and template-rendering
  responsibilities.
- `src/palette/`: scale calculations, gamut handling, and CSS serialization.
- `src/scaffold/`: preset composition and safe file creation.
- `src/postcss/` and `src/build/`: processing and filesystem/CLI adaptation.
- `src/cli/` and `src/stylelint/`: command dispatch and optional lint
  integration.
- `tokens/`: existing vocabulary JSON.
- `presets/`: starter values and semantic mappings.
- `templates/project/`: entrypoint, reset, and minimal base templates.
- `test/fixtures/`: generated-project and processing integration cases.
- `website/`: existing Eleventy site.

Preserve published semantic templates and existing generation/Stylelint exports
as internals move.

## Public interfaces

Preserve `argot generate` and the current `./generate` entrypoint. Proposed
additional command responsibilities are:

- `argot init`: create the project scaffold.
- `argot palette`: generate or regenerate primitive properties independently.
- `argot build`: process an existing CSS entrypoint.

Expose palette and PostCSS library entrypoints separately from their CLI
adapters. Exact flags, configuration discovery, and export names remain to be
designed. Use the portable contracts below rather than introducing a universal
configuration platform.

## Portable definitions and handoffs

Use small, independently usable data contracts so browser interfaces, files, and
library callers can exchange generation inputs without sharing application
state. Exact schemas and import/export command syntax remain provisional.

- **Palette definition:** named seed colors, scale options, and output color
  space/gamut choices.
- **Semantic definition:** mappings from semantic names to primitive references
  or literal values. Start with Argot's vocabulary; creating or extending the
  vocabulary is a separate future decision.
- **Scaffold options:** select the definitions and starter templates to compose.
  Project configuration may reference separate definition files rather than
  embedding everything in one document.

Start with plain JSON and explicit format versions. Share validation across
consumers, with useful errors for unsupported versions, invalid values, and
unresolved references. Validate each contract independently where possible;
check cross-definition references when definitions are composed.

Portable definitions contain no browser state, executable configuration, or
filesystem paths. File resolution and output locations belong to a local
project/CLI adapter, not to exported palette or semantic data. Define
composition and conflict behavior explicitly rather than relying on implicit
merging.

Definitions are generation inputs, not a serialization of rendered CSS. Support
exporting and loading definitions without promising to reconstruct them from
user-edited CSS. The processor continues to accept CSS without loading or
understanding these contracts.

An initial handoff is a Theme Machine palette export that Argot validates and
uses to generate primitive CSS. A future semantic editor could export the
semantic contract through the same pattern. The contracts do not require
interactive editors, live synchronization, or arbitrary third-party importers.

## Generated CSS and file ownership

A proposed scaffold has `styles/style.css`, `styles/tokens/primitives.css`,
`styles/tokens/semantics.css`, `styles/reset.css`, and `styles/base.css`, with
component styles added by the consumer. Build output goes to a separate location
such as `dist/style.css`.

The entrypoint declares cascade-layer order before importing files into their
intended layers. The source remains native CSS with no proprietary directives,
so consumers can replace Argot's processor.

Ownership rules:

- Initialization copies entrypoint, reset, base, and semantic mappings;
  consumers own and edit those files thereafter.
- When semantic mappings are supplied as a portable definition, regeneration
  must target an explicitly designated generated file, not silently replace
  consumer-owned semantic CSS. Import support does not change ownership.
- Explicit palette regeneration owns a clearly marked generated primitive file.
  Its recipe, when present, is the regeneration input.
- Builds write only designated build output, never source files.
- Refuse destructive source-file replacement by default. Explicit overwrite and
  dry-run behavior must make affected files clear before changes.
- Generation is never an implicit build step.

## Theme Machine boundary

Preserve Theme Machine's tuned curves and calculations, including fixed
endpoints and the interaction between centered lightness and weighted chroma.
Keep full precision through calculations and gamut mapping; round only when
serializing CSS to limit output size. Curve changes require separate review,
not incidental changes during extraction.

Extract algorithms from `../tools/src/js/theme-machine/common/paletteUtil.ts`
into a headless API with independent input types. Do not carry over its
application context or its older semantic vocabulary. Its interactive
application stays in `../tools` and may later consume the extracted engine
instead of maintaining duplicate algorithms. Add definition export/import as a
separate integration using the portable palette contract, not by exposing Theme
Machine's internal app context.

## Website during implementation

Keep the existing website build working and preserve shared token-data
compatibility. Its content and presentation may lag behind implementation:
per-milestone website completeness or production readiness is not required. Full
alignment is the final roadmap phase and can be brought forward if publication
becomes a priority.

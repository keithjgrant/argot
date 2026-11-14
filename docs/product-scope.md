# Argot product scope

Argot is a **modular, modern CSS starter toolkit** built around an opinionated
semantic custom-property convention. Its intended workflow is to select colors,
generate primitives and semantic properties, scaffold a small CSS architecture,
and process its imports into deployable CSS.

This is the agreed product direction, not a claim that all capabilities exist.
It supersedes the earlier decision to keep Argot and the PostCSS pipeline as
separate products, including the split described in `../postcss-preset/PLAN.md`.
That sibling currently contains planning guidance, not a pipeline
implementation.

## In scope

- **Semantic vocabulary:** DTCG-shaped token JSON, metadata, and CSS template
  generation. Preserve the existing template-only use case.
- **Primitive palettes:** headless color-scale generation extracted from the
  relevant parts of Theme Machine in `../tools`.
- **Portable definitions:** small, versioned data contracts for palette inputs,
  semantic mappings, and handoffs between generators and external authoring
  interfaces. Exact schemas remain to be designed; interactive editors are not a
  prerequisite.
- **Scaffolding:** primitives, semantic properties, explicit cascade layers, an
  entrypoint stylesheet, a reset, and minimal base styles.
- **CSS processing:** a small, token-agnostic PostCSS preset/API and a thin
  build runner for imports and optional minification.
- **Optional linting:** Stylelint plugin/config, without mandatory
  lint-on-build. The existing rule is currently a placeholder.
- **Website:** expand and refine the existing Eleventy site and metadata-driven
  token reference. Full alignment and publishing readiness belong to the final
  roadmap phase unless publication becomes a nearer-term priority.

## Out of scope

- Theme Machine's interactive application: color wheel, previews, Lit
  components, and browser/URL state remain on https://tools.keithjgrant.com.
- A development server or HMR: host tools such as Vite and Eleventy own these.
- A component framework or substantial utility library.
- Broad CSS transpilation or automatic prefixing as implicit defaults.
- Figma integration and multi-platform token synchronization.

## Independence and packaging

Applications may use:

1. Palette generation (primitive tokens) on its own.
2. Semantic tokens on their own, with or without Stylelint.
3. Scaffold generation without Argot's processor.
4. The processor without Argot's scaffold or token generation.
5. The complete workflow.

Generation creates project source; processing builds existing CSS. Neither
silently invokes the other. Processing must not depend on token metadata,
palette generation, or Stylelint.

Start with one repository and one npm package, using independent internal
modules and public entrypoints. Subpath exports separate APIs, not installation
size. Revisit package extraction if dependency weight or a distinct audience
justifies it; a workspace monorepo is not a prerequisite.

See [architecture](./architecture.md), [roadmap](./roadmap.md), and
[token source and tooling](./token-source-and-tooling.md).

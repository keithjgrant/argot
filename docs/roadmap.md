# Argot roadmap

Deliver independently useful capabilities toward the expanded
[product scope](./product-scope.md), following the boundaries in
[architecture](./architecture.md). These are deliverables and exit criteria, not
a fixed task backlog. New command names are provisional.

Throughout implementation, preserve existing generation and package entrypoints,
keep the website build working, and maintain shared token-data compatibility.
Website content, presentation, and publishing readiness may lag until the final
phase. Bring relevant website work forward if publication becomes a priority.

## Phase 1: Headless palette generation

**Deliverable:** Generate primitive CSS properties from named seed colors,
independently of scaffolding or builds.

Extract relevant Theme Machine algorithms, separate calculation from CSS
serialization and file writing, and choose a small supported set of curve and
format options. Cover extreme lightness, achromatic inputs, gamut handling, and
deterministic output with tests.

**Exit criterion:** Palettes can be generated in Node without Lit, browser
globals, or Theme Machine application state, while current semantic generation
continues to work.

## Phase 2: Useful CSS scaffold

**Deliverable:** An initialization command creates an editable CSS project with
primitives, semantic properties, explicit layer order, an entrypoint, a reset,
and minimal base styles.

Start with one usable starter preset and noninteractive options rather than an
interactive questionnaire. Preserve semantic-template-only generation. Establish
source-file ownership, dry-run behavior, and explicit overwrite safeguards.

**Exit criterion:** A basic HTML page works with the starter values; users can
process the CSS with other tools; rerunning initialization cannot silently
destroy edits.

This is the first substantial starter-toolkit release opportunity. It does not
depend on the processing runner.

## Phase 3: Minimal PostCSS processing

**Deliverable:** A standalone preset/processing API and thin build command.

Support import resolution, explicit input/output paths, source maps, useful
diagnostics, and optional minification. Leave watch, dev servers, and HMR to
host tools initially. Do not implicitly run generation or Stylelint.

**Exit criterion:** Both an Argot scaffold and unrelated handwritten CSS build
successfully without requiring token metadata, palette generation, or Stylelint.

## Phase 4: Prove the combined workflow

**Deliverable:** A reliable install-to-build experience, validated against real
projects and host integrations.

Dogfood on a real project, test standalone and host-managed processing, and test
the packed npm artifact from outside this checkout. Verify imports, cascade
layers, source maps, production output, and editing versus regeneration
behavior. Document supported workflows in package-facing guidance without
requiring the website to catch up yet.

The website can be a dogfooding target, but migrating it to the new processor is
not a prerequisite.

**Exit criterion:** Consumers can adopt the full workflow or individual
capabilities without hidden coupling.

## Phase 5: Optional design assistance

**Deliverable:** Selected improvements supported by actual use.

Candidates include light/dark mapping presets, contrast reports based on
semantic mappings, useful Stylelint rules, and adoption of the extracted palette
engine by Theme Machine.

This phase is optional, not a release gate or a prerequisite for website
alignment. Choose its scope after the core workflow has been exercised.

**Exit criterion:** Any selected feature has an explicit contract and tests
without making lint, contrast checks, or browser UI dependencies mandatory.

## Final phase: Website alignment and publishing readiness

**Deliverable:** Expand and refine the existing `website/` to accurately present
the capabilities that actually shipped.

Cover:

- Toolkit positioning and navigation, including independently usable features.
- Getting started and an explanation of the generated CSS architecture.
- Palette options, scaffold ownership/regeneration, CLI and library APIs.
- Standalone processing and supported host integrations.
- Preservation and refinement of the metadata-driven semantic token reference.
- Accessibility, responsive behavior, working examples and links, and deployment
  checks including path-prefix hosting.

**Exit criterion:** The site matches supported behavior, its tests/lint/build
pass, and it is ready to publish. Publishing itself remains a separate decision.
If publication is desired earlier, pull this work forward and document only the
capabilities available at that point.

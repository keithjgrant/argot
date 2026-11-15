# Argot

A standardized set of **semantic design token names**, plus headless **primitive
color palette generation**, packaged for modern CSS projects. Use either
independently, or generate a palette and map semantic properties to it.

See the [public API and CLI reference](./docs/api.md) for package imports,
portable definitions, options, return values, and file-writing behavior.

Argot is ready for beta use. The token set is deliberately defined; real-world
adoption will help prove it out and refine it. Names may change during beta.

## Why this exists

With modern CSS, preprocessors do less of the work we once needed them for.
What’s still hard is _design architecture_: agreeing on which tokens mean what,
and using them consistently.

The expectation here is for CSS custom properties to
[fall into three tiers](https://keithjgrant.com/posts/2024/06/a-structured-approach-to-custom-properties/):

1. **Primitive** — raw values providing theme colors, fonts, etc.
2. **Semantic** — building blocks applying primitive values to specific design
   intent
3. **Module** — variables scoped to a single component

The semantic layer provides a carefully chosen set of names that could cover
most of what most projects need, with only the _values_ changing per design. The
palette engine supplies primitive color scales from numeric OKLCH seeds.
Scaffold generation and CSS processing are planned, not currently shipped.

## What’s in this repo

| Path                       | Purpose                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| [`tokens/`](./tokens/)     | **Source of truth** — DTCG-shaped JSON for semantic token names, descriptions, and core/extended   |
| [`src/`](./src/)           | TypeScript library and CLI source (+ optional Stylelint plugin)                                    |
| [`examples/`](./examples/) | Variable names pulled from existing frameworks for comparison/inspiration                          |
| [`docs/`](./docs/)         | [Public API](./docs/api.md) and planning notes, including [product scope](./docs/product-scope.md) |

Tokens are grouped for backgrounds, text, brand/accent, status, typography,
spacing, borders, shadow, focus, motion, layout, and charts. Tokens are marked
with either "core" or "extended" tier.

The examples are **reference material only** — Bootstrap, Bulma, PatternFly,
Materialize, and others — to see how established systems name similar concepts.
They are not dependencies and are not meant to be copied wholesale into the
template.

## How to use the template (for now)

The CLI requires Node.js 22.18 or newer. Argot uses native ES modules; no
CommonJS build is provided. Published entrypoints contain JavaScript and
TypeScript declarations, so consumers do not need a TypeScript compiler.

1. Emit a template into your project:

   ```bash
   npx @keithjgrant/argot generate              # core tokens → ./semantics.css
   npx @keithjgrant/argot generate --extended   # core + extended
   npx @keithjgrant/argot generate ./tokens.css # custom output path
   ```

2. Assign values — typically by mapping to your own primitive palette.
3. Style with semantic names (`var(--text-primary)`) instead of primitives
   (`var(--gray-6)`).

### Stylelint (optional)

Noop lint rule for now. Functionality remains TODO.

Requires Stylelint 16. This example uses an ESM configuration (a `.js` file in a
project with `"type": "module"`, or a `stylelint.config.mjs` file).

```js
// stylelint.config.js
export default {
  extends: ['@keithjgrant/argot/stylelint/config'],
};
```

Example shape:

```css
:root {
  /* primitives (yours) */
  --gray-3: oklch(93% 0.006 245deg);
  --gray-6: oklch(55% 0.02 245deg);

  /* semantic (shared names) */
  --text-primary: var(--gray-3);
  --text-secondary: var(--gray-6);
  --bg-body: /* … */;
}
```

## Primitive palette definitions

Palette inputs use numeric OKLCH coordinates. Each color has a required name and
`l`, `c`, `h`:

- `l`: finite lightness from 0 through 1 (not 0 through 100).
- `c`: finite, nonnegative chroma (0.0 through 0.42 for reasonable range).
- `h`: a finite hue angle in degrees, including for neutral colors.

Coordinates are retained as supplied, without hue wrapping, chroma thresholding,
or rounding. Gamut mapping and final precision limiting happen during CSS
output.

```json
{
  "version": 1,
  "colors": [{ "name": "brand", "l": 0.6, "c": 0.2, "h": 250 }],
  "options": {
    "lightnessCurve": "inclusive",
    "chromaCurve": "weighted"
  }
}
```

In a checkout, try
`npm run dev -- palette scripts/fixtures/palette.json ./primitives.css` using
the [sample definition](./scripts/fixtures/palette.json). Existing output
requires `--force` to replace; `--dry-run` validates without writing.

The browser-safe `@keithjgrant/argot/palette` entrypoint exports
`PaletteColorDefinition`, `OklchColor`, `PaletteDefinition`, and the generation
functions. If an input interface accepts CSS strings, call the separate
`parseCssColor()` helper and compose a numeric seed such as
`{ name: 'brand', ...parseCssColor('#663399') }`. Definitions themselves do not
accept CSS strings. JSON loading and serialization preserve numeric generation
inputs rather than converting them to CSS and reparsing them.

## Development

Library source lives in `src/*.ts` and `src/` subdirectories. Node 22.18+
executes this source natively by stripping types; it does not check types. Use
`.ts` extensions for relative source imports, `import type` for type-only
imports, and erasable syntax (no runtime enums or parameter properties).

- `npm run dev -- help` — run the CLI from TypeScript source, without a build.
- `npm run dev -- generate ./semantics.css` — generate a semantic template
  directly from source.
- `npm run typecheck` — strictly check the library without emitting files.
- `npm run build` — emit ESM JavaScript, declarations, and source maps into
  ignored `dist/`. Relative runtime imports are rewritten to `.js`.
- `npm test` — build, check public declarations, and run runtime and
  packed-package tests, including the palette curve regressions.
- `npm run test:types` — check Node and browser consumer types against an
  existing build.
- `npm run test:package` — build through the pack hook and check the archive
  outside the checkout; no publishing or registry access is involved.
- `npm run build:template` — regenerate checked-in semantic CSS using native
  TypeScript execution.
- `npm run prettier` / `npm run prettier:fix` — check or apply formatting.

`npm pack` and publishing run the build automatically through `prepack`.
Published exports and `bin/argot.js` use `dist/`; run the build before invoking
that executable directly from a checkout. For normal development use
`npm run dev -- ...` instead. Tests and website files remain JavaScript. The
`./palette` entrypoint is browser-safe and exports its public types; filesystem
adapters live separately at `./palette/node`.

## Documentation website

The Eleventy site lives in `website/`. Token reference pages are generated at
build time from `tokens/*.json`, using the same loader as the CSS generator.
Group introductions and CSS examples live separately in `website/lib/guides.js`.
The site imports the token loader directly from TypeScript source: website
development, tests, and builds do not require `dist/` or a compiler-watch
process. An explicit watch hook reloads the native token loader when TypeScript
source changes, avoiding Eleventy's JavaScript-only dependency parser.

- `npm run website:dev` — serve locally with live reload, including token edits.
- `npm run website:build` — build static files into `website/_site/`.
- `npm run website:test` — check metadata, token coverage, links, URL prefixes,
  and filtering behavior.
- `npm run website:format` — format supported website files with Prettier.
- `npm run website:lint` — check website CSS with Stylelint.
- `npm run website:lint:fix` — apply available Stylelint fixes.

Edit CSS in `website/content/assets/`. The entrypoint, `site.css`, imports
underscore-prefixed partials such as `_theme.css` and `_base.css` in cascade
order. Add a partial with a local import such as `@import './_buttons.css';`.
The PostCSS plugin recognizes the underscore prefix and does not emit partials
as separate stylesheets.

`@jgarber/eleventy-plugin-postcss` processes the CSS entrypoint using the root
`postcss.config.js` and `postcss-import`, producing a single `assets/site.css`.
Partial edits rebuild automatically during `website:dev`; missing imports fail
the CSS build. Restart the dev server after changing the PostCSS config.

Stylelint runs separately via `website:lint`, and automatically before
`npm run website:build` using an npm pre-script. Dev builds do not run lint on
every save. Prettier handles formatting; CSS is otherwise left native, without
prefixing, transpilation, or minification.

To build for hosting under `/argot/`, run
`npm run website:build -- --pathprefix=/argot/`. This prefixes internal URLs;
place the contents of `website/_site/` in the host's `argot/` directory.
`WEBSITE_PATH_PREFIX` can also supply the prefix in build environments.

The reference works without JavaScript; JavaScript adds search and tier
filtering. Website files and dependencies are not included in the published
library package.

## Contributing / discussion

Help is welcome — especially bikeshedding names, deciding what belongs in the
“core” set vs. project-specific extras, and comparing against real design
systems.

Open a [GitHub issue](https://github.com/keithjgrant/argot/issues) or
[discussion](https://github.com/keithjgrant/argot/discussions). Useful feedback
includes:

- Tokens that are missing for common UI needs
- Tokens that feel too vague, redundant, or framework-specific
- Naming that collides with how you already think about a design
- Gaps revealed by comparing against the files in `examples/`

The aim is a list general enough for many projects, not tailored to one person’s
stylesheet. Feedback grounded in real-world use is especially helpful.

# Argot public API

This reference describes the currently implemented npm package, not planned
scaffolding or PostCSS processing features.

Node.js 22.18 or newer is required for the CLI and Node APIs. The package is
native ESM with compiled JavaScript and TypeScript declarations. No TypeScript
compiler is needed to consume it.

## Entrypoints

- `@keithjgrant/argot/palette`: browser-safe palette calculation, CSS rendering,
  definition validation/serialization, and optional CSS color parsing.
- `@keithjgrant/argot/palette/node`: synchronous definition-file loading and CSS
  file writing. Node only.
- `@keithjgrant/argot/generate`: semantic CSS template generation. Node only.
- `@keithjgrant/argot/stylelint`: optional Stylelint plugin array.
- `@keithjgrant/argot/stylelint/config`: optional shareable Stylelint config.
- `@keithjgrant/argot/tokens/*`: packaged DTCG-shaped JSON files.
- `@keithjgrant/argot/templates/semantics.css` and
  `@keithjgrant/argot/templates/semantics-extended.css`: static semantic templates.

There is no root JavaScript entrypoint. Import from the named subpaths rather
than internal `src/` or `dist/` paths. Browser-safe means the palette entrypoint
does not require Node built-ins or browser globals; use a bundler or other
package-resolution setup to import the npm package in a browser.

All functions below are synchronous and throw on failure. Palette validation
errors identify the invalid field. Error messages are human-readable; no
machine-readable error-code API is currently provided.

## Palette definitions

The canonical interchange format is numeric OKLCH JSON:

```json
{
  "version": 1,
  "colors": [
    { "name": "gray", "l": 0.6, "c": 0.015, "h": 250 },
    { "name": "brand", "l": 0.6, "c": 0.2, "h": 250 }
  ],
  "options": {
    "lightnessCurve": "inclusive",
    "chromaCurve": "weighted",
    "format": "oklch",
    "gamut": "p3"
  }
}
```

`version` must be the number `1`. `colors` must be a nonempty array. Each color
requires:

- `name`: a lowercase name matching `^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`, such as
  `blue` or `brand-primary`. Do not include the leading `--`.
- `l`: finite lightness from 0 through 1, not a percentage from 0 through 100.
- `c`: finite, nonnegative chroma. There is no enforced upper bound; practical
  displayable values depend on lightness, hue, and output gamut.
- `h`: a finite hue angle in degrees, including for neutral colors. Values are
  not wrapped, so negative angles and angles above 360 are retained.

Unknown fields and unsupported versions are rejected, not silently ignored.
Names must not collide with any other emitted property, including step names:
`blue` and `blue-1` cannot both be palette names. Coordinates are not coerced
from strings, clamped, rounded, or thresholded during definition validation.
Definitions contain no alpha, CSS strings, browser state, or filesystem paths.

### Options and defaults

All options are optional:

- `lightnessCurve`: `'uniform'` (default), `'inclusive'`, or `'centered'`.
- `chromaCurve`: `'centered'` (default) or `'weighted'`.
- `format`: `'oklch'` (default) or `'hex'`.
- `gamut`: `'p3'` by default for OKLCH, or `'srgb'` by default for hex.

OKLCH supports either gamut. Hex requires sRGB; explicitly combining
`format: 'hex'` with `gamut: 'p3'` throws. A color's input space does not select
its output gamut.

Every palette has 16 steps from generally light to dark:

- **Uniform lightness** uses the same fixed lightness scale for every seed.
  The base alias uses the step nearest to the seed's lightness; it need not
  reproduce the seed exactly.
- **Inclusive lightness** interpolates around that nearest step to include the
  seed's lightness.
- **Centered lightness** puts the seed's lightness at step 9.
- **Centered chroma** uses the fixed weighted profile, rescaled for the seed.
- **Weighted chroma** builds a profile around the seed's nearest-lightness
  step. With centered lightness, that existing profile is rescaled at step 9,
  not rebuilt around it; the highest chroma can occur at another step.

Inclusive/centered lightness retain fixed endpoints of 0.98 and 0.1 on the
interpolated sides. Seeds outside that range can produce non-monotonic sections.
Zero-chroma seeds produce zero chroma for every curve combination, including the
centered/weighted combination that was undefined in the original Theme Machine.

These statements describe raw calculations. Gamut mapping and output rounding
can change the rendered seed color. Palette generation does not guarantee
accessible contrast for semantic pairings.

## Browser-safe palette functions

Import these from `@keithjgrant/argot/palette`.

### `normalizePaletteDefinition(value: unknown): NormalizedPaletteDefinition`

Validate external input and return fresh color records with all option defaults
explicit. Does not mutate the input, calculate steps, map gamut, or write files.

```js
import { normalizePaletteDefinition } from '@keithjgrant/argot/palette';

const definition = normalizePaletteDefinition(JSON.parse(jsonText));
```

The result remains a version-1 definition suitable for generation or export.
Use this boundary for data from JSON files, browser forms, or another tool.

### `serializePaletteDefinition(definition: PaletteDefinition): string`

Validate/normalize the definition and return two-space-indented JSON with a
trailing newline and explicit defaults. It serializes generation inputs, not
generated steps or CSS. No files are written.

```js
import {
  normalizePaletteDefinition,
  serializePaletteDefinition,
} from '@keithjgrant/argot/palette';

const definition = normalizePaletteDefinition({
  version: 1,
  colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
});
const portableJson = serializePaletteDefinition(definition);
```

### `parseCssColor(value: string): OklchColor`

Optional input adapter that converts a standalone opaque CSS color into numeric
`{ l, c, h }`. It accepts supported CSS color syntax such as hex, named colors,
and `oklch()`. It rejects transparent colors, malformed colors, and
context-dependent values such as `currentColor` and `var(--brand)`.

Achromatic CSS colors with no hue receive `h: 0`. Tiny floating-point excursions
at the lightness endpoints caused by conversion are tolerated and clamped here,
not in numeric definition validation. No output-gamut mapping is performed.

```js
import { parseCssColor } from '@keithjgrant/argot/palette';

const definition = {
  version: 1,
  colors: [{ name: 'brand', ...parseCssColor('#663399') }],
};
```

### `generatePalette(definition: PaletteDefinition): Palette`

Validate inputs and generate a fresh structured palette without mutating the
definition. The result contains raw, unrounded OKLCH coordinates before gamut
mapping:

```ts
interface Palette {
  version: 1;
  options: Required<PaletteOptions>;
  colors: {
    name: string;
    baseStep: number;
    steps: { step: number; l: number; c: number; h: number }[];
  }[];
}
```

Color order follows input order. `step` and `baseStep` are **one-based**, from 1
through 16. Array indexes remain zero-based.

```js
import { generatePalette } from '@keithjgrant/argot/palette';

const palette = generatePalette({
  version: 1,
  colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
  options: { lightnessCurve: 'inclusive' },
});
const brand = palette.colors[0];
const rawBaseColor = brand.steps[brand.baseStep - 1];
```

Format/gamut options are retained in the result but do not change its raw steps.

### `renderPaletteCss(palette: Palette): string`

Render a generated model to a `:root` block containing `--name-1` through
`--name-16`, followed by `--name: var(--name-N)` using `baseStep`. Returns CSS with
a generated-file comment and trailing newline, without modifying the model.

Colors are mapped to the selected gamut using Color.js's `css` mapping method.
OKLCH serialization uses Color.js precision `6`; hex is six-digit sRGB.
Rounding is deferred until serialization. A neutral hue may serialize as
`none`, which is valid CSS.

Pass a model from `generatePalette()`. This is not a general-purpose validator
for arbitrary imported palette models; import portable definitions instead.

### `generatePaletteCss(definition: PaletteDefinition): string`

Convenience composition of `generatePalette()` and `renderPaletteCss()`:

```js
import { generatePaletteCss } from '@keithjgrant/argot/palette';

const css = generatePaletteCss({
  version: 1,
  colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
  options: { format: 'hex' },
});
```

### Exported palette types

- Inputs: `OklchColor`, `PaletteColorDefinition`, `PaletteDefinition`,
  `PaletteOptions`.
- Validated definitions: `NormalizedPaletteDefinition`,
  `NormalizedPaletteOptions`.
- Generated models: `Palette`, `PaletteColor`, `PaletteStep`.
- Option unions: `LightnessCurve`, `ChromaCurve`, `ColorFormat`, `ColorGamut`.

```ts
import {
  generatePaletteCss,
  type PaletteDefinition,
} from '@keithjgrant/argot/palette';

const definition = {
  version: 1,
  colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
} satisfies PaletteDefinition;
const css: string = generatePaletteCss(definition);
```

TypeScript types do not replace runtime validation of imported JSON.

## Node palette file functions

Import these from `@keithjgrant/argot/palette/node`. Neither is part of the
browser-safe entrypoint. Relative paths resolve against `process.cwd()`.

### `loadPaletteDefinition(filename: string): NormalizedPaletteDefinition`

Read UTF-8 JSON synchronously, parse it, and validate/normalize it. Read, JSON,
and definition errors include the resolved input path. Loading does not generate
CSS or write files.

### `writePalette(outPath, definition, options?): WritePaletteResult`

Generate CSS and synchronously write it to the designated output file.
Parameters are `outPath: string`, `definition: PaletteDefinition`, and optional
`options: WritePaletteOptions`.

```ts
interface WritePaletteOptions {
  force?: boolean;  // default false
  dryRun?: boolean; // default false
}

interface WritePaletteResult {
  path: string;    // absolute output path
  css: string;     // generated CSS, including for a dry run
  written: boolean;
}
```

- Missing parent directories are created only for a real write.
- Existing files are refused unless `force: true`.
- Output directories and final-path symlinks are refused even with `force`.
- Dry runs validate and render but do not create directories or modify output.
  Existing files still require `force: true` during a dry run.
- Invalid definitions fail before output directories or files are created.

Filesystem failures throw. This function does not save the definition, update
other project files, or protect a separately held input file automatically:
choose distinct input and output locations.

```js
import { writeFileSync } from 'node:fs';
import { serializePaletteDefinition } from '@keithjgrant/argot/palette';
import {
  loadPaletteDefinition,
  writePalette,
} from '@keithjgrant/argot/palette/node';

const definition = loadPaletteDefinition('./palette.json');
const preview = writePalette('./styles/primitives.css', definition, {
  dryRun: true,
});
const result = writePalette('./styles/primitives.css', definition);

// Optional export of the portable inputs, separate from the CSS output.
writeFileSync('./palette-export.json', serializePaletteDefinition(definition));
```

`WritePaletteOptions` and `WritePaletteResult` are exported types from this
Node entrypoint.

## CLI

Install the package and use `argot` in npm scripts, or invoke it with
`npm exec --package=@keithjgrant/argot -- argot ...`.

```sh
argot palette ./palette.json
argot palette ./palette.json ./styles/primitives.css
argot palette ./palette.json ./styles/primitives.css --dry-run
argot palette ./palette.json ./styles/primitives.css --force
argot palette --help
```

The default palette output is `./primitives.css`. The CLI uses the file API's
overwrite and dry-run rules, rejects identical resolved input/output paths, and
reports failures on stderr with a nonzero exit status. It never runs Stylelint
or semantic/scaffold generation as a side effect.

From a source checkout, `npm run dev -- palette ...` runs the same command using
native TypeScript. The installed executable uses compiled JavaScript.

### Semantic templates

```sh
argot generate
argot generate ./styles/semantics.css --extended
```

Default output is `./semantics.css`, with core semantic names and empty values.
`--extended` includes both tiers. Assign values in the consumer project; primitive
generation does not automatically populate semantic mappings.

**Unlike the palette command, semantic generation currently overwrites existing
files without `--force`.** Its CLI refuses output directories.

## Semantic generation library

Import from `@keithjgrant/argot/generate`:

- `generateCss(options?: TokenOptions): string`: load packaged semantic tokens
  and render their CSS template. `extended` defaults to `false`.
- `renderCss(sections: readonly TokenSection[]): string`: render already-loaded
  token sections in order.
- `writeTemplate(outPath: string, options?: TokenOptions): string`: create parent
  directories, write the template, and return its absolute path. Existing files
  are overwritten; filesystem errors throw.

This entrypoint exports `TokenOptions`, `TokenRecord`, and `TokenSection`.
`TokenOptions` has optional boolean `extended`. A section has `file`, `label`,
and `tokens`; token records carry `name`, `value`, `description`, `tier`, `type`,
`usage`, `pairsWith`, and `related`. Empty/null values render as empty
declarations. Loading and indexing internals are not public package exports.

## Optional Stylelint integration

Requires the optional Stylelint 16 peer dependency:

```js
export default {
  extends: ['@keithjgrant/argot/stylelint/config'],
};
```

`@keithjgrant/argot/stylelint` default-exports the plugin array. The config
entrypoint registers it and enables `argot/valid-token`.

**The rule is currently a no-op placeholder**, not token-name enforcement,
contrast validation, or build-time linting.

## Static data and styles

Token JSON uses the packaged DTCG-shaped vocabulary, including descriptions,
tiers, and optional relationship metadata. It is not a promise of full DTCG
interchange support.

```js
import textTokens from '@keithjgrant/argot/tokens/color-text.json' with {
  type: 'json',
};
```

The two exported CSS templates contain the core or core-plus-extended semantic
property names. CSS import resolution depends on the consumer's build tooling.
No PostCSS preset or processing command is shipped in Phase 1.

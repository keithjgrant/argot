# Argot public API

The API is still in development and likely to change, prior to first published
version.

Node.js 22.18 or newer is required for the CLI and Node APIs. The package is
native ESM with compiled JavaScript and TypeScript declarations. No TypeScript
compiler is needed to consume it.

All functions below are synchronous and throw on failure. Palette validation
errors identify the invalid field. Error messages are human-readable; no
machine-readable error-code API is currently provided. Unless noted, APIs do not
mutate inputs or write files.

## Typical workflows

**Primitive palette**

1. Build or load a palette seed definition (JSON or in memory).
2. Use `generatePalette()` to produce structured color shades for each seed in
   the palette, or `generatePaletteCss()` / `renderPaletteCss()` to generate CSS
   custom properties.
3. In Node, `writePalette()` or `argot palette` writes the CSS file.

**Semantic templates**

1. `argot generate` or `writeTemplate()` emits a semantic custom properties
   template stylesheet.
2. Use the palette primitives to assign values to semantic properties in the
   stylesheet.

## Entrypoints

- `@keithjgrant/argot/palette`: browser-safe palette calculation, CSS rendering,
  definition validation/serialization, and optional CSS color parsing.
- `@keithjgrant/argot/palette/node`: synchronous definition-file loading and CSS
  file writing. Node only.
- `@keithjgrant/argot/generate`: semantic CSS template generation. Node only.
  Same behavior as [`argot generate`](#semantic-templates).
- `@keithjgrant/argot/stylelint`: optional Stylelint plugin array.
- `@keithjgrant/argot/stylelint/config`: optional shareable Stylelint config.
- `@keithjgrant/argot/tokens/*`: packaged DTCG-shaped JSON files.
- `@keithjgrant/argot/templates/semantics.css` and
  `@keithjgrant/argot/templates/semantics-extended.css`: static semantic
  templates.

There is no root JavaScript entrypoint. Import from the named subpaths rather
than internal `src/` or `dist/` paths. Browser-safe means the palette entrypoint
does not require Node built-ins or browser globals; use a bundler or other
package-resolution setup to import the npm package in a browser.

## Palette definitions

To generate a color palette, provide a PaletteDefinition with "seed" colors
defined using numeric OKLCH values in this format:

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
  displayable values depend on lightness, hue, and output gamut (typically below
  0.5).
- `h`: a finite hue angle in degrees, including for neutral colors. Values are
  not wrapped, so negative angles and angles above 360 are retained.

Unknown fields and unsupported versions are rejected, not silently ignored.
Coordinates are not coerced from strings, clamped, rounded, or thresholded
during definition validation. Definitions contain no alpha, CSS strings, browser
state, or filesystem paths.

Each color emits `--name`, `--name-1` … `--name-16`. Names must not collide with
any of those properties for any color in the definition. For example, `blue` and
`blue-1` cannot both be color names, because `blue` already reserves `--blue-1`.

### Options and defaults

All options are optional:

| Option           | Values                                   | Default                            |
| ---------------- | ---------------------------------------- | ---------------------------------- |
| `lightnessCurve` | `'uniform'`, `'inclusive'`, `'centered'` | `'uniform'`                        |
| `chromaCurve`    | `'centered'`, `'weighted'`               | `'centered'`                       |
| `format`         | `'oklch'`, `'hex'`                       | `'oklch'`                          |
| `gamut`          | `'p3'`, `'srgb'`                         | `'p3'` for OKLCH; `'srgb'` for hex |

OKLCH supports either gamut. Hex requires sRGB; `format: 'hex'` with
`gamut: 'p3'` throws. A color's input space does not select its output gamut.

### How scales are built

Argot generates palettes with 16 shades from light to dark for each seed color
you provide. Shades are numbered from 1 through 16. The exact shades produced
are shaped by a lightness curve and a chroma curve, as specified in `options`:

| Lightness curve | Behavior                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Uniform**     | Prioritizes uniform lightness across all hues in the palette, based on a hand-crafted lightness scale. Seed color may be rounded slightly to conform.                    |
| **Inclusive**   | Ensures your seed color is in the final set of color shade, evenly spacing other shades around them. Use if the seeds include precise brand colors you want to preserve. |
| **Centered**    | Places seed color at the middle of each palette.                                                                                                                         |

| Chroma curve | Behavior                                                                              |
| ------------ | ------------------------------------------------------------------------------------- |
| **Centered** | Shades near the center of the scale have the highest chroma.                          |
| **Weighted** | Shades near the seed color have the highest chroma. Useful for light/pastel palettes. |

After shade calculation, gamut mapping and output rounding is applied to ensure
all shades are usable on the web. Palette generation does not guarantee
accessible contrast for semantic pairings.

## Browser-safe palette functions

Import these from `@keithjgrant/argot/palette`.

### `normalizePaletteDefinition(value: unknown): NormalizedPaletteDefinition`

Validate external input and return fresh color records with all option defaults
explicit. Does not calculate steps or map gamut.

```js
import { normalizePaletteDefinition } from '@keithjgrant/argot/palette';

const definition = normalizePaletteDefinition({
  version: 1,
  colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
});
// => {
//   version: 1,
//   colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
//   options: {
//     lightnessCurve: 'uniform',
//     chromaCurve: 'centered',
//     format: 'oklch',
//     gamut: 'p3',
//   },
// }
```

The result remains a version-1 definition suitable for generation or export. Use
this boundary for data from JSON files, browser forms, or another tool.

### `serializePaletteDefinition(definition: PaletteDefinition): string`

Validate/normalize the definition and return two-space-indented JSON with a
trailing newline and explicit defaults. Serializes generation inputs, not
generated steps or CSS.

```js
import { serializePaletteDefinition } from '@keithjgrant/argot/palette';

const portableJson = serializePaletteDefinition({
  version: 1,
  colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
});
// => `{
//   "version": 1,
//   "colors": [
//     {
//       "name": "brand",
//       "l": 0.6,
//       "c": 0.2,
//       "h": 250
//     }
//   ],
//   "options": {
//     "lightnessCurve": "uniform",
//     "chromaCurve": "centered",
//     "format": "oklch",
//     "gamut": "p3"
//   }
// }\n`
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

const seed = parseCssColor('#663399');
// => { l: 0.4402…, c: 0.1602…, h: 303.37… }

const definition = {
  version: 1,
  colors: [{ name: 'brand', ...seed }],
};
```

### `generatePalette(definition: PaletteDefinition): Palette`

Validate inputs and return a fresh structured palette. The result contains raw,
unrounded OKLCH coordinates before gamut mapping:

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
// => {
//   version: 1,
//   options: { lightnessCurve: 'inclusive', chromaCurve: 'centered',
//              format: 'oklch', gamut: 'p3' },
//   colors: [{
//     name: 'brand',
//     baseStep: 8,
//     steps: [
//       { step: 1, l: 0.98, c: 0.028, h: 250 },
//       // ... steps 2–7 ...
//       { step: 8, l: 0.6, c: 0.2, h: 250 },
//       // ... steps 9–15 ...
//       { step: 16, l: 0.1, c: 0.048, h: 250 },
//     ],
//   }],
// }

const brand = palette.colors[0];
const rawBaseColor = brand.steps[brand.baseStep - 1];
// => { step: 8, l: 0.6, c: 0.2, h: 250 }
```

Format/gamut options are retained in the result but do not change its raw steps.

### `renderPaletteCss(palette: Palette): string`

Render a generated model to a `:root` block containing `--name-1` through
`--name-16`, followed by `--name: var(--name-N)` using `baseStep`. Returns CSS
with a generated-file comment and trailing newline.

Colors are mapped to the selected gamut using Color.js's `css` mapping method.
OKLCH serialization uses Color.js precision `6`; hex is six-digit sRGB. Rounding
is deferred until serialization. A neutral hue may serialize as `none`, which is
valid CSS.

Pass a model from `generatePalette()`. This is not a general-purpose validator
for arbitrary imported palette models; import portable definitions instead.

```js
import { generatePalette, renderPaletteCss } from '@keithjgrant/argot/palette';

const css = renderPaletteCss(
  generatePalette({
    version: 1,
    colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
    options: { lightnessCurve: 'inclusive' },
  }),
);
// => `/* Generated by Argot. */
// :root {
//   --brand-1: oklch(97.6518% 0.017936 219.617);
//   /* ... --brand-2 through --brand-15 ... */
//   --brand-16: oklch(10.219% 0.045256 256.462);
//   --brand: var(--brand-8);
// }
// `
```

### `generatePaletteCss(definition: PaletteDefinition): string`

Convenience composition of `generatePalette()` and `renderPaletteCss()`:

```js
import { generatePaletteCss } from '@keithjgrant/argot/palette';

const css = generatePaletteCss({
  version: 1,
  colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
  options: { format: 'hex' },
});
// => `/* Generated by Argot. */
// :root {
//   --brand-1: #ebfaff;
//   /* ... --brand-2 through --brand-15 ... */
//   --brand-16: #000312;
//   --brand: var(--brand-8);
// }
// `
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
and definition errors include the resolved input path.

```js
import { loadPaletteDefinition } from '@keithjgrant/argot/palette/node';

// ./palette.json:
// {
//   "version": 1,
//   "colors": [{ "name": "brand", "l": 0.6, "c": 0.2, "h": 250 }]
// }

const definition = loadPaletteDefinition('./palette.json');
// => {
//   version: 1,
//   colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
//   options: {
//     lightnessCurve: 'uniform',
//     chromaCurve: 'centered',
//     format: 'oklch',
//     gamut: 'p3',
//   },
// }
```

### `writePalette(outPath, definition, options?): WritePaletteResult`

Generate CSS and synchronously write it to the designated output file.
Parameters are `outPath: string`, `definition: PaletteDefinition`, and optional
`options: WritePaletteOptions`.

```ts
interface WritePaletteOptions {
  force?: boolean; // default false
  dryRun?: boolean; // default false
}

interface WritePaletteResult {
  path: string; // absolute output path
  css: string; // generated CSS, including for a dry run
  written: boolean;
}
```

- Missing parent directories are created only for a real write.
- Existing files are refused unless `force: true`. Dry runs use the same path
  checks, so previewing over an existing file still needs `force: true` even
  though nothing is written.
- Output directories and final-path symlinks are refused even with `force`.
- Dry runs validate and render but do not create directories or modify output.
- Invalid definitions fail before output directories or files are created.

Filesystem failures throw. This function does not save the definition or update
other project files. Choose distinct input and output locations.

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
// => { path: '/absolute/path/to/styles/primitives.css', written: false, css: '…' }

const result = writePalette('./styles/primitives.css', definition);
// => { path: '/absolute/path/to/styles/primitives.css', written: true, css: '…' }

// Optional export of the portable inputs, separate from the CSS output.
writeFileSync('./palette-export.json', serializePaletteDefinition(definition));
```

`WritePaletteOptions` and `WritePaletteResult` are exported types from this Node
entrypoint.

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

The default palette output is `./primitives.css`. The CLI uses
[`writePalette()`](#writepaletteoutpath-definition-options-writepaletteresult)'s
overwrite and dry-run rules, rejects identical resolved input/output paths, and
reports failures on stderr with a nonzero exit status. It never runs Stylelint
or semantic generation as a side effect.

From a source checkout, `npm run dev -- palette ...` runs the same command using
native TypeScript. The installed executable uses compiled JavaScript.

### Semantic templates

Same behavior as [`@keithjgrant/argot/generate`](#semantic-generation-library):

```sh
argot generate
argot generate ./styles/semantics.css --extended
```

Default output is `./semantics.css`, with core semantic names and empty values.
`--extended` includes both tiers. Assign values in the consumer project;
primitive generation does not automatically populate semantic mappings.

**Unlike the palette command, semantic generation currently overwrites existing
files without `--force`.** Its CLI refuses output directories.

## Semantic generation library

Import from `@keithjgrant/argot/generate` (CLI:
[`argot generate`](#semantic-templates)):

- `generateCss(options?: TokenOptions): string`: load packaged semantic tokens
  and render their CSS template. `extended` defaults to `false`.
- `renderCss(sections: readonly TokenSection[]): string`: render already-loaded
  token sections in order.
- `writeTemplate(outPath: string, options?: TokenOptions): string`: create
  parent directories, write the template, and return its absolute path. Existing
  files are overwritten; filesystem errors throw.

This entrypoint exports `TokenOptions`, `TokenRecord`, and `TokenSection`.
`TokenOptions` has optional boolean `extended`. A section has `file`, `label`,
and `tokens`; token records carry `name`, `value`, `description`, `tier`,
`type`, `usage`, `pairsWith`, and `related`. Empty/null values render as empty
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
import textTokens from '@keithjgrant/argot/tokens/color-text.json' with { type: 'json' };
```

The two CSS templates export core or core-plus-extended semantic property names
for projects that prefer a static import over
[`generate` / `writeTemplate`](#semantic-generation-library). CSS import
resolution depends on the consumer's build tooling. No PostCSS preset or
processing command is shipped.

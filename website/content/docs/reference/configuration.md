---
layout: docs.njk
title: Configuration
description:
  CLI flags, Stylelint config, palette definitions, and project .argot.json.
permalink: /docs/reference/configuration/
---

# Configuration

Argot keeps configuration **small and separable**. You do not need a project
config file to process CSS or generate tokens. When a file is used, it is a
focused contract—not a kitchen-sink platform config.

## Precedence

For the processor and related tools:

1. **CLI flags** for the current invocation
2. **Project file** (`.argot.json`) when present
3. **Built-in defaults**

Flags always win over the project file for that run.

## CLI flags (no file required)

| Area      | Flags                  | Docs                                                       |
| --------- | ---------------------- | ---------------------------------------------------------- |
| Processor | `--lint-config` / `-c` | [Processor]({{ '/docs/processor/'                          | url }}), [CLI]({{ '/docs/reference/' | url }}) |
| Semantics | `--extended`           | [Semantic tokens]({{ '/docs/scaffold/semantic-tokens/'     | url }})                              |
| Palette   | `--force`, `--dry-run` | [Palette generator]({{ '/docs/scaffold/palette-generator/' | url }})                              |

Paths on the command line are resolved from `process.cwd()`.

## Stylelint configuration

Lint is configured with ordinary Stylelint config files (ESM).

**Shareable Argot config** (plugins + `argot/color-contrast`):

```js
// stylelint.config.js
export default {
  extends: ['argot-css/stylelint/config'],
};
```

**Closer to the processor default** (recommended + color-contrast):

```js
import { colorContrast } from 'argot-css/stylelint';

export default {
  extends: ['stylelint-config-recommended'],
  plugins: [colorContrast],
  rules: {
    'argot/color-contrast': true,
  },
};
```

Pass a file into the processor with `--lint-config`. When the flag is omitted,
the processor uses its built-in default (recommended + color-contrast), which is
also exportable as `argot-css/stylelint-default`.

Details: [Linting]({{ '/docs/processor/linting/' | url }}).

## Palette definition JSON

Not project config—a **portable generation input** for `argot palette` and
`argot-css/palette`:

```json
{
  "version": 1,
  "seedColors": [{ "name": "brand", "l": 0.6, "c": 0.2, "h": 250 }],
  "options": {
    "lightnessCurve": "inclusive",
    "chromaCurve": "weighted",
    "format": "oklch",
    "gamut": "p3"
  }
}
```

Validated independently of any `.argot.json`. Schema and curves: [Palette
generator]({{ '/docs/scaffold/palette-generator/' | url }}).

Definitions carry no filesystem paths or browser state. Output paths belong on
the CLI or in `writePalette()` options.

## Project file: `.argot.json`

Optional file at the project root for **defaults** shared across runs—especially
processor input and output.

Example shape:

```json
{
  "version": 1,
  "processor": {
    "source": "styles/styles.css",
    "destination": "dist/styles.css",
    "lintConfig": "stylelint.config.js",
    "minify": true
  },
  "scaffold": {
    "directory": "styles"
  },
  "palette": {
    "definition": "palette.json",
    "output": "styles/primitives.css"
  },
  "semantics": {
    "output": "styles/semantics.css",
    "extended": false
  }
}
```

| Field area                         | Role                                                    |
| ---------------------------------- | ------------------------------------------------------- |
| `processor.source` / `destination` | Default entry and build output when the CLI omits paths |
| `processor.lintConfig`             | Default Stylelint config path                           |
| `processor.minify`                 | Whether cssnano runs (default on when unset)            |
| `scaffold.directory`               | Where `argot scaffold` writes                           |
| `palette.*` / `semantics.*`        | Optional defaults for generation commands               |

Notes:

- **Unknown keys and unsupported `version` values should fail clearly**, not be
  ignored.
- Portable palette/semantic **definitions** stay in their own files; the project
  file **references** them rather than inlining large seed tables when possible.
- The processor does not load palette or semantic definition contracts to build
  CSS—it only needs source/destination and lint options.

Without an explicit browserslist (or equivalent) option, cssnano runs with its
defaults.

## What is not configuration

| Thing                        | Where it lives                              |
| ---------------------------- | ------------------------------------------- |
| Token **names** and metadata | `tokens/*.json` in the package (vocabulary) |
| Your **semantic values**     | Project `semantics.css` (source you own)    |
| **Module** styles            | Project `modules/*.css`                     |
| npm **scripts**              | Consumer `package.json`                     |

## Related

- [CLI]({{ '/docs/reference/' | url }})
- [Technical details]({{ '/docs/reference/technical/' | url }})
- [Installation]({{ '/docs/installation/' | url }})

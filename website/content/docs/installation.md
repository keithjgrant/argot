---
layout: docs.njk
title: Installation
description: Requirements, install options, package scripts, and library entrypoints.
permalink: /docs/installation/
---

# Installation

For a first-hour walkthrough (process CSS, tokens, optional palette), start at
[Getting started]({{ '/docs/getting-started/' | url }}). This page covers how
Argot is installed and imported.

## Requirements

- **Node.js 22.18 or newer** (CLI and Node APIs).
- The package is **native ESM**. There is no CommonJS build.
- Published entrypoints ship compiled JavaScript and TypeScript declarations;
  consumers do not need a TypeScript compiler.

## Install the package

Project dependency:

```bash
npm install argot-css
```

One-off without adding a dependency:

```bash
npx argot-css <command>
```

The binary name is `argot`. With a local install, prefer npm scripts or
`npx argot` so the project’s binary is used.

## npm scripts

```json
{
  "scripts": {
    "css": "argot styles/index.css dist/styles.css",
    "tokens": "argot semantics ./styles/semantics.css",
    "palette": "argot palette ./palette.json ./styles/primitives.css"
  }
}
```

Command details: [Getting started]({{ '/docs/getting-started/' | url }}),
[CLI reference]({{ '/docs/reference/' | url }}).

## Optional Stylelint config

```js
// stylelint.config.js
export default {
  extends: ['argot-css/stylelint/config'],
};
```

Requires Stylelint as a peer when you lint outside the processor. The processor
ships a default config (recommended rules plus `argot/color-contrast`) when you
omit `--lint-config`. See [Linting]({{ '/docs/processor/linting/' | url }}).

## Library imports

There is **no root** `argot-css` JavaScript entrypoint. Import named subpaths:

| Subpath | Role |
| --- | --- |
| `argot-css/palette` | Browser-safe palette generation |
| `argot-css/palette/node` | Load/write palette files (Node) |
| `argot-css/semantics` | Semantic CSS template helpers (Node) |
| `argot-css/stylelint` | Plugin array |
| `argot-css/stylelint/config` | Shareable Stylelint config |
| `argot-css/tokens/*` | Packaged token JSON |
| `argot-css/templates/semantics.css` | Static core template |
| `argot-css/templates/semantics-extended.css` | Static core + extended template |

Full signatures live in the package’s
[`docs/api.md`](https://github.com/keithjgrant/argot/blob/main/docs/api.md) and
will move into site [Reference]({{ '/docs/reference/' | url }}) over time.

## From a source checkout

```bash
npm run cli -- help
npm run cli -- semantics ./out.css
npm run cli -- palette ./scripts/fixtures/palette.json ./out.css
```

`npm run cli` runs the TypeScript CLI without a prior `dist/` build. The
published `bin/argot.js` expects a built `dist/`.

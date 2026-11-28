---
layout: docs.njk
title: Linting
description: Stylelint configuration in the Argot processor.
permalink: /docs/processor/linting/
---

# Linting

The Argot processor lints your CSS using [Stylelint](https://stylelint.io/).

## Default configuration

If you specify no stylelint config, Argot applies a default minimal config. This
is simply the `stylelint-config-recommended` plugin, which applies
[a minimal ruleset](https://github.com/stylelint/stylelint-config-recommended#readme)
that does not impose any strong opinions.

Default configuration:

```js
import recommended from 'stylelint-config-recommended';

export default {
  extends: [recommended],
};
```

If you wish to add more rules, including the Argot lint rules, do so by
providing your own config. This can be done via the `--lint-config` CLI
parameter, or by specifying a pathname in the `lintConfig` key of your
`.argot.json` configuration file.

## Argot Stylelint plugins

Argot has three custom lint rules, each meant to enforce aspects of the
three-tier [custom property
structure]({{ '/docs/custom-property-structure/' | url }}).

## Shareable config

```js
// stylelint.config.js  (ESM — "type": "module" or .mjs)
export default {
  extends: ['argot-css/stylelint/config'],
};
```

That config:

- Registers Argot’s Stylelint plugins
- Enables `argot/color-contrast`

It does **not** extend `stylelint-config-recommended` by itself. The processor’s
**built-in default** (when you omit `--lint-config`) does extend recommended and
enables color-contrast. For standalone lint that matches the processor default
more closely:

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

(This site’s `website/stylelint.config.js` follows that shape.)

## Package entrypoints

| Import                       | Provides                              |
| ---------------------------- | ------------------------------------- |
| `argot-css/stylelint`        | Plugin exports (e.g. `colorContrast`) |
| `argot-css/stylelint/config` | Shareable config object               |

Stylelint is an optional peer of the package; install it in the consumer project
when you lint outside the bundled processor path.

## Rules

| Rule                                                                  | Status  | Docs    |
| --------------------------------------------------------------------- | ------- | ------- |
| [`argot/color-contrast`]({{ '/docs/processor/linting/color-contrast/' | url }}) | Shipped | Checks WCAG 2.1 contrast between paired semantic color tokens |
| [`Property naming`]({{ '/docs/processor/linting/property-naming/'     | url }}) | Planned | Stub                                                          |
| [`Property usage`]({{ '/docs/processor/linting/property-usage/'       | url }}) | Planned | Stub                                                          |

A placeholder `argot/valid-token` exists in source but is a no-op and is not
enabled in the shareable config.

## With the processor

```bash
# Built-in default (recommended + color-contrast)
argot styles/index.css dist/styles.css

# Your config file
argot styles/index.css dist/styles.css --lint-config=./stylelint.config.js
```

Messages are reported through PostCSS’s reporter after minify. Failures follow
Stylelint/PostCSS behavior for your Stylelint version and severity settings.

## Design notes

- Rules that know about Argot tokens load vocabulary metadata from the packaged
  token JSON. They do not rewrite CSS.
- Contrast checks use explicit `pairsWith` relationships on semantic tokens—not
  a blanket “every color vs every background” matrix. See [Color
  contrast]({{ '/docs/processor/linting/color-contrast/' | url }}).
- Passing lint is not a full accessibility audit; it catches paired token
  assignments that resolve to weak contrast.

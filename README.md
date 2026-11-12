# Argot

A standardized set of **semantic design token names**, packaged as CSS custom
properties. These are designed to provide a common foundation, a shared
dictionary that can be used as a starting point for any CSS project.

This is an early starting point, not a finished standard. The list of tokens,
their naming, and structure are all open for discussion.

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

This project focuses on the **semantic** layer: a carefully chosen set of names
that could cover most of what most projects need, with only the _values_
changing per design.

## What’s in this repo

| Path                       | Purpose                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| [`tokens/`](./tokens/)     | **Source of truth** — DTCG-shaped JSON for semantic token names, descriptions, and core/extended |
| [`src/`](./src/)           | `argot generate` (+ Stylelint plugin under `src/stylelint/`)                                     |
| [`examples/`](./examples/) | Variable names pulled from existing frameworks for comparison/inspiration                        |
| [`docs/`](./docs/)         | Planning notes, including [product scope](./docs/product-scope.md)                               |

Tokens are grouped for backgrounds, text, brand/accent, status, typography,
spacing, borders, shadow, focus, motion, layout, and charts. Tokens are marked
with either "core" or "extended" tier.

The examples are **reference material only** — Bootstrap, Bulma, PatternFly,
Materialize, and others — to see how established systems name similar concepts.
They are not dependencies and are not meant to be copied wholesale into the
template.

## How to use the template (for now)

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

```js
// stylelint.config.js
module.exports = {
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
stylesheet. I hope to build more comprehensive documentation of the tokens as
the list begins to take shape.

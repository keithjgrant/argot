# Token source of truth & tooling

Token-format guidance for the expanded Argot toolkit. The
[product scope](./product-scope.md), [architecture](./architecture.md), and
[roadmap](./roadmap.md) define product boundaries and sequencing.

## Goal

Define tokens in an easy-to-edit format shared by:

1. Human-readable documentation (purpose + recommended usage per token)
2. A `*.css` template of semantic custom property names

## Tooling direction

Use DTCG-shaped JSON (`$value`, `$type`, `$description`) and the existing custom
loader/generator. "DTCG-shaped" describes the current data conventions, not a
claim of complete standards compliance.

The existing Eleventy website already consumes the same loader for its token
reference. Retain this shared source of truth as the toolkit expands.

Style Dictionary and Terrazzo remain options if additional output formats or
interchange requirements justify them, not prerequisites for palette generation,
scaffolding, or CSS processing.

### Example token shape

```json
{
  "text": {
    "primary": {
      "$type": "color",
      "$value": "",
      "$description": "Main body/copy text. Prefer over palette steps like gray-6.",
      "usage": "body, headings by default",
      "pairsWith": ["bg-main", "bg-raised"],
      "related": ["border-color"]
    }
  }
}
```

Custom field meanings:

| Field       | Use for                                                                    |
| ----------- | -------------------------------------------------------------------------- |
| `pairsWith` | Text/background partners. Intended input for a docs-site contrast checker. |
| `related`   | Other related tokens that might often be used together                     |
| `usage`     | Example usage modules                                                      |

`$description` can become CSS comments and doc prose.

## Fit for this project

The vocabulary ships **shared semantic names**, often with empty values for
consumers to fill in. Keep that use case even as the toolkit gains primitive
palette generation and usable starter presets.

Starter values and semantic-to-primitive mappings belong in separate presets,
not in the authoritative vocabulary. Palette generation calculates raw values;
scaffolding composes those values with semantic mappings and project templates.

The current template renderer can continue emitting empty declarations such as
`--text-primary: ;`, while starter mode supplies usable values for properties
consumed by its base styles.

## Current status

**Adopted:** DTCG-shaped JSON under [`tokens/`](../tokens/) is the source of
truth (one file per group). Each token has `$type`, `$value`, `$description`,
and `tier` (`core` | `extended`). Optional `usage`, `pairsWith` (contrast), and
`related` (non-contrast links) where helpful.

**Naming:** CSS custom property name = `--` + path segments joined by `-` (e.g.
`text.primary` → `--text-primary`).

**Generator:** `argot generate [path]` (see `src/generate.ts`) reads `tokens/`
and writes a `:root` CSS template. `npm run build:template` writes
`templates/semantics.css` (core) and `templates/semantics-extended.css`.

**Website:** The Eleventy token reference exists in `website/`. Keep its build
and shared token-data compatibility working, but defer full content alignment
and publishing readiness to the final roadmap phase unless publication becomes a
priority.

**Stylelint:** Plugin/config entrypoints exist; the current token rule is a
placeholder. Useful rules remain optional follow-up work rather than a
prerequisite for the generator or processor.

Figma / Tokens Studio sync and multi-platform interchange remain out of scope.

## References

- [Do We Need a Modern, Lightweight CSS Toolset?](https://keithjgrant.com/posts/2026/11/do-we-need-a-modern-lightweight-css-toolset/)
- [A Structured Approach to Custom Properties](https://keithjgrant.com/posts/2024/06/a-structured-approach-to-custom-properties/)
- [Design Tokens Community Group](https://www.w3.org/community/design-tokens/)
- [Style Dictionary](https://styledictionary.com/)
- [Terrazzo](https://terrazzo.app/docs/)

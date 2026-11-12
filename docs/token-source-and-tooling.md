# Token source of truth & tooling

(ai-generated recommendations)

Notes on how to define tokens so they can feed both documentation and a
generated CSS template — and when to wire that up.

This is planning guidance, not a committed architecture.

## Goal

Define tokens in an easy-to-edit format that can eventually produce:

1. Human-readable documentation (purpose + recommended usage per token)
2. A `*.css` template of semantic custom property names

## Recommended approach

| Piece                  | Recommendation                                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data format**        | [DTCG](https://www.w3.org/community/design-tokens/) design-token JSON (`$value`, `$type`, `$description`) — stable as of Oct 2025; widely supported                                                                       |
| **Build tool (later)** | [Style Dictionary](https://styledictionary.com/) — largest ecosystem; built-in `css/variables`; custom formats for Markdown/docs; [DTCG support](https://styledictionary.com/info/dtcg/) (full 2025.10 still catching up) |
| **Alternative**        | [Terrazzo](https://terrazzo.app/docs/) — DTCG-native CSS/Sass/JS generation; smaller community than Style Dictionary                                                                                                      |
| **Docs site (later)**  | Generate Markdown/HTML from token metadata, then publish with Eleventy / VitePress / similar                                                                                                                              |

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

This repo is a bit unusual: it ships **shared semantic names** (often with empty
values for consumers to fill in), not a finished multi-platform palette.

Style Dictionary still works, but we would likely want a **custom CSS format**
that emits a template (`--text-primary: ;` or a clear placeholder) rather than
resolved hex/oklch values.

Until names stabilize, a plain DTCG-shaped JSON/YAML file edited by hand is
enough. Collaborators can review diffs of names and descriptions without
learning a build system.

## Current status

**Adopted:** DTCG-shaped JSON under [`tokens/`](../tokens/) is the source of
truth (one file per group). Each token has `$type`, `$value`, `$description`,
and `tier` (`core` | `extended`). Optional `usage`, `pairsWith` (contrast), and
`related` (non-contrast links) where helpful.

**Still waiting on:** Style Dictionary / Terrazzo — a small custom generator is
enough while names move. CSS custom property name = `--` + path segments joined
by `-` (e.g. `text.primary` → `--text-primary`).

**Generator:** `argot generate [path]` (see `src/generate.js`) reads `tokens/`
and writes a `:root` CSS template. (`npm run build:template`).

## Suggested path

1. **Done:** Tokens live in DTCG-shaped JSON with descriptions.
2. **Done:** Small generator → CSS template (`argot generate`).
3. **Next:** Stylelint plugin/config driven by the same token metadata.
4. **Later:** Docs website (token reference from JSON); optionally Style
   Dictionary/Terrazzo if multi-format output becomes necessary.

Avoid leading with Figma / Tokens Studio sync for this repo: the product is a
CSS naming convention, not multi-tool design-system interchange.

## References

- [Do We Need a Modern, Lightweight CSS Toolset?](https://keithjgrant.com/posts/2026/11/do-we-need-a-modern-lightweight-css-toolset/)
- [A Structured Approach to Custom Properties](https://keithjgrant.com/posts/2024/06/a-structured-approach-to-custom-properties/)
- [Design Tokens Community Group](https://www.w3.org/community/design-tokens/)
- [Style Dictionary](https://styledictionary.com/)
- [Terrazzo](https://terrazzo.app/docs/)

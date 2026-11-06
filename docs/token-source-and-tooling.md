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
      "pairsWith": ["bg-body", "bg-main"]
    }
  }
}
```

Custom fields (`usage`, `pairsWith`, `group`, etc.) can pass through Style
Dictionary into whatever doc format we write. `$description` can become CSS
comments and doc prose.

## Fit for this project

This repo is a bit unusual: it ships **shared semantic names** (often with empty
values for consumers to fill in), not a finished multi-platform palette.

Style Dictionary still works, but we would likely want a **custom CSS format**
that emits a template (`--text-primary: ;` or a clear placeholder) rather than
resolved hex/oklch values.

Until names stabilize, a plain DTCG-shaped JSON/YAML file edited by hand is
enough. Collaborators can review diffs of names and descriptions without
learning a build system.

## Integrate now or wait?

**Wait on** Style Dictionary / Terrazzo / a full docs site. Wiring generators
too early means every rename becomes a config/format fight.

**Do adopt a single editable source soon** — even if `variables-template.css`
stays the hand-maintained deliverable for a while:

1. One JSON (or YAML) file per group, or one file with groups
2. Required: name path, `$description`, category
3. Optional: `$type`, usage notes, examples, “core vs extended”
4. Keep the CSS template until updating it by hand is a burden, then add a
   generate script

That gives documentation content _as we bikeshed_, without committing to
tooling.

## Suggested path

1. **Now:** Move tokens into DTCG-shaped JSON with descriptions; keep
   generating/updating `variables-template.css` manually (or with a small
   script).
2. **When the core list feels ~stable:** Add Style Dictionary (or Terrazzo) →
   CSS template + Markdown token pages.
3. **Later:** Host those pages (e.g. GitHub Pages + Eleventy).

Avoid leading with Figma / Tokens Studio sync for this repo: the product is a
CSS naming convention, not multi-tool design-system interchange.

## References

- [Do We Need a Modern, Lightweight CSS Toolset?](https://keithjgrant.com/posts/2026/11/do-we-need-a-modern-lightweight-css-toolset/)
- [A Structured Approach to Custom Properties](https://keithjgrant.com/posts/2024/06/a-structured-approach-to-custom-properties/)
- [Design Tokens Community Group](https://www.w3.org/community/design-tokens/)
- [Style Dictionary](https://styledictionary.com/)
- [Terrazzo](https://terrazzo.app/docs/)

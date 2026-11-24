# Website site map (draft)

IA: **thin marketing + fat Docs**.

**Product story:** an unobtrusive, modular CSS toolset. Lead with the
**processor** and **project scaffold**; palette, semantic vocabulary, and
Stylelint are optional pieces. Scaffold output is ordinary CSS the user owns.

## Primary nav

- Argot (wordmark) → `/`
- Mindset → `/approach/` (explain three-layer custom props approach)
- Docs → `/docs/` (wide + left sidebar, ESLint-style)
- GitHub → external

Four items is still light. No top-level Tokens / Scaffold / Palette—those stay
under Docs. Home can still deep-link Mindset; the header is the durable entry.
Label is **Mindset**; URL stays `/approach/` for now (path need not match label).

**Not recommended in header:** “Custom properties,” “Tokens,” “Semantics,”
“Design tokens”—too docs-y and narrow vs the whole page.

## Layouts

- **Marketing / single column** — `/`, `/approach/` (and similar). Prose
  max-width, no docs sidebar.
- **Docs / wide + sidebar** — `/docs/**`, including the semantic token
  reference.

## Marketing pages

### `/` — Home (keep thin)

Working line: _An unobtrusive toolset for modern CSS development._

Short scroll, not a second docs site.

1. **Hero** — one-breath pitch + modularity (_use the pieces you want_). CTAs:
   Get started → `/docs/getting-started/`, Docs → `/docs/`.
2. **Processor, fast** — minimal setup example (install / one command /
   `@import` assemble → CSS out). Show ease; details in `/docs/processor/`.
3. **Scaffold, briefly** — `argot scaffold` drops a small layered CSS tree
   (shaped like `website/styles/`). One beat on **your files after that**—edit
   and run with; Argot does not own the source. Link → `/docs/scaffold/` and/or
   `/approach/`.
4. **Link strip** — optional; Mindset is already in the header. Prefer CTAs into
   Docs over repeating nav.

Home does **not** carry full what/why, three-tier deep-dive, or capability
catalog.

### `/approach/` — Mindset (single column)

Nav label: **Mindset**. Working line / H1: _Mild opinions, held loosely._

Narrative that would bloat the home page:

- Why a toolset (not a component framework): modern CSS covers most old
  preprocessor jobs; structure and vocabulary are what’s hard.
- **Modularity** as the promise: processor alone, scaffold alone, palette alone,
  semantics template alone, Stylelint optional—compose freely.
- **Three-tier custom properties** (primitive → semantic → module) as the main
  opinion _inside_ the scaffold—not mandatory elsewhere.
- **Ownership:** scaffold CSS is a starting point the user runs with;
  regeneration is explicit; project styles stay theirs.
- Cascade layers + file map at a conceptual level; file-level detail in Docs.

Split later only if this page grows (e.g. `/approach/` + a dedicated scaffold
story).

### Out of marketing header

- Theme Machine — external, from palette docs when useful.
- Releases — footer / docs later.

## Docs (`/docs/**`)

Hub at `/docs/` with a short overview + links.

Sidebar order = jobs: start → pillars → scaffold innards → optional lint → dry
reference.

```text
docs/
  getting-started           # install; first process; optional scaffold
  processor                 # imports-anywhere, layers, maps, minify; API/CLI
  scaffold/
    overview                # what scaffold writes; ownership / regenerate
    architecture            # @layer order; mirrors website/styles
    custom-properties       # primitive → semantic → module
    primitives-palette      # headless palette + definition; standalone OK
    semantic-tokens         # vocabulary; core vs extended
      …                     # browsable token reference (ex-/tokens/)
    modules                 # component-scoped properties
  stylelint/                # optional guardrails
    configs
    rules/…                 # Planned stubs OK
  reference/                # if not fully covered above
    cli
    package-exports
```

**Copy emphasis across docs:**

- Adopt pieces independently; no hidden coupling.
- Scaffold output is user-owned source after write; the processor builds the CSS
  it is given.
- Token reference under Docs (scaffold / semantic tokens)—not a header peer.

## URL map

- `/` — marketing — thin pitch + processor example + soft scaffold CTA — P0
- `/approach/` — marketing — modularity, ownership, three-tier, mindset — P0
- `/docs/` — docs hub — P0
- `/docs/getting-started/` — first hour — P0
- `/docs/processor/` — processor reference — P0
- `/docs/scaffold/` — scaffold overview + ownership — P0
- `/docs/scaffold/architecture/` — layers + file map — P1
- `/docs/scaffold/custom-properties/` — three-tier deep dive — P0
- `/docs/scaffold/primitives-palette/` — palette — P1
- `/docs/scaffold/semantic-tokens/` — vocabulary + reference UI — P0
- `/docs/scaffold/modules/` — module tier — P2
- `/docs/stylelint/**` — stubs until real rules — P2
- `/docs/reference/**` — CLI / exports as APIs settle — P1

## Open choices

1. Token reference URL: under `scaffold/semantic-tokens/` vs flat
   `/docs/tokens/` (nav parent still Docs).
2. CLI name in copy: `argot scaffold` vs final command (`init`, etc.).
3. Whether Docs sidebar also links Mindset under a light “Concepts” entry.
4. Whether to rename `/approach/` → `/mindset/` later (redirect if so).

---
layout: docs.njk
title: CLI
description:
  argot command-line reference—process CSS, semantics, palette, scaffold, help.
permalink: /docs/reference/
---

# CLI

Package name: **`argot-css`**. Binary name: **`argot`**.

```bash
npm install argot-css
npx argot <command>
# or via package.json scripts after install
```

Requires **Node.js 22.18+**. The package is native ESM.

```text
Usage:
  argot <input.css> <output.css> [options]   Process CSS
  argot semantics [path] [--extended]        Write semantic CSS template
  argot palette <definition.json> [out.css]  Write primitive palette CSS
  argot scaffold [directory]                 Write starter stylesheet tree
  argot help                                 Show help
```

Dispatch rules:

- `semantics`, `palette`, `scaffold`, and `help` / `--help` / `-h` are
  subcommands.
- If the first argument ends with `.css`, the CLI runs the **processor** (no
  `process` subcommand).

Deep dives: [Processor]({{ '/docs/processor/' | url }}), [Semantic
tokens]({{ '/docs/scaffold/semantic-tokens/' | url }}), [Palette
generator]({{ '/docs/scaffold/palette-generator/' | url }}),
[Scaffold]({{ '/docs/scaffold/' | url }}).

---

## `argot <input.css> <output.css>`

Assemble local `@import`s, lint, minify, write output.

```bash
argot styles/index.css dist/styles.css
argot styles/index.css dist/styles.css --lint-config=./stylelint.config.js
argot styles/index.css dist/styles.css -c ./stylelint.config.js
```

| Argument / flag        | Meaning                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `input.css`            | Entry stylesheet (required)                                                                   |
| `output.css`           | Destination (required). Parent directories are created.                                       |
| `--lint-config` / `-c` | Stylelint config file. When omitted, built-in default (recommended + `argot/color-contrast`). |

Paths resolve against the current working directory. Does not run palette,
semantics, or scaffold generation.

---

## `argot semantics [path] [--extended]`

Write a semantic custom-property template (`:root` declarations).

```bash
argot semantics
argot semantics ./styles/semantics.css
argot semantics --extended
argot semantics ./styles/semantics-extended.css --extended
```

| Argument / flag | Meaning                                           |
| --------------- | ------------------------------------------------- |
| `path`          | Output file (default `./semantics.css`)           |
| `--extended`    | Include extended-tier tokens (default: core only) |

Creates parent directories as needed. **Overwrites** an existing file at the
output path. Refuses if the path is a directory.

---

## `argot palette <definition.json> [output.css]`

Generate primitive palette CSS from a versioned JSON definition.

```bash
argot palette ./palette.json
argot palette ./palette.json ./styles/primitives.css
argot palette ./palette.json ./styles/primitives.css --dry-run
argot palette ./palette.json ./styles/primitives.css --force
argot palette --help
```

| Argument / flag   | Meaning                                                                           |
| ----------------- | --------------------------------------------------------------------------------- |
| `definition.json` | Palette definition (required)                                                     |
| `output.css`      | Destination (default `./primitives.css`)                                          |
| `--force`         | Allow replacing an existing output file                                           |
| `--dry-run`       | Validate and render without writing (still requires `--force` if the path exists) |
| `--help` / `-h`   | Palette-specific usage                                                            |

Input and output paths must differ. Existing files are refused without
`--force`. See [Palette
generator]({{ '/docs/scaffold/palette-generator/' | url }}) for the definition
schema (`seedColors`, curves, format, gamut).

---

## `argot scaffold [directory]`

Write a starter layered CSS tree (entrypoint, reset, base, token hooks,
modules).

```bash
argot scaffold
argot scaffold ./path/to/project
```

Refuses destructive overwrite of existing consumer-owned files unless forced;
prefer dry-run when available. File map:
[Architecture]({{ '/docs/scaffold/architecture/' | url }}).

---

## `argot help`

```bash
argot help
argot --help
argot -h
```

Prints top-level usage to stdout.

---

## Exit status and errors

Failures (unknown command, invalid args, missing files, validation errors) print
to stderr and exit **nonzero**. Successful writes may print a short confirmation
(e.g. palette `Wrote …`, semantics `Wrote …`, processor destination message).

---

## Library vs CLI

Most generation and palette logic is also available as package subpath imports
(no subprocess). See [Installation]({{ '/docs/installation/' | url }}) and
[Technical details]({{ '/docs/reference/technical/' | url }}). There is **no**
root `argot-css` JS entrypoint—import named subpaths only.

Full typed API notes ship in the package as
[`docs/api.md`](https://github.com/keithjgrant/argot/blob/main/docs/api.md).

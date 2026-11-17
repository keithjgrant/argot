# Agent notes

## Testing conventions

- Name tests with `should…` so each name is a single falsifiable behavior.
- Prefer one property per test. Split conjunctions (`and`, multi-step scripts)
  into separate tests.
- Use `describe` blocks to group tests of the same function or behavior.
- Nest at most two `describe` levels unless deeper grouping clearly helps. Use
  the outer `describe` as the noun (`generateCss`, `--dry-run`) so titles read
  as `{noun} should {verb}`.
- For expensive setup (`npm pack`, Eleventy builds), share one fixture per suite
  via `before`/`after`; do not re-run the setup per assertion.
- `scripts/modules.test.js` and `scripts/package.test.js` are distribution
  checks (package `exports` / packed consumer), not `src/` unit tests—see the
  comment at the top of each file.

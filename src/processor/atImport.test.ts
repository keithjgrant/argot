import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import postcss from 'postcss';
import atImport from './atImport.ts';

async function writeTree(
  files: Record<string, string>,
): Promise<{ dir: string; entry: string }> {
  const dir = await mkdtemp(path.join(tmpdir(), 'argot-import-'));
  let entry = '';
  for (const [relative, contents] of Object.entries(files)) {
    const absolute = path.join(dir, relative);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, contents, 'utf8');
    if (relative === 'entry.css') entry = absolute;
  }
  if (!entry) {
    throw new Error('writeTree requires an entry.css file');
  }
  return { dir, entry };
}

async function processEntry(files: Record<string, string>): Promise<string> {
  const { entry } = await writeTree(files);
  const css = files['entry.css'];
  const result = await postcss([atImport()]).process(css, { from: entry });
  return result.css;
}

describe('at-import', () => {
  test('should inline a relative file after other declarations', async () => {
    const css = await processEntry({
      'entry.css': `@layer reset {
  * { box-sizing: border-box; }
}

@import './base.css';
`,
      'base.css': `body { margin: 0; }
`,
    });

    assert.match(css, /box-sizing:\s*border-box/);
    assert.match(css, /body\s*\{\s*margin:\s*0/);
    assert.doesNotMatch(css, /@import\b/);
  });

  test('should wrap inlined content in @layer when layer() is present', async () => {
    const css = await processEntry({
      'entry.css': `@import './base.css' layer(base);
`,
      'base.css': `body { margin: 0; }
`,
    });

    assert.match(css, /@layer\s+base\s*\{/);
    assert.match(css, /body\s*\{\s*margin:\s*0/);
    assert.doesNotMatch(css, /@import\b/);
  });

  test('should wrap inlined content in @supports when supports() is present', async () => {
    const css = await processEntry({
      'entry.css': `@import './base.css' supports(foo: bar);
`,
      'base.css': `body { margin: 0; }
`,
    });

    assert.match(css, /@supports\s*\(foo:\sbar\)\s*\{/);
    assert.match(css, /body\s*\{\s*margin:\s*0/);
    assert.doesNotMatch(css, /@import\b/);
  });

  test('should wrap inlined content in @scope when scope() is present', async () => {
    const css = await processEntry({
      'entry.css': `@import './base.css' scope(.card);
`,
      'base.css': `body { margin: 0; }
`,
    });

    assert.match(css, /@scope\s*\(\.card\)\s*\{/);
    assert.match(css, /body\s*\{\s*margin:\s*0/);
    assert.doesNotMatch(css, /@import\b/);
  });

  test('should wrap inlined content in @layer and @supports', async () => {
    const css = await processEntry({
      'entry.css': `@import './base.css' layer(base) supports(foo: bar);
`,
      'base.css': `body { margin: 0; }
`,
    });

    assert.match(css, /@layer\s+base\s*\{/);
    assert.match(css, /@supports\s*\(foo:\sbar\)\s*\{/);
    assert.match(css, /body\s*\{\s*margin:\s*0/);
    assert.doesNotMatch(css, /@import\b/);
  });

  test('should wrap inlined content in media query', async () => {
    const css = await processEntry({
      'entry.css': `@import './base.css' (width > 500px);
`,
      'base.css': `body { margin: 0; }
`,
    });

    assert.match(css, /@media\s*\(width\s*>\s*500px\)\s*\{/);
    assert.match(css, /body\s*\{\s*margin:\s*0/);
    assert.doesNotMatch(css, /@import\b/);
  });

  test('should wrap inlined content in @layer and media query', async () => {
    const css = await processEntry({
      'entry.css': `@import './base.css' layer(base) screen and (width > 500px);
`,
      'base.css': `body { margin: 0; }
`,
    });

    assert.match(css, /@layer\s+base\s*\{/);
    assert.match(css, /@media\s*screen\s+and\s*\(width\s*>\s*500px\)\s*\{/);
    assert.match(css, /body\s*\{\s*margin:\s*0/);
    assert.doesNotMatch(css, /@import\b/);
  });

  test('should wrap inlined content in @supports and media query', async () => {
    const css = await processEntry({
      'entry.css': `@import './base.css' supports(foo: bar) (pointer: fine);
`,
      'base.css': `body { margin: 0; }
`,
    });

    assert.match(css, /@supports\s*\(foo:\sbar\)\s*\{/);
    assert.match(css, /@media\s*\(pointer:\s*fine\)\s*\{/);
    assert.match(css, /body\s*\{\s*margin:\s*0/);
    assert.doesNotMatch(css, /@import\b/);
  });

  test('should wrap inlined content in @layer, @supports, and media query', async () => {
    const css = await processEntry({
      'entry.css': `@import './base.css' layer(base) supports(foo: bar) (pointer: fine), (width > 500px);
`,
      'base.css': `body { margin: 0; }
`,
    });

    assert.match(css, /@layer\s+base\s*\{/);
    assert.match(css, /@supports\s*\(foo:\sbar\)\s*\{/);
    assert.match(
      css,
      /@media\s*\(pointer:\s*fine\),\s*\(width\s*>\s*500px\)\s*\{/,
    );
    assert.match(css, /body\s*\{\s*margin:\s*0/);
    assert.doesNotMatch(css, /@import\b/);
  });

  test('should resolve imports relative to the including file', async () => {
    const css = await processEntry({
      'entry.css': `@import './nested/mid.css';
`,
      'nested/mid.css': `@import './deep/child.css';
`,
      'nested/deep/child.css': `.child { color: red; }
`,
    });

    assert.match(css, /\.child\s*\{\s*color:\s*red/);
    assert.doesNotMatch(css, /@import\b/);
  });

  test('should reject a missing file with a useful PostCSS error', async () => {
    const { entry } = await writeTree({
      'entry.css': `@import './missing.css';
`,
    });

    await assert.rejects(
      () =>
        postcss([atImport()]).process(`@import './missing.css';\n`, {
          from: entry,
        }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /Failed to find CSS file to import/);
        assert.match(error.message, /missing\.css/);
        return true;
      },
    );
  });

  test('should reject a cyclic import', async () => {
    const { entry } = await writeTree({
      'entry.css': `@import './a.css';
`,
      'a.css': `@import './b.css';
`,
      'b.css': `@import './a.css';
`,
    });

    await assert.rejects(
      () =>
        postcss([atImport()]).process(`@import './a.css';\n`, { from: entry }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /Circular @import/);
        return true;
      },
    );
  });

  test('should skip a duplicate resolved path', async () => {
    const css = await processEntry({
      'entry.css': `@import './shared.css';
@import './other.css';
`,
      'shared.css': `.shared { color: blue; }
`,
      'other.css': `@import './shared.css';
.other { color: green; }
`,
    });

    const matches = css.match(/\.shared/g) ?? [];
    assert.equal(matches.length, 1);
    assert.match(css, /\.other\s*\{\s*color:\s*green/);
  });

  test('should leave remote http(s) imports unchanged', async () => {
    const css = await processEntry({
      'entry.css': `@import 'https://example.com/styles.css';
@import './local.css';
`,
      'local.css': `.local { display: block; }
`,
    });

    assert.match(css, /@import\s+'https:\/\/example\.com\/styles\.css'/);
    assert.match(css, /\.local\s*\{\s*display:\s*block/);
  });

  test('should produce clean whitespace', async () => {
    const layerCss = await processEntry({
      'entry.css': `@import './local.css' layer(base);\n`,
      'local.css': `.local {\n  display: block;\n}\n`,
    });
    assert.equal(
      layerCss,
      `@layer base {\n.local {\n  display: block;\n}\n}\n\n`,
    );

    const mediaCss = await processEntry({
      'entry.css': `@import './local.css' (width > 500px);\n`,
      'local.css': `.local {\n  display: block;\n}\n`,
    });
    assert.equal(
      mediaCss,
      `@media (width > 500px) {\n.local {\n  display: block;\n}\n}\n\n`,
    );

    const supportCss = await processEntry({
      'entry.css': `@import './local.css' supports(foo: bar);\n`,
      'local.css': `.local {\n  display: block;\n}\n`,
    });
    assert.equal(
      supportCss,
      `@supports (foo: bar) {\n.local {\n  display: block;\n}\n}\n\n`,
    );

    const scopeCss = await processEntry({
      'entry.css': `@import './local.css' scope(.base);\n`,
      'local.css': `.local {\n  display: block;\n}\n`,
    });
    assert.equal(
      scopeCss,
      `@scope (.base) {\n.local {\n  display: block;\n}\n}\n\n`,
    );
  });
});

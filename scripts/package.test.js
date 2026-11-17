/**
 * Distribution / consumer checks, not in-repo unit tests of `src/`.
 *
 * The packed-package suite runs `npm pack`, extracts the tarball into a private
 * workspace, and asserts tarball contents, docs, runtime imports, CLI, and
 * TypeScript consumers against that install—without a registry. Shared `before`
 * setup packs once per suite so those cases stay focused without re-packing.
 *
 * Native development commands copy `src/` and `scripts/dev.js` into a workspace
 * with no `dist/`, confirming the strip-types CLI works as a consumer of source.
 */
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');

function linkDependency(cwd, name) {
  const destination = path.join(cwd, 'node_modules', name);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.symlinkSync(path.join(root, 'node_modules', name), destination, 'dir');
}

describe('packed package', () => {
  /** @type {string} */
  let cwd;
  /** @type {string[]} */
  let files;
  /** @type {string} */
  let installed;
  /** @type {string} */
  let compiler;

  before(() => {
    // Use a private workspace and local dependencies: no registry, publishing, or
    // reliance on source files being adjacent to dist in the package under test.
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-packed-'));
    const output = execFileSync(
      'npm',
      ['pack', '--json', '--pack-destination', cwd],
      { cwd: root, encoding: 'utf8' },
    );
    const [packed] = JSON.parse(output.slice(output.indexOf('[')));
    files = packed.files.map(({ path: filename }) => filename);
    installed = path.join(cwd, 'node_modules/@keithjgrant/argot');
    fs.mkdirSync(installed, { recursive: true });
    execFileSync('tar', [
      '-xzf',
      path.join(cwd, packed.filename),
      '-C',
      installed,
      '--strip-components=1',
    ]);
    fs.writeFileSync(path.join(cwd, 'package.json'), '{"type":"module"}');
    for (const dependency of ['colorjs.io', 'stylelint', '@types']) {
      linkDependency(cwd, dependency);
    }
    for (const file of [
      'consumer.ts',
      'tsconfig.json',
      'browser.ts',
      'tsconfig.browser.json',
    ]) {
      fs.copyFileSync(
        path.join(root, 'scripts/types', file),
        path.join(cwd, file),
      );
    }
    compiler = path.join(
      path.dirname(
        fileURLToPath(import.meta.resolve('typescript/package.json')),
      ),
      'bin/tsc',
    );
  });

  after(() => {
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  describe('tarball contents', () => {
    test('should include compiled palette entrypoints', () => {
      assert.ok(files.includes('dist/palette/index.js'));
      assert.ok(files.includes('dist/palette/index.d.ts'));
    });

    test('should include tokens, templates, and load-tokens', () => {
      assert.ok(files.includes('dist/load-tokens.js'));
      assert.ok(files.includes('tokens/color-text.json'));
      assert.ok(files.includes('templates/semantics.css'));
    });

    test('should include only docs/api.md under docs/', () => {
      assert.ok(files.includes('docs/api.md'));
      assert.deepEqual(
        files.filter((file) => file.startsWith('docs/')),
        ['docs/api.md'],
      );
    });

    test('should omit src and website', () => {
      assert.ok(
        files.every(
          (file) => !file.startsWith('src/') && !file.startsWith('website/'),
        ),
      );
    });

    test('should omit TypeScript sources except declarations', () => {
      assert.ok(
        files.every((file) => !file.endsWith('.ts') || file.endsWith('.d.ts')),
      );
    });
  });

  describe('API reference', () => {
    test('should document public entrypoints', () => {
      const apiReference = fs.readFileSync(
        path.join(installed, 'docs/api.md'),
        'utf8',
      );
      for (const entrypoint of [
        '@keithjgrant/argot/palette',
        '@keithjgrant/argot/palette/node',
        '@keithjgrant/argot/generate',
        '@keithjgrant/argot/stylelint',
        '@keithjgrant/argot/stylelint/config',
      ]) {
        assert.ok(
          apiReference.includes(entrypoint),
          `Missing API reference: ${entrypoint}`,
        );
      }
    });
  });

  describe('runtime smoke', () => {
    test('should import and exercise public APIs from the installed package', () => {
      fs.writeFileSync(
        path.join(cwd, 'smoke.js'),
        `
import assert from 'node:assert/strict';
import stylelint from 'stylelint';
import { generateCss } from '@keithjgrant/argot/generate';
import {
  generatePalette, generatePaletteCss, parseCssColor, serializePaletteDefinition,
} from '@keithjgrant/argot/palette';
import { loadPaletteDefinition, writePalette } from '@keithjgrant/argot/palette/node';
import plugins from '@keithjgrant/argot/stylelint';
import config from '@keithjgrant/argot/stylelint/config';
const definition = { version: 1, seedColors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }] };
assert.deepEqual(parseCssColor('oklch(60% 0.2 250)'), { l: 0.6, c: 0.2, h: 250 });
const palette = generatePalette(definition);
assert.equal(palette.colors[0].steps.length, 16);
assert.match(generatePaletteCss(definition), /--brand-16:/);
assert.match(generateCss(), /--text-primary:/);
assert.equal(plugins[0].ruleName, 'argot/valid-token');
const result = writePalette('palette.css', definition);
assert.equal(result.written, true);
const fs = await import('node:fs');
fs.writeFileSync('palette.json', serializePaletteDefinition(definition));
assert.equal(loadPaletteDefinition('palette.json').version, 1);
const lint = await stylelint.lint({
  code: 'a { color: var(--text-primary); }',
  config: { extends: ['@keithjgrant/argot/stylelint/config'] },
  cwd: process.cwd(),
});
assert.equal(lint.errored, false);
assert.ok(config.plugins[0].endsWith('/dist/stylelint/index.js'));
`,
      );
      execFileSync(
        process.execPath,
        ['--no-experimental-strip-types', 'smoke.js'],
        {
          cwd,
          stdio: 'pipe',
        },
      );
    });
  });

  describe('CLI', () => {
    test('should generate semantics.css', () => {
      execFileSync(
        process.execPath,
        [
          '--no-experimental-strip-types',
          path.join(installed, 'bin/argot.js'),
          'generate',
          'semantics.css',
        ],
        { cwd, stdio: 'pipe' },
      );
      assert.match(
        fs.readFileSync(path.join(cwd, 'semantics.css'), 'utf8'),
        /--text-primary:/,
      );
    });

    test('should generate palette CSS', () => {
      fs.writeFileSync(
        path.join(cwd, 'palette.json'),
        JSON.stringify({
          version: 1,
          seedColors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
        }),
      );
      execFileSync(
        process.execPath,
        [
          '--no-experimental-strip-types',
          path.join(installed, 'bin/argot.js'),
          'palette',
          'palette.json',
          'cli-palette.css',
        ],
        { cwd, stdio: 'pipe' },
      );
      assert.match(
        fs.readFileSync(path.join(cwd, 'cli-palette.css'), 'utf8'),
        /--brand-16:/,
      );
    });
  });

  describe('TypeScript consumers', () => {
    test('should typecheck the node consumer project', () => {
      execFileSync(process.execPath, [compiler, '--project', 'tsconfig.json'], {
        cwd,
        stdio: 'pipe',
      });
    });

    test('should typecheck the browser consumer project', () => {
      execFileSync(
        process.execPath,
        [compiler, '--project', 'tsconfig.browser.json'],
        {
          cwd,
          stdio: 'pipe',
        },
      );
    });
  });
});

describe('native development commands', () => {
  /** @type {string} */
  let cwd;

  before(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-distribution-'));
    for (const directory of ['src', 'tokens']) {
      fs.cpSync(path.join(root, directory), path.join(cwd, directory), {
        recursive: true,
      });
    }
    fs.mkdirSync(path.join(cwd, 'scripts'));
    fs.copyFileSync(
      path.join(root, 'scripts/dev.js'),
      path.join(cwd, 'scripts/dev.js'),
    );
    fs.writeFileSync(path.join(cwd, 'package.json'), '{"type":"module"}');
    linkDependency(cwd, 'colorjs.io');
    fs.writeFileSync(
      path.join(cwd, 'palette.json'),
      JSON.stringify({
        version: 1,
        seedColors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
      }),
    );
    execFileSync(
      process.execPath,
      ['scripts/dev.js', 'generate', 'semantics.css'],
      { cwd, stdio: 'pipe' },
    );
    execFileSync(
      process.execPath,
      ['scripts/dev.js', 'palette', 'palette.json'],
      { cwd, stdio: 'pipe' },
    );
  });

  after(() => {
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  test('should generate semantics.css without a dist directory', () => {
    assert.match(
      fs.readFileSync(path.join(cwd, 'semantics.css'), 'utf8'),
      /--text-primary:/,
    );
  });

  test('should generate palette CSS without a dist directory', () => {
    assert.match(
      fs.readFileSync(path.join(cwd, 'primitives.css'), 'utf8'),
      /--brand-16:/,
    );
  });

  test('should leave no dist directory', () => {
    assert.equal(fs.existsSync(path.join(cwd, 'dist')), false);
  });
});

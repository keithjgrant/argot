import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import stylelint from 'stylelint';
import postcssConfig from '../../postcss.config.js';

const root = path.resolve(import.meta.dirname, '../..');
const entrypoint = path.join(root, 'website/content/assets/site.css');

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-css-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('CSS imports preserve partial order and native rules', async () => {
  const entry = postcss.parse(fs.readFileSync(entrypoint, 'utf8'));
  const partials = entry.nodes.map((node) => {
    assert.equal(node.name, 'import');
    const filename = node.params.replace(/^['"]|['"]$/g, '');
    return fs.readFileSync(
      path.resolve(path.dirname(entrypoint), filename),
      'utf8',
    );
  });
  const expected = postcss.parse(partials.join('\n'));
  const compiled = await postcss(postcssConfig.plugins).process(
    entry.toString(),
    {
      ...postcssConfig,
      from: entrypoint,
    },
  );
  const actual = postcss.parse(compiled.css);
  assert.deepEqual(
    actual.nodes.map((node) => node.toString()),
    expected.nodes.map((node) => node.toString()),
  );
  assert.ok(!actual.nodes.some((node) => node.name === 'import'));
});

test('Stylelint reports unknown CSS properties', async () => {
  const result = await stylelint.lint({
    code: 'a { colro: red; }\n',
    configFile: path.join(root, 'website/stylelint.config.js'),
  });
  assert.equal(result.errored, true);
  assert.ok(
    result.results[0].warnings.some(
      (warning) => warning.rule === 'property-no-unknown',
    ),
  );
});

test('missing partials fail import processing', async (t) => {
  const directory = temporaryDirectory(t);
  const entry = path.join(directory, 'site.css');
  fs.writeFileSync(entry, '@import "./missing.css";\n');
  await assert.rejects(
    postcss(postcssConfig.plugins).process(fs.readFileSync(entry, 'utf8'), {
      ...postcssConfig,
      from: entry,
    }),
    /missing\.css/,
  );
});

test(
  'Eleventy watch rebuilds CSS after a partial edit',
  { timeout: 20000 },
  async (t) => {
    const directory = temporaryDirectory(t);
    for (const file of [
      'package.json',
      'postcss.config.js',
      'src',
      'tokens',
      'website/content',
      'website/_includes',
      'website/assets',
      'website/lib',
      'website/stylelint.config.js',
      'website/eleventy.config.js',
    ]) {
      fs.cpSync(path.join(root, file), path.join(directory, file), {
        recursive: true,
      });
    }
    fs.symlinkSync(
      path.join(root, 'node_modules'),
      path.join(directory, 'node_modules'),
      'dir',
    );
    const cli = path.resolve(
      path.dirname(fileURLToPath(import.meta.resolve('@11ty/eleventy'))),
      '../cmd.cjs',
    );
    const child = spawn(
      process.execPath,
      [cli, '--config=website/eleventy.config.js', '--watch'],
      {
        cwd: directory,
        env: { ...process.env, WEBSITE_PATH_PREFIX: '/' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    const closed = once(child, 'close');
    let log = '';
    child.stdout.on('data', (chunk) => (log += chunk));
    child.stderr.on('data', (chunk) => (log += chunk));
    t.after(async () => {
      child.kill();
      await closed;
    });

    async function waitFor(predicate) {
      const deadline = Date.now() + 8000;
      while (!predicate()) {
        assert.equal(child.exitCode, null, log);
        assert.ok(
          Date.now() < deadline,
          `Timed out waiting for CSS rebuild:\n${log}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    const output = path.join(directory, 'website/_site/assets/site.css');
    await waitFor(() => log.includes('Watching') && fs.existsSync(output));
    await new Promise((resolve) => setTimeout(resolve, 250));
    const theme = path.join(directory, 'website/content/assets/_theme.css');
    fs.writeFileSync(
      theme,
      fs
        .readFileSync(theme, 'utf8')
        .replace('\n}', '\n  --test-partial-edit: 42px;\n}'),
    );
    await waitFor(() =>
      fs.readFileSync(output, 'utf8').includes('--test-partial-edit: 42px'),
    );
    assert.doesNotMatch(fs.readFileSync(output, 'utf8'), /@import\b/);
  },
);

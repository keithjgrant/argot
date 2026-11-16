import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import os from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { buildReference } from '../lib/reference.js';
import { SECTIONS, loadTokens, getTokensDir } from '../../src/load-tokens.ts';
import { matchesToken, initializeSearch } from '../assets/token-search.js';

const root = path.resolve(import.meta.dirname, '../..');
const reference = buildReference();

function sourceTokens() {
  const records = [];
  function visit(node, parts) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    if ('$value' in node || '$type' in node) {
      records.push({ ...node, name: `--${parts.join('-')}` });
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      visit(value, [...parts, key]);
    }
  }
  for (const { file } of SECTIONS) {
    visit(JSON.parse(fs.readFileSync(path.join(root, 'tokens', file))), []);
  }
  return records;
}

describe('reference', () => {
  test('should preserve source token names in source order', () => {
    const source = sourceTokens();
    const generated = reference.sections.flatMap((section) => section.tokens);
    assert.deepEqual(
      generated.map((token) => token.name),
      source.map((token) => token.name),
    );
  });

  test('should count every source token in total', () => {
    assert.equal(reference.total, sourceTokens().length);
    assert.equal(reference.core + reference.extended, reference.total);
  });

  test('should assign a unique id for every token', () => {
    const generated = reference.sections.flatMap((section) => section.tokens);
    assert.equal(
      new Set(generated.map((token) => token.id)).size,
      sourceTokens().length,
    );
  });

  test('should preserve token metadata fields', () => {
    const source = sourceTokens();
    const generated = reference.sections.flatMap((section) => section.tokens);
    for (const [index, token] of generated.entries()) {
      assert.equal(token.type, source[index].$type);
      assert.equal(token.description, source[index].$description);
      assert.equal(token.usage, source[index].usage || '');
      assert.equal(token.value, source[index].$value);
      for (const field of ['pairsWith', 'related']) {
        assert.deepEqual(
          token[field].map((partner) => partner.name),
          (source[index][field] || []).map((name) => `--${name}`),
        );
      }
    }
  });

  test('should include section title, intro, and example', () => {
    for (const section of reference.sections) {
      assert.ok(section.title && section.intro && section.example);
    }
  });
});

describe('shared loader', () => {
  test('should resolve token directories', () => {
    assert.equal(getTokensDir(), path.join(root, 'tokens'));
    assert.equal(
      getTokensDir(path.join(root, 'example-package')),
      path.join(root, 'example-package/tokens'),
    );
  });

  test('should filter to core tokens by default', () => {
    const all = loadTokens({ extended: true });
    const core = loadTokens();
    assert.deepEqual(
      core,
      all.map((section) => ({
        ...section,
        tokens: section.tokens.filter((token) => token.tier === 'core'),
      })),
    );
  });

  test('should include extended tokens when requested', () => {
    assert.ok(
      loadTokens({ extended: true }).some((section) =>
        section.tokens.some((token) => token.tier === 'extended'),
      ),
    );
  });
});

describe('website adaptation', () => {
  test('should not mutate shared token data when building reference', () => {
    const before = loadTokens({ extended: true });
    buildReference();
    assert.deepEqual(loadTokens({ extended: true }), before);
  });

  test('should keep pairsWith as string names in loader output', () => {
    const primary = loadTokens({ extended: true })
      .flatMap((section) => section.tokens)
      .find((token) => token.name === '--text-primary');
    assert.ok(primary.pairsWith.every((name) => typeof name === 'string'));
  });
});

// TODO flaky
describe('watch mode', () => {
  test(
    'should reload native TypeScript source without compiling',
    { timeout: 20000 },
    async (t) => {
      const cwd = fs.mkdtempSync(
        path.join(os.tmpdir(), 'argot-website-native-'),
      );
      t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
      for (const directory of ['src', 'tokens', 'website']) {
        fs.cpSync(path.join(root, directory), path.join(cwd, directory), {
          recursive: true,
          filter: (source) =>
            !source
              .split(path.sep)
              .some((part) => part === '_site' || part === '.test-output'),
        });
      }
      fs.copyFileSync(
        path.join(root, 'postcss.config.js'),
        path.join(cwd, 'postcss.config.js'),
      );
      fs.writeFileSync(path.join(cwd, 'package.json'), '{"type":"module"}');
      fs.symlinkSync(
        path.join(root, 'node_modules'),
        path.join(cwd, 'node_modules'),
        'dir',
      );
      const child = spawn(
        process.execPath,
        [
          path.resolve(
            path.dirname(fileURLToPath(import.meta.resolve('@11ty/eleventy'))),
            '../cmd.cjs',
          ),
          '--config=website/eleventy.config.js',
          '--watch',
        ],
        { cwd, stdio: ['ignore', 'pipe', 'pipe'] },
      );
      let log = '';
      child.stdout.on('data', (data) => {
        log += data;
      });
      child.stderr.on('data', (data) => {
        log += data;
      });
      let error;
      child.on('error', (cause) => {
        error = cause;
      });
      const closed = new Promise((resolve) => child.once('close', resolve));
      try {
        async function until(predicate) {
          const deadline = Date.now() + 7000;
          while (!predicate()) {
            assert.equal(error, undefined);
            assert.equal(child.exitCode, null, log);
            assert.ok(Date.now() < deadline, log);
            await delay(50);
          }
        }
        await until(() => log.includes('Watching'));
        const loader = path.join(cwd, 'src/load-tokens.ts');
        fs.writeFileSync(
          loader,
          fs
            .readFileSync(loader, 'utf8')
            .replace(
              "description: node.$description || ''",
              "description: 'Native TypeScript reload verified'",
            ),
        );
        const page = path.join(
          cwd,
          'website/_site/tokens/color-text/index.html',
        );
        await until(
          () =>
            fs.existsSync(page) &&
            fs
              .readFileSync(page, 'utf8')
              .includes('Native TypeScript reload verified'),
        );
        assert.equal(fs.existsSync(path.join(cwd, 'dist')), false);
        assert.doesNotMatch(
          log,
          /problem was encountered looking for JavaScript dependencies/,
        );
      } finally {
        child.kill('SIGTERM');
        await closed;
      }
    },
  );
});

for (const prefix of ['/', '/argot/']) {
  describe(`build at ${prefix}`, () => {
    /** @type {string} */
    let output;
    /** @type {Map<string, { html: string, ids: Set<string> }>} */
    let pages;

    before(() => {
      output = path.join(
        root,
        'website/.test-output',
        prefix === '/' ? 'root' : 'prefixed',
      );
      fs.mkdirSync(output, { recursive: true });
      execFileSync(
        process.execPath,
        [
          path.resolve(
            path.dirname(fileURLToPath(import.meta.resolve('@11ty/eleventy'))),
            '../cmd.cjs',
          ),
          '--config=website/eleventy.config.js',
          `--output=${output}`,
          `--pathprefix=${prefix}`,
        ],
        { cwd: root, stdio: 'pipe' },
      );

      pages = new Map();
      function readPages(directory) {
        for (const entry of fs.readdirSync(directory, {
          withFileTypes: true,
        })) {
          const file = path.join(directory, entry.name);
          if (entry.isDirectory()) readPages(file);
          else if (file.endsWith('.html')) {
            const html = fs.readFileSync(file, 'utf8');
            const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
            pages.set(file, { html, ids: new Set(ids) });
          }
        }
      }
      readPages(output);
    });

    after(() => {
      fs.rmSync(output, { recursive: true, force: true });
    });

    test('should keep unique ids on every page', () => {
      for (const [file, { html, ids }] of pages) {
        const listed = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
        assert.equal(ids.size, listed.length, `Duplicate id in ${file}`);
      }
    });

    test('should bundle site CSS without imports', () => {
      const css = fs.readFileSync(path.join(output, 'assets/site.css'), 'utf8');
      assert.doesNotMatch(css, /@import\b/);
      assert.match(css, /--bg-body:/);
      assert.deepEqual(
        fs
          .readdirSync(path.join(output, 'assets'))
          .filter((file) => file.endsWith('.css')),
        ['site.css'],
      );
    });

    test('should include every token on its section page', () => {
      for (const section of reference.sections) {
        const file = path.join(output, 'tokens', section.slug, 'index.html');
        const { html, ids } = pages.get(file);
        for (const token of section.tokens) {
          assert.ok(ids.has(token.id), `Missing ${token.name} in ${file}`);
          assert.ok(
            html.includes(token.name),
            `Missing ${token.name} text in ${file}`,
          );
        }
      }
    });

    test('should prefix internal URLs', () => {
      for (const [file, { html }] of pages) {
        const relative = path.relative(output, file).split(path.sep).join('/');
        const pageUrl = new URL(`${prefix}${relative}`, 'https://example.test');
        for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
          const href = match[1].replaceAll('&amp;', '&');
          const target = new URL(href, pageUrl);
          if (target.origin !== pageUrl.origin) continue;
          assert.ok(
            target.pathname.startsWith(prefix),
            `Unprefixed URL ${href} in ${file}`,
          );
        }
      }
    });

    test('should resolve internal links and fragments', () => {
      for (const [file, { html }] of pages) {
        const relative = path.relative(output, file).split(path.sep).join('/');
        const pageUrl = new URL(`${prefix}${relative}`, 'https://example.test');
        for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
          const href = match[1].replaceAll('&amp;', '&');
          const target = new URL(href, pageUrl);
          if (target.origin !== pageUrl.origin) continue;
          const local = target.pathname.slice(prefix.length);
          const destination = path.join(
            output,
            local,
            target.pathname.endsWith('/') ? 'index.html' : '',
          );
          assert.ok(fs.existsSync(destination), `Missing ${href} from ${file}`);
          if (target.hash) {
            assert.ok(
              pages
                .get(destination)
                ?.ids.has(decodeURIComponent(target.hash.slice(1))),
              `Missing fragment ${href} from ${file}`,
            );
          }
        }
      }
    });

    test('should list every token on the overview', () => {
      const overview = pages.get(path.join(output, 'tokens/index.html')).html;
      assert.equal(
        [...overview.matchAll(/data-token-entry\b/g)].length,
        reference.total,
      );
    });

    test('should ship hidden filter markup and a module script', () => {
      const overview = pages.get(path.join(output, 'tokens/index.html')).html;
      assert.match(overview, /data-token-filters hidden/);
      assert.doesNotMatch(overview, /data-token-entry[^>]*\bhidden/);
      assert.match(overview, /type="module"/);
    });
  });
}

describe('search', () => {
  const text = '--text-secondary Supporting copy. Usage: subtitles, metadata';

  test('should match token names case-insensitively', () => {
    assert.ok(matchesToken(text, 'core', 'TEXT-secondary', 'all'));
  });

  test('should match description and usage words', () => {
    assert.ok(matchesToken(text, 'core', 'supporting metadata', 'core'));
  });

  test('should treat whitespace-only query as matching when the tier allows', () => {
    assert.ok(matchesToken(text, 'core', '   ', 'all'));
  });

  test('should exclude tokens outside the selected tier', () => {
    assert.ok(!matchesToken(text, 'core', '', 'extended'));
  });

  test('should reject unmatched query terms', () => {
    assert.ok(!matchesToken(text, 'core', 'chart', 'all'));
  });
});

describe('filter UI', () => {
  function setup() {
    const query = { value: '' };
    const tier = { value: 'all' };
    const listeners = {};
    const form = {
      hidden: true,
      elements: { namedItem: (name) => (name === 'query' ? query : tier) },
      addEventListener: (event, callback) => (listeners[event] = callback),
    };
    const entries = [
      { textContent: '--text-primary Main copy', dataset: { tier: 'core' } },
      {
        textContent: '--icon-primary Default icon',
        dataset: { tier: 'extended' },
      },
    ];
    const groups = entries.map((entry) => ({
      querySelectorAll: () => [entry],
    }));
    const count = {};
    const empty = {};
    const rootElement = {
      querySelector: (selector) =>
        ({
          '[data-token-filters]': form,
          '[data-result-count]': count,
          '[data-no-results]': empty,
        })[selector],
      querySelectorAll: () => groups,
    };
    initializeSearch(rootElement);
    return { query, tier, listeners, form, entries, groups, count, empty };
  }

  test('should show the filter form on initialize', () => {
    const { form } = setup();
    assert.equal(form.hidden, false);
  });

  test('should report the total token count', () => {
    const { count } = setup();
    assert.equal(count.textContent, '2 tokens');
  });

  test('should hide empty groups when filtering by tier', () => {
    const { tier, listeners, groups, count } = setup();
    tier.value = 'extended';
    listeners.change();
    assert.equal(count.textContent, '1 token');
    assert.equal(groups[0].hidden, true);
  });

  test('should show no-results when nothing matches', () => {
    const { query, listeners, groups, count, empty } = setup();
    query.value = 'not-a-token';
    listeners.input();
    assert.equal(count.textContent, '0 tokens');
    assert.equal(empty.hidden, false);
    assert.ok(groups.every((group) => group.hidden));
  });

  test('should restore all tokens when filters reset', () => {
    const { query, tier, listeners, entries, count, empty } = setup();
    tier.value = 'extended';
    listeners.change();
    query.value = 'not-a-token';
    listeners.input();
    tier.value = 'all';
    query.value = '';
    listeners.input();
    assert.equal(count.textContent, '2 tokens');
    assert.equal(empty.hidden, true);
    assert.ok(entries.every((entry) => !entry.hidden));
  });
});

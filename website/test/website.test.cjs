const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { buildReference } = require('../lib/reference.cjs');
const { generateCss } = require('../../src/generate');
const { SECTIONS, loadTokens, tokensDir } = require('../../src/load-tokens');

const root = path.resolve(__dirname, '../..');
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

test('reference preserves every source token and its metadata in source order', () => {
  const source = sourceTokens();
  const generated = reference.sections.flatMap((section) => section.tokens);
  assert.deepEqual(
    generated.map((token) => token.name),
    source.map((token) => token.name),
  );
  assert.equal(reference.total, source.length);
  assert.equal(reference.core + reference.extended, reference.total);
  assert.equal(new Set(generated.map((token) => token.id)).size, source.length);
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
  for (const section of reference.sections) {
    assert.ok(section.title && section.intro && section.example);
  }
});

test('shared loader preserves core filtering and resolves token directories', () => {
  const all = loadTokens({ extended: true });
  const core = loadTokens();
  assert.equal(tokensDir(), path.join(root, 'tokens'));
  assert.equal(
    tokensDir(path.join(root, 'example-package')),
    path.join(root, 'example-package/tokens'),
  );
  assert.deepEqual(
    core,
    all.map((section) => ({
      ...section,
      tokens: section.tokens.filter((token) => token.tier === 'core'),
    })),
  );
  assert.ok(
    all.some((section) => section.tokens.some((t) => t.tier === 'extended')),
  );
});

test('website adaptation does not mutate shared token data', () => {
  const before = loadTokens({ extended: true });
  buildReference();
  assert.deepEqual(loadTokens({ extended: true }), before);
  const primary = before
    .flatMap((section) => section.tokens)
    .find((token) => token.name === '--text-primary');
  assert.ok(primary.pairsWith.every((name) => typeof name === 'string'));
});

test('CSS generation is unchanged by the loader extraction', () => {
  for (const extended of [false, true]) {
    const file = extended ? 'semantics-extended.css' : 'semantics.css';
    assert.equal(
      generateCss({ extended }),
      fs.readFileSync(path.join(root, 'templates', file), 'utf8'),
    );
  }
});

for (const prefix of ['/', '/argot/']) {
  test(`build at ${prefix} contains all tokens and working internal links`, async (t) => {
    const output = path.join(
      root,
      'website/.test-output',
      prefix === '/' ? 'root' : 'prefixed',
    );
    fs.mkdirSync(output, { recursive: true });
    t.after(() => fs.rmSync(output, { recursive: true, force: true }));
    execFileSync(
      process.execPath,
      [
        path.resolve(
          path.dirname(require.resolve('@11ty/eleventy')),
          '../cmd.cjs',
        ),
        '--config=website/eleventy.config.cjs',
        `--output=${output}`,
        `--pathprefix=${prefix}`,
      ],
      { cwd: root, stdio: 'pipe' },
    );

    const pages = new Map();
    function readPages(directory) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) readPages(file);
        else if (file.endsWith('.html')) {
          const html = fs.readFileSync(file, 'utf8');
          const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
          assert.equal(
            new Set(ids).size,
            ids.length,
            `Duplicate id in ${file}`,
          );
          pages.set(file, { html, ids: new Set(ids) });
        }
      }
    }
    readPages(output);
    assert.equal(pages.size, reference.sections.length + 3);
    for (const section of reference.sections) {
      const file = path.join(output, 'tokens', section.slug, 'index.html');
      const { html, ids } = pages.get(file);
      assert.equal(
        [...html.matchAll(/class="token-detail"/g)].length,
        section.tokens.length,
      );
      for (const token of section.tokens) assert.ok(ids.has(token.id));
    }

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
    const overview = pages.get(path.join(output, 'tokens/index.html')).html;
    assert.equal(
      [...overview.matchAll(/data-token-entry\b/g)].length,
      reference.total,
    );
    assert.match(overview, /data-token-filters hidden/);
    assert.doesNotMatch(overview, /data-token-entry[^>]*\bhidden/);
    assert.match(overview, /type="module"/);
  });
}

test('search matches names, descriptions, usage, case, words, and tiers', async () => {
  const { matchesToken } = await import(
    pathToFileURL(path.join(root, 'website/assets/token-search.mjs'))
  );
  const text = '--text-secondary Supporting copy. Usage: subtitles, metadata';
  assert.ok(matchesToken(text, 'core', 'TEXT-secondary', 'all'));
  assert.ok(matchesToken(text, 'core', 'supporting metadata', 'core'));
  assert.ok(matchesToken(text, 'core', '   ', 'all'));
  assert.ok(!matchesToken(text, 'core', '', 'extended'));
  assert.ok(!matchesToken(text, 'core', 'chart', 'all'));
});

test('filter UI hides empty groups, reports results, and resets', async () => {
  const { initializeSearch } = await import(
    pathToFileURL(path.join(root, 'website/assets/token-search.mjs'))
  );
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
  const groups = entries.map((entry) => ({ querySelectorAll: () => [entry] }));
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
  assert.equal(form.hidden, false);
  assert.equal(count.textContent, '2 tokens');
  tier.value = 'extended';
  listeners.change();
  assert.equal(count.textContent, '1 token');
  assert.equal(groups[0].hidden, true);
  query.value = 'not-a-token';
  listeners.input();
  assert.equal(count.textContent, '0 tokens');
  assert.equal(empty.hidden, false);
  assert.ok(groups.every((group) => group.hidden));
  tier.value = 'all';
  query.value = '';
  listeners.input();
  assert.equal(count.textContent, '2 tokens');
  assert.equal(empty.hidden, true);
  assert.ok(entries.every((entry) => !entry.hidden));
});

import guides from './guides.js';

// Eleventy 3's dependency scanner only parses JavaScript. Keep this native
// TypeScript import dynamic and reload it explicitly when watched source changes.
let { loadTokens } = await import('../../src/semantics/load-tokens.ts');

async function reloadTokenLoader() {
  ({ loadTokens } = await import(
    new URL(
      `../../src/semantics/load-tokens.ts?reload=${Date.now()}`,
      import.meta.url,
    )
  ));
}

function buildReference() {
  const sections = loadTokens({ extended: true }).map((section) => {
    const slug = section.file.replace(/\.json$/, '');
    return {
      ...section,
      ...guides[slug],
      slug,
      url: `/docs/tokens/${slug}/`,
      tokens: section.tokens.map((token) => ({
        ...token,
        id: token.name.slice(2),
        url: `/docs/tokens/${slug}/#${token.name.slice(2)}`,
        hasValue: token.value !== '' && token.value != null,
      })),
    };
  });

  const tokens = sections.flatMap((section) => section.tokens);
  const byName = new Map(tokens.map((token) => [token.id, token]));
  for (const token of tokens) {
    for (const field of ['pairsWith', 'related']) {
      token[field] = token[field].map((name) => {
        const id = name.replace(/^--/, '');
        return { name: `--${id}`, url: byName.get(id)?.url || null };
      });
    }
  }
  return {
    sections,
    total: tokens.length,
    core: tokens.filter((token) => token.tier === 'core').length,
    extended: tokens.filter((token) => token.tier === 'extended').length,
  };
}

export { buildReference, reloadTokenLoader };

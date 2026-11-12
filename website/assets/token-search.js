export function matchesToken(text, tokenTier, query, tier) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return (
    (tier === 'all' || tokenTier === tier) &&
    words.every((word) => text.toLowerCase().includes(word))
  );
}

export function initializeSearch(root) {
  const form = root.querySelector('[data-token-filters]');
  if (!form) return;

  const query = form.elements.namedItem('query');
  const tier = form.elements.namedItem('tier');
  const groups = [...root.querySelectorAll('[data-token-group]')].map(
    (element) => ({
      element,
      entries: [...element.querySelectorAll('[data-token-entry]')].map(
        (entry) => ({ element: entry, text: entry.textContent }),
      ),
    }),
  );

  function update() {
    let total = 0;
    for (const group of groups) {
      let count = 0;
      for (const entry of group.entries) {
        const matches = matchesToken(
          entry.text,
          entry.element.dataset.tier,
          query.value,
          tier.value,
        );
        entry.element.hidden = !matches;
        if (matches) count++;
      }
      group.element.hidden = count === 0;
      total += count;
    }
    root.querySelector('[data-result-count]').textContent =
      `${total} ${total === 1 ? 'token' : 'tokens'}`;
    root.querySelector('[data-no-results]').hidden = total !== 0;
  }

  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.hidden = false;
  update();
}

if (typeof document !== 'undefined') initializeSearch(document);

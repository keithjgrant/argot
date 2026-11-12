const fs = require('fs');
const path = require('path');
const { loadTokens } = require('./load-tokens');

/**
 * Write the CSS template to disk.
 * @param {string} outPath
 * @param {{ extended?: boolean }} [options]
 */
function writeTemplate(outPath, options = {}) {
  const css = generateCss(options);
  const resolved = path.resolve(outPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, css, 'utf8');
  return resolved;
}

/**
 * Generate CSS text from the package tokens directory.
 * @param {{ extended?: boolean }} [options]
 */
function generateCss(options = {}) {
  return renderCss(loadTokens(options));
}

/**
 * Build a :root CSS template from loaded sections.
 * @param {ReturnType<typeof loadTokens>} sections
 */
function renderCss(sections) {
  const blocks = [];

  for (const section of sections) {
    const { label, tokens } = section;
    if (tokens.length === 0) continue;

    const lines = [`  /* ${label} */`];
    lines.push(...formatTokenRun(tokens));

    blocks.push(lines.join('\n'));
  }

  return [':root {', blocks.join('\n\n'), '}', ''].join('\n');
}

/**
 * Emit tokens in source order.
 * @param {Array<{ name: string, value: string, tier: string }>} tokens
 */
function formatTokenRun(tokens) {
  const lines = [];

  for (const token of tokens) {
    lines.push(formatDeclaration(token));
  }
  return lines;
}

function formatDeclaration(token) {
  const value =
    token.value === '' || token.value === null || token.value === undefined
      ? ' '
      : ` ${token.value}`;
  return `  ${token.name}:${value};`;
}

module.exports = {
  generateCss,
  renderCss,
  writeTemplate,
};

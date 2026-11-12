const fs = require('fs');
const path = require('path');

/** Ordered token files → section labels in the generated CSS. */
const SECTIONS = [
  { file: 'color-bg.json', label: 'color — surfaces' },
  { file: 'color-text.json', label: 'color — text' },
  { file: 'color-border.json', label: 'color — borders' },
  { file: 'color-icon.json', label: 'color — icons' },
  { file: 'color-chart.json', label: 'color — charts' },
  { file: 'typography.json', label: 'typography' },
  { file: 'spacing.json', label: 'spacing' },
  { file: 'borders.json', label: 'borders' },
  { file: 'motion.json', label: 'motion' },
  { file: 'layout.json', label: 'layout' },
  { file: 'misc.json', label: 'misc' },
];

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
 * Load all token files into ordered sections of flat token records.
 * @param {{ extended?: boolean }} [options]
 */
function loadTokens(options = {}) {
  const dir = tokensDir();

  return SECTIONS.map(({ file, label }) => {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing token file: ${filePath}`);
    }
    const tokens = [];
    walk(JSON.parse(fs.readFileSync(filePath, 'utf8')), [], tokens);
    return {
      file,
      label,
      tokens: tokens.filter((t) => {
        if (t.tier === 'core') {
          return true;
        }
        if (options.extended) {
          return true;
        }
        return false;
      }),
    };
  });
}

function tokensDir(packageRoot = path.join(__dirname, '..')) {
  return path.join(packageRoot, 'tokens');
}

function walk(node, parts, out) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return;
  if (isToken(node)) {
    out.push({
      name: `--${parts.join('-')}`,
      value: node.$value === undefined || node.$value === '' ? '' : node.$value,
      description: node.$description || '',
      tier: node.tier === 'extended' ? 'extended' : 'core',
      type: node.$type || '',
      usage: node.usage || '',
      pairsWith: node.pairsWith || [],
      related: node.related || [],
    });
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    walk(child, parts.concat(key), out);
  }
}

function isToken(node) {
  return (
    node &&
    typeof node === 'object' &&
    !Array.isArray(node) &&
    ('$value' in node || '$type' in node)
  );
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
  SECTIONS,
  loadTokens,
  generateCss,
  renderCss,
  writeTemplate,
  tokensDir,
};

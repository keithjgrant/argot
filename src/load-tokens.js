import fs from 'node:fs';
import path from 'node:path';

/** Ordered token groups shared by CSS generation and documentation. */
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
 * Load all token files into ordered sections of flat token records.
 * @param {{ extended?: boolean }} [options]
 */
function loadTokens(options = {}) {
  const dir = getTokensDir();

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

function getTokensDir(packageRoot = path.join(import.meta.dirname, '..')) {
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

export { SECTIONS, loadTokens, getTokensDir };

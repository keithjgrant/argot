import fs from 'node:fs/promises';
import path from 'node:path';
import postcss, { type AtRule, type PluginCreator, type Root } from 'postcss';
import { parseImportParams } from './parseImportParams.ts';

export type ImportOptions = Record<string, never>;

const REMOTE_URI = /^(?:[a-z]+:)?\/\//i;
const DATA_URI = /^data:/i;

const atImport: PluginCreator<ImportOptions | void> = () => ({
  postcssPlugin: 'argot-import',
  async Once(root, { result }) {
    const fromFile = root.source?.input.file ?? result.opts.from;
    if (!fromFile) {
      throw root.error(
        'argot-import requires the PostCSS `from` option (or a file input) so relative @import paths can be resolved',
      );
    }

    const resolvedFrom = path.resolve(fromFile);
    const importedFiles = new Set<string>([resolvedFrom]);
    await processRoot(root, resolvedFrom, [resolvedFrom], importedFiles);
  },
});
atImport.postcss = true;

async function processRoot(
  root: Root,
  fromFile: string,
  stack: string[],
  importedFiles: Set<string>,
): Promise<void> {
  const imports: AtRule[] = [];
  root.walkAtRules('import', (atRule) => {
    imports.push(atRule);
  });

  for (const atRule of imports) {
    if (!atRule.parent) {
      // Skip if already detached from the tree
      continue;
    }
    await processImport(atRule, fromFile, stack, importedFiles);
  }
}

async function processImport(
  atRule: AtRule,
  fromFile: string,
  stack: string[],
  importedFiles: Set<string>,
): Promise<void> {
  const parsed = parseImportParams(atRule.params);
  if (!parsed) {
    throw atRule.error(
      `Invalid @import parameters '${atRule.params}'. ` +
        `Expected a local path or url(), optionally followed by layer(name).`,
    );
  }
  if (isRemote(parsed.uri)) {
    return;
  }

  const importFile = path.resolve(path.dirname(fromFile), parsed.uri);

  if (stack.includes(importFile)) {
    const chain = [...stack, importFile]
      .map((file) => path.relative(process.cwd(), file) || file)
      .join(' -> ');
    throw atRule.error(`Circular @import: ${chain}`);
  }

  if (importedFiles.has(importFile)) {
    atRule.remove();
    return;
  }

  let css: string;
  try {
    css = await fs.readFile(importFile, 'utf8');
  } catch {
    throw atRule.error(`Failed to find CSS file to import: ${parsed.uri}`, {
      word: parsed.uri,
    });
  }

  importedFiles.add(importFile);
  stack.push(importFile);

  let childRoot: Root;
  try {
    childRoot = postcss.parse(css, { from: importFile });
    await processRoot(childRoot, importFile, stack, importedFiles);
  } finally {
    stack.pop();
  }

  replaceImportWithContents(atRule, childRoot.nodes, parsed.layer);
}

function replaceImportWithContents(
  atRule: AtRule,
  nodes: Root['nodes'],
  layer: string | undefined,
): void {
  if (layer !== undefined) {
    const layerRule = postcss.atRule({
      name: 'layer',
      params: layer,
      source: atRule.source,
    });
    layerRule.append(nodes);
    atRule.replaceWith(layerRule);
    return;
  }

  if (nodes.length === 0) {
    atRule.remove();
    return;
  }

  atRule.replaceWith(nodes);
}

function isRemote(uri: string): boolean {
  return REMOTE_URI.test(uri) || DATA_URI.test(uri);
}

export default atImport;

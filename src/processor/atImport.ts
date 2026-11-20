import fs from 'node:fs/promises';
import path from 'node:path';
import postcss, { type AtRule, type PluginCreator, type Root } from 'postcss';
import { parseImportParams, type ParsedImport } from './parseImportParams.ts';

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
  const importParams = parseImportParams(atRule.params);
  if (!importParams) {
    throw atRule.error(
      `Invalid @import parameters '${atRule.params}'. ` +
        `Expected a local path or url(), optionally followed by layer, scope, supports, and media conditions.`,
    );
  }
  if (isRemote(importParams.uri)) {
    return;
  }

  const importFile = path.resolve(path.dirname(fromFile), importParams.uri);

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
    throw atRule.error(
      `Failed to find CSS file to import: ${importParams.uri}`,
      {
        word: importParams.uri,
      },
    );
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

  replaceImportWithContents(atRule, childRoot.nodes, importParams);
}

function replaceImportWithContents(
  atRule: AtRule,
  nodes: Root['nodes'],
  importParams: ParsedImport,
): void {
  const { layer, scope, supports, media } = importParams;
  let contents: Root['nodes'] | AtRule[] = nodes;

  // Nest outside-in as layer → scope → supports → media → content.
  if (media !== undefined) {
    const mediaRule = postcss.atRule({
      name: 'media',
      params: media,
      source: atRule.source,
    });
    prependNewline(contents);
    mediaRule.append(contents);
    contents = [mediaRule];
  }
  if (supports !== undefined) {
    const supportsRule = postcss.atRule({
      name: 'supports',
      params: `(${supports})`,
      source: atRule.source,
    });
    prependNewline(contents);
    supportsRule.append(contents);
    contents = [supportsRule];
  }
  if (scope !== undefined) {
    const scopeRule = postcss.atRule({
      name: 'scope',
      params: scope,
      source: atRule.source,
    });
    prependNewline(contents);
    scopeRule.append(contents);
    contents = [scopeRule];
  }
  if (layer !== undefined) {
    const layerRule = postcss.atRule({
      name: 'layer',
      params: layer,
      source: atRule.source,
    });
    prependNewline(contents);
    layerRule.append(contents);
    contents = [layerRule];
  }

  if (contents.length === 0) {
    atRule.remove();
    return;
  }

  // keep pretty formatting to lint rule isn't triggered by output
  appendNewline(atRule);
  atRule.replaceWith(contents);
}

function isRemote(uri: string): boolean {
  return REMOTE_URI.test(uri) || DATA_URI.test(uri);
}

function prependNewline(nodes: Root['nodes'] | AtRule[]): void {
  if (nodes.length === 0) {
    return;
  }
  nodes[0].raws.before = '\n';
}

function appendNewline(atRule: AtRule): void {
  // Space after a node lives on the next sibling's `before`, or the parent's
  // `after` when this is the last child (Root trailing newline / before `}`).
  const next = atRule.next();
  if (next) {
    next.raws.before = `\n${next.raws.before ?? ''}`;
    return;
  }
  const parent = atRule.parent;
  if (parent) {
    parent.raws.after = `\n${parent.raws.after ?? ''}`;
  }
}

export default atImport;

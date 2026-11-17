import fs from 'node:fs';
import path from 'node:path';
import { loadTokens } from './load-tokens.ts';
import type { TokenOptions, TokenRecord, TokenSection } from './load-tokens.ts';

export type { TokenOptions, TokenRecord, TokenSection } from './load-tokens.ts';

/**
 * Write the CSS template to disk.
 */
function writeTemplate(outPath: string, options: TokenOptions = {}): string {
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
function generateCss(options: TokenOptions = {}): string {
  return renderCss(loadTokens(options));
}

/**
 * Build a :root CSS template from loaded sections.
 */
function renderCss(sections: readonly TokenSection[]): string {
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
 */
function formatTokenRun(tokens: readonly TokenRecord[]): string[] {
  const lines = [];

  for (const token of tokens) {
    lines.push(formatDeclaration(token));
  }
  return lines;
}

function formatDeclaration(token: TokenRecord): string {
  const value =
    token.value === '' || token.value === null || token.value === undefined
      ? ' '
      : ` ${token.value}`;
  return `  ${token.name}:${value};`;
}

export { generateCss, renderCss, writeTemplate };

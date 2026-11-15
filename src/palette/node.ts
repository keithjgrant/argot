import fs from 'node:fs';
import path from 'node:path';
import { normalizePaletteDefinition } from './definition.ts';
import { generatePaletteCss } from './render.ts';
import type {
  NormalizedPaletteDefinition,
  PaletteDefinition,
} from './types.ts';

export interface WritePaletteOptions {
  force?: boolean;
  dryRun?: boolean;
}

export interface WritePaletteResult {
  path: string;
  css: string;
  written: boolean;
}

/** Load and validate a portable JSON definition, resolving paths only in Node. */
function loadPaletteDefinition(filename: string): NormalizedPaletteDefinition {
  const resolved = path.resolve(filename);
  let source;
  try {
    source = fs.readFileSync(resolved, 'utf8');
  } catch (error) {
    throw new Error(
      `Cannot read palette definition "${resolved}": ${(error as NodeJS.ErrnoException).code}`,
    );
  }
  let definition: unknown;
  try {
    definition = JSON.parse(source);
  } catch {
    throw new Error(`Invalid JSON in palette definition "${resolved}"`);
  }
  try {
    return normalizePaletteDefinition(definition);
  } catch (error) {
    throw new Error(
      `Invalid palette definition "${resolved}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Write only explicitly designated output. Dry runs validate without writing.
 * Exclusive creation protects existing files; forced writes reject symlinks
 * and non-regular files rather than following them.
 */
function writePalette(
  outPath: string,
  definition: PaletteDefinition,
  { force = false, dryRun = false }: WritePaletteOptions = {},
): WritePaletteResult {
  const resolved = path.resolve(outPath);
  const css = generatePaletteCss(definition);
  let stat;
  try {
    stat = fs.lstatSync(resolved);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (stat && (!stat.isFile() || stat.isSymbolicLink())) {
    throw new Error(`Refusing to overwrite non-regular file: ${resolved}`);
  }
  if (stat && !force) {
    throw new Error(
      `Output already exists: ${resolved}. Use --force to replace it.`,
    );
  }
  if (!dryRun) {
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    const flags = force
      ? fs.constants.O_WRONLY |
        fs.constants.O_CREAT |
        fs.constants.O_TRUNC |
        fs.constants.O_NOFOLLOW
      : 'wx';
    const descriptor = fs.openSync(resolved, flags);
    try {
      fs.writeFileSync(descriptor, css, 'utf8');
    } finally {
      fs.closeSync(descriptor);
    }
  }
  return { path: resolved, css, written: !dryRun };
}

export { loadPaletteDefinition, writePalette };

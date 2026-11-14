import fs from 'node:fs';
import path from 'node:path';
import { normalizePaletteDefinition } from './definition.js';
import { generatePaletteCss } from './render.js';

/** Load and validate a portable JSON definition, resolving paths only in Node. */
function loadPaletteDefinition(filename) {
  const resolved = path.resolve(filename);
  let source;
  try {
    source = fs.readFileSync(resolved, 'utf8');
  } catch (error) {
    throw new Error(
      `Cannot read palette definition "${resolved}": ${error.code}`,
    );
  }
  let definition;
  try {
    definition = JSON.parse(source);
  } catch {
    throw new Error(`Invalid JSON in palette definition "${resolved}"`);
  }
  try {
    return normalizePaletteDefinition(definition);
  } catch (error) {
    throw new Error(
      `Invalid palette definition "${resolved}": ${error.message}`,
    );
  }
}

/**
 * Write only explicitly designated output. Dry runs validate without writing.
 * Exclusive creation protects existing files; forced writes reject symlinks
 * and non-regular files rather than following them.
 */
function writePalette(
  outPath,
  definition,
  { force = false, dryRun = false } = {},
) {
  const resolved = path.resolve(outPath);
  const css = generatePaletteCss(definition);
  let stat;
  try {
    stat = fs.lstatSync(resolved);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
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
    fs.writeFileSync(resolved, css, { encoding: 'utf8', flag: flags });
  }
  return { path: resolved, css, written: !dryRun };
}

export { loadPaletteDefinition, writePalette };

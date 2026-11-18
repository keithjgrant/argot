export type ParsedImport = {
  uri: string;
  /** Present when `layer` or `layer(name)` appears; empty string is anonymous. */
  layer?: string;
  /** Inner condition from `supports(...)`, when present. */
  supports?: string;
};

const STRING_PATH_PATTERN = /^(['"])([\s\S]*?)\1\s*([\s\S]*)$/;
const URL_PATH_PATTERN = /^url\(\s*(['"]?)([\s\S]*?)\1\s*\)\s*([\s\S]*)$/i;
const LAYER_PATTERN = /^layer(?:\(([^)]*)\))?\s*([\s\S]*)?$/i;

/**
 * Parse `@import` params for a local path (or url()) and optional `layer(…)`.
 * params are everything between '@import' and '{'
 * Returns null when the prelude is empty or not a string/url form.
 */
export function parseImportParams(params: string): ParsedImport | null {
  const trimmed = params.trim();
  if (!trimmed) return null;

  let uri: string | undefined;
  let rest: string;

  const stringMatch = STRING_PATH_PATTERN.exec(trimmed);
  if (stringMatch) {
    uri = stringMatch[2];
    rest = stringMatch[3] ?? '';
  } else {
    const urlMatch = URL_PATH_PATTERN.exec(trimmed);
    if (!urlMatch) return null;
    uri = urlMatch[2];
    rest = urlMatch[3] ?? '';
  }

  if (!uri) return null;

  rest = rest.trim();
  if (!rest) {
    return { uri };
  }

  let layer: string | null = null;
  const layerMatch = LAYER_PATTERN.exec(rest);
  if (layerMatch) {
    layer = layerMatch[1] === undefined ? '' : layerMatch[1].trim();
    rest = (layerMatch[2] ?? '').trim();
  }

  let supports: string | null = null;
  const supportsMatch = matchFunction(rest, 'supports');
  if (supportsMatch) {
    supports = supportsMatch.args;
    rest = supportsMatch.rest;
  }

  if (rest) {
    return null;
  }

  return {
    uri,
    ...(layer !== null && { layer }),
    ...(supports !== null && { supports }),
  };
}

/**
 * If `input` starts with `name(...)`, return balanced args and the remainder.
 * Nested parentheses are counted so `oklch(…)` inside `supports(…)` works.
 */
function matchFunction(
  input: string,
  name: string,
): { args: string; rest: string } | null {
  if (!input.toLowerCase().startsWith(name.toLowerCase())) return null;

  let i = name.length;
  while (i < input.length && /\s/.test(input[i]!)) i++;
  if (input[i] !== '(') return null;

  i++;
  const start = i;
  let depth = 1;
  while (i < input.length && depth > 0) {
    const ch = input[i]!;
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    i++;
  }
  if (depth !== 0) return null;

  return {
    args: input.slice(start, i - 1),
    rest: input.slice(i).trimStart(),
  };
}

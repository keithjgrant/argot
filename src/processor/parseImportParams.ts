export type ParsedImport = {
  uri: string;
  /** Present when `layer` or `layer(name)` appears; empty string is anonymous. */
  layer?: string;
  /**
   * Present when `scope` or `scope(...)` appears; empty string is bare `@scope`.
   */
  scope?: string;
  /** Inner condition from `supports(...)`, when present. */
  supports?: string;
  /** Comma-separated media queries, when present */
  media?: string;
};

const STRING_PATH_PATTERN = /^(['"])([\s\S]*?)\1\s*([\s\S]*)$/;
const URL_PATH_PATTERN = /^url\(\s*(['"]?)([\s\S]*?)\1\s*\)\s*([\s\S]*)$/i;
const FUNCTION_PATTERN = /[A-Za-z0-9]+\(/i;

/**
 * Parse `@import` params per CSS Cascade Level 6:
 *   uri/path, then layer / scope / supports in any order, then media.
 * Returns null when the prelude is empty or not a string/url form.
 */
export function parseImportParams(params: string): ParsedImport | null {
  const trimmed = params.trim();
  if (!trimmed) return null;

  let uri: string | undefined;
  let rest: string;

  // find uri path
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
  let scope: string | null = null;
  let supports: string | null = null;

  // layer || scope || supports, at most once each, any order.
  while (rest) {
    const layerMatch = matchKeywordOrFunction(rest, 'layer', {
      allowBare: true,
    });
    if (layerMatch) {
      if (layer !== null) return null;
      layer = layerMatch.args === null ? '' : layerMatch.args.trim();
      rest = layerMatch.rest.trim();
      continue;
    }

    const scopeMatch = matchKeywordOrFunction(rest, 'scope', {
      allowBare: true,
    });
    if (scopeMatch) {
      if (scope !== null) return null;
      scope = normalizeScopePrelude(scopeMatch.args);
      rest = scopeMatch.rest.trim();
      continue;
    }

    const supportsMatch = matchKeywordOrFunction(rest, 'supports', {
      allowBare: false,
    });
    if (supportsMatch) {
      if (supports !== null) return null;
      supports = supportsMatch.args ?? '';
      rest = supportsMatch.rest.trim();
      continue;
    }

    break;
  }

  // Reject remaining function-like syntax (unknown modifiers before media).
  if (FUNCTION_PATTERN.exec(rest)) {
    return null;
  }

  return {
    uri,
    ...(layer !== null && { layer }),
    ...(scope !== null && { scope }),
    ...(supports !== null && { supports }),
    ...(rest && { media: rest }),
  };
}

/**
 * If `input` starts with `name` or `name(...)`, return args and the remainder.
 * `args` is null for a bare keyword; a string for the function form.
 * Nested parentheses are counted so `oklch(…)` / `scope((…) to (…))` work.
 */
function matchKeywordOrFunction(
  input: string,
  name: string,
  { allowBare }: { allowBare: boolean },
): { args: string | null; rest: string } | null {
  if (!input.toLowerCase().startsWith(name.toLowerCase())) return null;

  const afterName = input.slice(name.length);
  // Require a complete ident token (`layer` not `layerfoo`).
  if (afterName.length > 0 && /[A-Za-z0-9_-]/.test(afterName[0]!)) {
    return null;
  }

  let i = name.length;
  while (i < input.length && /\s/.test(input[i]!)) i++;

  if (input[i] !== '(') {
    if (!allowBare) return null;
    return { args: null, rest: input.slice(name.length).trimStart() };
  }

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

/**
 * Map `scope(...)` args to an `@scope` prelude.
 * - bare `scope` → empty prelude
 * - `scope(.card)` → `(.card)`
 * - `scope((.a) to (.b))` → `(.a) to (.b)`
 */
function normalizeScopePrelude(args: string | null): string {
  if (args === null) return '';
  const trimmed = args.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('(')) {
    return trimmed;
  }
  return `(${trimmed})`;
}

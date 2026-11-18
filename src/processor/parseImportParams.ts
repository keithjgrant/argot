export type ParsedImport = {
  uri: string;
  /** Present when `layer` or `layer(name)` appears; empty string is anonymous. */
  layer?: string;
};

/**
 * Parse `@import` params for a local path (or url()) and optional `layer(…)`.
 * Returns null when the prelude is empty or not a string/url form.
 */
export function parseImportParams(params: string): ParsedImport | null {
  const trimmed = params.trim();
  if (!trimmed) return null;

  let uri: string | undefined;
  let rest: string;

  const stringMatch = /^(['"])([\s\S]*?)\1\s*([\s\S]*)$/.exec(trimmed);
  if (stringMatch) {
    uri = stringMatch[2];
    rest = stringMatch[3] ?? '';
  } else {
    const urlMatch = /^url\(\s*(['"]?)([\s\S]*?)\1\s*\)\s*([\s\S]*)$/i.exec(
      trimmed,
    );
    if (!urlMatch) return null;
    uri = urlMatch[2];
    rest = urlMatch[3] ?? '';
  }

  if (!uri) return null;

  const remainder = rest.trim();
  if (!remainder) {
    return { uri };
  }

  const layerMatch = /^layer(?:\(([^)]*)\))?\s*$/i.exec(remainder);
  if (!layerMatch) {
    return null;
  }

  return {
    uri,
    layer: layerMatch[1] === undefined ? '' : layerMatch[1].trim(),
  };
}

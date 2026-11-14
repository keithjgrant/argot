import Color from 'colorjs.io';
import type {
  NormalizedPaletteDefinition,
  NormalizedPaletteOptions,
  OklchColor,
  PaletteDefinition,
} from './types.ts';

const OPTION_VALUES = {
  lightnessCurve: ['uniform', 'inclusive', 'centered'],
  chromaCurve: ['centered', 'weighted'],
  format: ['oklch', 'hex'],
  gamut: ['p3', 'srgb'],
} as const;

/**
 * Validate a version-1 definition and return a fresh copy with explicit defaults.
 * Color names must also be unique across all emitted step names and aliases.
 */
function normalizePaletteDefinition(definition: unknown): NormalizedPaletteDefinition {
  checkObject(definition, 'definition', ['version', 'colors', 'options']);
  if (definition.version !== 1) {
    throw new Error('definition.version: expected supported version 1');
  }
  if (!Array.isArray(definition.colors) || definition.colors.length === 0) {
    throw new Error('definition.colors: expected a nonempty array');
  }

  const names = new Set<string>();
  const entries: unknown[] = definition.colors;
  const colors = Array.from(entries, (entry, index) => {
    const field = `definition.colors[${index}]`;
    checkObject(entry, field, ['name', 'color']);
    checkName(entry.name, `${field}.name`);
    for (const name of [
      entry.name,
      ...Array.from({ length: 16 }, (_, i) => `${entry.name}-${i + 1}`),
    ]) {
      if (names.has(name)) {
        throw new Error(`${field}.name: duplicate custom property "--${name}"`);
      }
      names.add(name);
    }
    if (typeof entry.color !== 'string') {
      throw new Error(`${field}.color: expected an opaque CSS color string`);
    }
    parseSeed(entry.color, `${field}.color`);
    return { name: entry.name, color: entry.color.trim() };
  });

  return {
    version: 1,
    colors,
    options: normalizeOptions(definition.options),
  };
}

function normalizeOptions(options: unknown = {}): NormalizedPaletteOptions {
  checkObject(options, 'definition.options', Object.keys(OPTION_VALUES));
  const supplied = options;
  function option<K extends keyof NormalizedPaletteOptions>(
    key: K,
    fallback: NormalizedPaletteOptions[K],
  ): NormalizedPaletteOptions[K] {
    const value = Object.hasOwn(supplied, key) ? supplied[key] : fallback;
    const values = OPTION_VALUES[key];
    if (!values.some((candidate) => candidate === value)) {
      throw new Error(
        `definition.options.${key}: expected one of ${values.join(', ')}`,
      );
    }
    // Runtime membership validation above establishes the public option union.
    return value as NormalizedPaletteOptions[K];
  }
  const result: NormalizedPaletteOptions = {
    lightnessCurve: option('lightnessCurve', 'uniform'),
    chromaCurve: option('chromaCurve', 'centered'),
    format: option('format', 'oklch'),
    gamut: 'p3',
  };
  result.gamut = option('gamut', result.format === 'hex' ? 'srgb' : 'p3');
  if (result.format === 'hex' && result.gamut !== 'srgb') {
    throw new Error('definition.options.gamut: hex output requires srgb');
  }
  return result;
}

function checkObject(
  value: unknown,
  field: string,
  keys: readonly string[],
): asserts value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  ) {
    throw new Error(`${field}: expected a plain object`);
  }
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) {
      throw new Error(`${field}.${key}: unknown field`);
    }
  }
}

function checkName(name: unknown, field: string): asserts name is string {
  if (
    typeof name !== 'string' ||
    !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)
  ) {
    throw new Error(
      `${field}: expected a lowercase name such as "blue" or "brand-primary"`,
    );
  }
}

/** Parse a standalone opaque CSS color into finite, normalized OKLCH values. */
function parseSeed(value: unknown, field = 'color'): OklchColor {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field}: expected an opaque CSS color string`);
  }
  let color;
  try {
    color = new Color(value.trim()).to('oklch');
  } catch {
    throw new Error(`${field}: invalid or context-dependent CSS color`);
  }
  if (color.alpha !== 1) {
    throw new Error(`${field}: expected an opaque color (alpha must be 1)`);
  }
  let [l, c, h] = color.coords;
  // Conversions of white can be a fraction above 1 due to floating-point error.
  if (typeof l !== 'number' || !Number.isFinite(l) || l < -1e-12 || l > 1 + 1e-12) {
    throw new Error(`${field}: OKLCH lightness must be between 0 and 1`);
  }
  if (typeof c !== 'number' || !Number.isFinite(c) || c < 0) {
    throw new Error(`${field}: OKLCH chroma must be finite and nonnegative`);
  }
  if (c <= 1e-12) {
    c = 0;
    h = 0;
  }
  if (typeof h !== 'number' || !Number.isFinite(h)) {
    throw new Error(`${field}: a chromatic color requires a finite hue`);
  }
  l = Math.min(1, Math.max(0, l));
  return { l, c, h: ((h % 360) + 360) % 360 };
}

/** Serialize generation inputs, not generated CSS or browser application state. */
function serializePaletteDefinition(definition: PaletteDefinition): string {
  return `${JSON.stringify(normalizePaletteDefinition(definition), null, 2)}\n`;
}

export {
  normalizePaletteDefinition,
  serializePaletteDefinition,
  normalizeOptions,
  checkName,
  parseSeed,
};

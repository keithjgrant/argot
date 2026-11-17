import { generateName, dedupeNames } from './generateName.ts';
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
function normalizePaletteDefinition(
  definition: unknown,
): NormalizedPaletteDefinition {
  checkObject(definition, 'definition', ['version', 'seedColors', 'options']);
  if (definition.version !== 1) {
    throw new Error('definition.version: expected supported version 1');
  }
  if (
    !Array.isArray(definition.seedColors) ||
    definition.seedColors.length === 0
  ) {
    throw new Error('definition.seedColors: expected a nonempty array');
  }

  // const names = new Set<string>();
  const entries: unknown[] = definition.seedColors;
  const colors = Array.from(entries, (entry, index) => {
    const field = `definition.seedColors[${index}]`;
    checkObject(entry, field, ['name', 'l', 'c', 'h']);
    checkCoordinates(entry, field);
    if (!entry.name) {
      entry.name = generateName(entry);
      // throw new Error('name ' + entry.name);
    }
    checkName(entry.name, `${field}.name`);
    // for (const name of [
    //   entry.name,
    //   ...Array.from({ length: 16 }, (_, i) => `${entry.name}-${i + 1}`),
    // ]) {
    //   if (names.has(name)) {
    //     throw new Error(`${field}.name: duplicate custom property "--${name}"`);
    //   }
    //   names.add(name);
    // }
    return { name: entry.name, l: entry.l, c: entry.c, h: entry.h };
  });

  return {
    version: 1,
    seedColors: dedupeNames(colors),
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
    !/^[a-zA-Z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*$/.test(name)
  ) {
    throw new Error(
      `${field}: expected an alphanumeric name such as "blue" or "BrandPrimary"`,
    );
  }
}

/** Validate numeric seeds without conversion, wrapping, clamping, or rounding. */
function checkCoordinates(
  value: Record<string, unknown>,
  field: string,
): asserts value is Record<string, unknown> & OklchColor {
  const { l, c, h } = value;
  if (typeof l !== 'number' || !Number.isFinite(l) || l < 0 || l > 1) {
    throw new Error(`${field}.l: expected finite lightness between 0 and 1`);
  }
  if (typeof c !== 'number' || !Number.isFinite(c) || c < 0) {
    throw new Error(`${field}.c: expected finite, nonnegative chroma`);
  }
  if (typeof h !== 'number' || !Number.isFinite(h)) {
    throw new Error(`${field}.h: expected a finite hue angle in degrees`);
  }
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
  checkCoordinates,
};

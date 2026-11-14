import Color from 'colorjs.io';

const OPTION_VALUES = {
  lightnessCurve: ['uniform', 'inclusive', 'centered'],
  chromaCurve: ['centered', 'weighted'],
  format: ['oklch', 'hex'],
  gamut: ['p3', 'srgb'],
};

/**
 * Validate a version-1 definition and return a fresh copy with explicit defaults.
 * Color names must also be unique across all emitted step names and aliases.
 * @param {unknown} definition
 */
function normalizePaletteDefinition(definition) {
  checkObject(definition, 'definition', ['version', 'colors', 'options']);
  if (definition.version !== 1) {
    throw new Error('definition.version: expected supported version 1');
  }
  if (!Array.isArray(definition.colors) || definition.colors.length === 0) {
    throw new Error('definition.colors: expected a nonempty array');
  }

  const names = new Set();
  const colors = Array.from(definition.colors, (entry, index) => {
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
    parseSeed(entry.color, `${field}.color`);
    return { name: entry.name, color: entry.color.trim() };
  });

  return {
    version: 1,
    colors,
    options: normalizeOptions(definition.options),
  };
}

function normalizeOptions(options = {}) {
  checkObject(options, 'definition.options', Object.keys(OPTION_VALUES));
  const result = {
    lightnessCurve: 'uniform',
    chromaCurve: 'centered',
    format: 'oklch',
    ...options,
  };
  if (!Object.hasOwn(options, 'gamut')) {
    result.gamut = result.format === 'hex' ? 'srgb' : 'p3';
  }
  for (const [key, values] of Object.entries(OPTION_VALUES)) {
    if (!values.includes(result[key])) {
      throw new Error(
        `definition.options.${key}: expected one of ${values.join(', ')}`,
      );
    }
  }
  if (result.format === 'hex' && result.gamut !== 'srgb') {
    throw new Error('definition.options.gamut: hex output requires srgb');
  }
  return result;
}

function checkObject(value, field, keys) {
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

function checkName(name, field) {
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
function parseSeed(value, field = 'color') {
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
  if (!Number.isFinite(l) || l < -1e-12 || l > 1 + 1e-12) {
    throw new Error(`${field}: OKLCH lightness must be between 0 and 1`);
  }
  if (!Number.isFinite(c) || c < 0) {
    throw new Error(`${field}: OKLCH chroma must be finite and nonnegative`);
  }
  if (c <= 1e-12) {
    c = 0;
    h = 0;
  }
  if (!Number.isFinite(h)) {
    throw new Error(`${field}: a chromatic color requires a finite hue`);
  }
  l = Math.min(1, Math.max(0, l));
  return { l, c, h: ((h % 360) + 360) % 360 };
}

/** Serialize generation inputs, not generated CSS or browser application state. */
function serializePaletteDefinition(definition) {
  return `${JSON.stringify(normalizePaletteDefinition(definition), null, 2)}\n`;
}

export {
  normalizePaletteDefinition,
  serializePaletteDefinition,
  normalizeOptions,
  checkName,
  parseSeed,
};

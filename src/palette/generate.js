import { normalizePaletteDefinition, parseSeed } from './definition.js';

// Extracted from Theme Machine's paletteUtil.ts on ../tools main.
const LIGHTNESS = Object.freeze([
  0.98, 0.97, 0.93, 0.84, 0.8, 0.71, 0.66, 0.58, 0.53, 0.49, 0.42, 0.35, 0.27,
  0.2, 0.16, 0.1,
]);
const CHROMA = Object.freeze([
  0.14, 0.29, 0.48, 0.57, 0.76, 0.9, 0.95, 1, 0.95, 0.9, 0.81, 0.71, 0.57, 0.43,
  0.33, 0.24,
]);

/**
 * Generate serializable raw OKLCH scales, before gamut mapping or rounding.
 * Steps and baseStep are one-based; input order is preserved without mutation.
 */
function generatePalette(definition) {
  const normalized = normalizePaletteDefinition(definition);
  const { lightnessCurve, chromaCurve } = normalized.options;
  const colors = normalized.colors.map(({ name, color }) => {
    const seed = parseSeed(color);
    const anchor = lightnessCurve === 'centered' ? 8 : findTargetIndex(seed.l);
    const lightness =
      lightnessCurve === 'uniform'
        ? LIGHTNESS
        : interpolateScale(
            seed.l,
            anchor,
            Math.max(seed.l, LIGHTNESS[0]),
            Math.min(seed.l, LIGHTNESS[15]),
          );
    const chroma =
      chromaCurve === 'weighted'
        ? interpolateScale(seed.c, anchor, seed.c < 0.04 ? 0 : 0.01)
        : CHROMA.map((weight) => weight * (seed.c / CHROMA[anchor]));
    return {
      name,
      baseStep: anchor + 1,
      steps: lightness.map((l, index) => ({
        step: index + 1,
        l,
        c: chroma[index],
        h: seed.h,
      })),
    };
  });
  return { version: 1, options: normalized.options, colors };
}

function findTargetIndex(lightness) {
  return LIGHTNESS.reduce(
    (closest, value, index) =>
      Math.abs(value - lightness) <= Math.abs(LIGHTNESS[closest] - lightness)
        ? index
        : closest,
    0,
  );
}

/**
 * Interpolate both sides independently; never divide by a missing side.
 * Endpoint seeds outside the usual lightness range remain monotonic.
 */
function interpolateScale(peak, anchor, start, end = start) {
  return Array.from({ length: 16 }, (_, index) => {
    if (index === anchor) return peak;
    if (index < anchor) {
      return start + (peak - start) * (index / anchor);
    }
    return peak + (end - peak) * ((index - anchor) / (15 - anchor));
  });
}

export { generatePalette };

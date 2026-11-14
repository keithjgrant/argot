import { normalizePaletteDefinition, parseSeed } from './definition.ts';
import type { Palette, PaletteDefinition } from './types.ts';

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
function generatePalette(definition: PaletteDefinition): Palette {
  const normalized = normalizePaletteDefinition(definition);
  const { lightnessCurve, chromaCurve } = normalized.options;
  const colors = normalized.colors.map(({ name, color }) => {
    const seed = parseSeed(color);
    const index = findTargetIndex(seed.l);
    const chromaScale =
      chromaCurve === 'weighted' ? buildChromaScale(index, seed.c) : CHROMA;
    const anchor = lightnessCurve === 'centered' ? 8 : index;
    // Centered lightness rescales the original chroma curve at step 9; it does
    // not rebuild the weighted curve around that step.
    const chromaMultiplier =
      lightnessCurve === 'centered'
        ? seed.c / chromaScale[8]
        : chromaCurve === 'weighted'
          ? 1
          : seed.c / chromaScale[index];
    if (!Number.isFinite(chromaMultiplier)) {
      throw new Error(
        `Palette "${name}": the selected curves produce an undefined chroma multiplier`,
      );
    }
    const lightness =
      lightnessCurve === 'uniform'
        ? LIGHTNESS
        : buildInclusiveLightness(seed.l, anchor);
    return {
      name,
      baseStep: anchor + 1,
      steps: lightness.map((l, index) => ({
        step: index + 1,
        l,
        c: chromaScale[index] * chromaMultiplier,
        h: seed.h,
      })),
    };
  });
  return { version: 1, options: normalized.options, colors };
}

function findTargetIndex(lightness: number): number {
  const after = LIGHTNESS.findIndex((value) => value < lightness);
  const before = after !== -1 ? after - 1 : 15;
  if (after === -1) return before;
  if (before === -1) return after;
  const beforeDiff = LIGHTNESS[before] - lightness;
  const afterDiff = lightness - LIGHTNESS[after];
  return beforeDiff < afterDiff ? before : after;
}

function buildChromaScale(index: number, peakValue: number): number[] {
  const endValue = peakValue < 0.04 ? 0 : 0.01;
  const beforeSteps = index;
  const afterSteps = 15 - index;
  const beforeInterval = (peakValue - endValue) / beforeSteps;
  const afterInterval = (peakValue - endValue) / afterSteps;
  const scale = [];
  for (let i = beforeSteps; i > 0; i--) {
    scale.push(peakValue - i * beforeInterval);
  }
  scale.push(peakValue);
  for (let i = 1; i <= afterSteps; i++) {
    scale.push(peakValue - i * afterInterval);
  }
  return scale;
}

function buildInclusiveLightness(lightness: number, index: number): number[] {
  const maxLightness = LIGHTNESS[0];
  const minLightness = LIGHTNESS[15];
  const lSteps = index;
  const dSteps = 15 - index;
  const lInterval = (maxLightness - lightness) / lSteps;
  const dInterval = (lightness - minLightness) / dSteps;
  const scale = [];
  for (let i = 0; i < lSteps; i++) {
    scale.push(maxLightness - i * lInterval);
  }
  scale.push(lightness);
  for (let i = 1; i <= dSteps; i++) {
    scale.push(lightness - i * dInterval);
  }
  return scale;
}

export { generatePalette };

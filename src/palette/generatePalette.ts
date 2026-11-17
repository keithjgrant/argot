import { normalizePaletteDefinition } from './validation.ts';
import type {
  Palette,
  PaletteDefinition,
  PaletteOptions,
  NormalizedSeedColor,
} from './types.ts';

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

  const colors = normalized.seedColors.map((seed) =>
    generateScale(seed, definition.options || {}),
  );
  return { version: 1, options: normalized.options, colors };
}

// TODO skip normalizing, just fill in defaults here
function generateScale(seed: NormalizedSeedColor, options: PaletteOptions) {
  const { lightnessCurve = 'uniform', chromaCurve = 'centered' } = options;
  const index = findTargetIndex(seed.l);
  const chromaScale =
    chromaCurve === 'weighted' ? buildChromaCurve(index, seed.c) : CHROMA;
  const anchor = lightnessCurve === 'centered' ? 8 : index;
  // Centered lightness rescales the original chroma curve at step 9; it does
  // not rebuild the weighted curve around that step.
  let chromaMultiplier = 1;
  if (lightnessCurve === 'centered') {
    chromaMultiplier = seed.c / chromaScale[8];
  } else if (chromaCurve === 'centered') {
    chromaMultiplier = seed.c / chromaScale[index];
  }
  if (!Number.isFinite(chromaMultiplier)) {
    // handle divide by zero for 0-chroma values
    chromaMultiplier = 0;
  }
  const lightness =
    lightnessCurve === 'uniform'
      ? LIGHTNESS
      : buildInclusiveLightnessCurve(seed.l, anchor);
  return {
    name: seed.name,
    baseStep: anchor + 1,
    steps: lightness.map((l, index) => ({
      step: index + 1,
      l,
      c: chromaScale[index] * chromaMultiplier,
      h: seed.h,
    })),
  };
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

function buildChromaCurve(index: number, peakValue: number): number[] {
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

function buildInclusiveLightnessCurve(
  lightness: number,
  index: number,
): number[] {
  const maxLightness = LIGHTNESS[0];
  const minLightness = LIGHTNESS[15];

  const lSteps = index;
  const dSteps = 15 - index;
  const lInterval = (maxLightness - lightness) / lSteps;
  const dInterval = (lightness - minLightness) / dSteps;

  const lightnessScale = [];
  for (let i = 0; i < lSteps; i++) {
    lightnessScale.push(maxLightness - i * lInterval);
  }
  lightnessScale.push(lightness);
  for (let i = 1; i <= dSteps; i++) {
    lightnessScale.push(lightness - i * dInterval);
  }
  return lightnessScale;
}

export { generatePalette };

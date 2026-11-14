// Calculation reference from tools, main revision:
// deb00ddab9c60dc778f7753ce8a4b17cdc0f2a5e
// src/js/theme-machine/common/paletteUtil.ts
// Adaptations: remove UI/types, return raw coordinates instead of CSS, and omit
// intermediate rounding (the explicitly approved difference). Keep this
// independent of Argot's engine so tests detect accidental curve changes.

const L_SCALE = [
  0.98, 0.97, 0.93, 0.84, 0.8, 0.71, 0.66, 0.58, 0.53, 0.49, 0.42, 0.35, 0.27,
  0.2, 0.16, 0.1,
];
const C_SCALE = [
  0.14, 0.29, 0.48, 0.57, 0.76, 0.9, 0.95, 1, 0.95, 0.9, 0.81, 0.71, 0.57, 0.43,
  0.33, 0.24,
];

export function referencePalette(color, context) {
  const index = findTargetIndex(color.l);
  let chromaScale = C_SCALE;
  let chromaMultiplier = 1;
  if (context.chromaCurve === 'weighted') {
    chromaScale = buildChromaScale(index, color.c);
  } else {
    chromaMultiplier = color.c / chromaScale[index];
  }
  switch (context.lightnessCurve) {
    case 'inclusive':
      return [buildInclusiveScale(color, index, chromaMultiplier, chromaScale), index];
    case 'centered':
      return [buildInclusiveScale(color, 8, color.c / chromaScale[8], chromaScale), 8];
    default:
      return [
        L_SCALE.map((l, i) => ({
          l,
          c: chromaScale[i] * chromaMultiplier,
          h: color.h,
        })),
        index,
      ];
  }
}

function findTargetIndex(l) {
  const after = L_SCALE.findIndex((lightness) => lightness < l);
  const before = after !== -1 ? after - 1 : 15;
  if (after === -1) return before;
  if (before === -1) return after;
  const beforeDiff = L_SCALE[before] - l;
  const afterDiff = l - L_SCALE[after];
  return beforeDiff < afterDiff ? before : after;
}

function buildChromaScale(index, peakValue) {
  const endValue = peakValue < 0.04 ? 0 : 0.01;
  const beforeSteps = index;
  const afterSteps = 15 - index;
  const beforeInterval = (peakValue - endValue) / beforeSteps;
  const afterInterval = (peakValue - endValue) / afterSteps;
  const chromaScale = [];
  for (let i = beforeSteps; i > 0; i--) {
    chromaScale.push(peakValue - i * beforeInterval);
  }
  chromaScale.push(peakValue);
  for (let i = 1; i <= afterSteps; i++) {
    chromaScale.push(peakValue - i * afterInterval);
  }
  return chromaScale;
}

function buildInclusiveScale(color, index, chromaMultiplier, chromaScale) {
  const maxLightness = L_SCALE[0];
  const minLightness = L_SCALE[15];
  const lSteps = index;
  const dSteps = 15 - index;
  const lInterval = (maxLightness - color.l) / lSteps;
  const dInterval = (color.l - minLightness) / dSteps;
  const lightnessScale = [];
  for (let i = 0; i < lSteps; i++) {
    lightnessScale.push(maxLightness - i * lInterval);
  }
  lightnessScale.push(color.l);
  for (let i = 1; i <= dSteps; i++) {
    lightnessScale.push(color.l - i * dInterval);
  }
  return lightnessScale.map((l, i) => ({
    l,
    c: chromaScale[i] * chromaMultiplier,
    h: color.h,
  }));
}

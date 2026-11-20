import {
  generatePalette,
  generatePaletteCss,
  normalizePaletteDefinition,
  parseCssColor,
  renderPaletteCss,
  serializePaletteDefinition,
  type PaletteDefinition,
} from 'argot-css/palette';

const definition: PaletteDefinition = {
  version: 1,
  seedColors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
  options: { lightnessCurve: 'centered', chromaCurve: 'weighted' },
};
const palette = generatePalette(definition);
const css: string = renderPaletteCss(palette);
const serialized: string = serializePaletteDefinition(definition);
const roundTrip = normalizePaletteDefinition(JSON.parse(serialized) as unknown);
const regenerated: string = generatePaletteCss(roundTrip);
const fromCss: PaletteDefinition = {
  version: 1,
  seedColors: [{ name: 'imported', ...parseCssColor('#663399') }],
};

// @ts-expect-error Node globals must not be available to browser consumers.
const nodeProcess = process;
void [css, regenerated, fromCss, nodeProcess];

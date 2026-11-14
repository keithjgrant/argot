import {
  generatePalette,
  generatePaletteCss,
  normalizePaletteDefinition,
  renderPaletteCss,
  serializePaletteDefinition,
  type PaletteDefinition,
} from '@keithjgrant/argot/palette';

const definition: PaletteDefinition = {
  version: 1,
  colors: [{ name: 'brand', color: '#663399' }],
  options: { lightnessCurve: 'centered', chromaCurve: 'weighted' },
};
const palette = generatePalette(definition);
const css: string = renderPaletteCss(palette);
const serialized: string = serializePaletteDefinition(definition);
const roundTrip = normalizePaletteDefinition(JSON.parse(serialized) as unknown);
const regenerated: string = generatePaletteCss(roundTrip);

// @ts-expect-error The browser entrypoint must not introduce ambient Node types.
const nodeProcess = process;
void [css, regenerated, nodeProcess];

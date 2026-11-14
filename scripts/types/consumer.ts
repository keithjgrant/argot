import {
  generateCss,
  renderCss,
  writeTemplate,
  type TokenOptions,
  type TokenRecord,
  type TokenSection,
} from '@keithjgrant/argot/generate';
import {
  generatePalette,
  generatePaletteCss,
  normalizePaletteDefinition,
  parseCssColor,
  renderPaletteCss,
  serializePaletteDefinition,
  type ChromaCurve,
  type ColorFormat,
  type ColorGamut,
  type LightnessCurve,
  type NormalizedPaletteDefinition,
  type OklchColor,
  type Palette,
  type PaletteDefinition,
  type PaletteOptions,
} from '@keithjgrant/argot/palette';
import {
  loadPaletteDefinition,
  writePalette,
  type WritePaletteOptions,
  type WritePaletteResult,
} from '@keithjgrant/argot/palette/node';
import plugins from '@keithjgrant/argot/stylelint';
import config from '@keithjgrant/argot/stylelint/config';
import type { Config, Plugin } from 'stylelint';

const lightness: LightnessCurve = 'centered';
const chroma: ChromaCurve = 'weighted';
const format: ColorFormat = 'oklch';
const gamut: ColorGamut = 'p3';
const options: PaletteOptions = {
  lightnessCurve: lightness,
  chromaCurve: chroma,
  format,
  gamut,
};
const definition = {
  version: 1,
  colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
  options,
} as const satisfies PaletteDefinition;

const normalized: NormalizedPaletteDefinition = normalizePaletteDefinition(
  JSON.parse('{}') as unknown,
);
const palette: Palette = generatePalette(definition);
const css: string = renderPaletteCss(palette);
const generated: string = generatePaletteCss(normalized);
const serialized: string = serializePaletteDefinition(definition);
const parsed: OklchColor = parseCssColor('#663399');
const fromCss: PaletteDefinition = {
  version: 1, colors: [{ name: 'brand', ...parsed }],
};
const loaded: NormalizedPaletteDefinition = loadPaletteDefinition('palette.json');
const writeOptions: WritePaletteOptions = { dryRun: true, force: false };
const output: WritePaletteResult = writePalette('palette.css', loaded, writeOptions);

const tokenOptions: TokenOptions = { extended: true };
const token: TokenRecord = {
  name: '--text-primary',
  value: null,
  description: '',
  tier: 'core',
  type: 'color',
  usage: '',
  pairsWith: [],
  related: [],
};
const section: TokenSection = { file: 'text.json', label: 'text', tokens: [token] };
const semanticCss: string = generateCss(tokenOptions);
const rendered: string = renderCss([section]);
const filename: string = writeTemplate('semantics.css', tokenOptions);
const lintConfig: Config = config;
const lintPlugins: Plugin[] = plugins;

// @ts-expect-error Curve options must be one of the supported named values.
const invalidOptions: PaletteOptions = { lightnessCurve: 'custom' };
// @ts-expect-error Seed coordinates must be numbers.
const invalidSeed: PaletteDefinition = { version: 1, colors: [{ name: 'x', l: '60%', c: 0.2, h: 250 }] };
// @ts-expect-error CSS strings are not canonical palette definitions.
const invalidCssSeed: PaletteDefinition = { version: 1, colors: [{ name: 'x', color: '#663399' }] };
// @ts-expect-error All three coordinates are required, including hue for neutrals.
const missingCoordinate: PaletteDefinition = { version: 1, colors: [{ name: 'x', l: 0.6, c: 0 }] };
// @ts-expect-error CSS parsing takes a string.
parseCssColor({ l: 0.6, c: 0.2, h: 250 });
// @ts-expect-error Unsupported definition versions must not typecheck.
const invalidVersion: PaletteDefinition = { version: 2, colors: [] };
// @ts-expect-error Rendering takes a generated model, not a portable definition.
renderPaletteCss(definition);
// @ts-expect-error Output coordinates are numeric.
const invalidCoordinate: string = palette.colors[0].steps[0].l;
// @ts-expect-error Write options use booleans.
writePalette('palette.css', definition, { force: 'yes' });
// @ts-expect-error Semantic template options use booleans.
generateCss({ extended: 'yes' });

void [
  css, generated, serialized, output, semanticCss, rendered, filename,
  lintConfig, lintPlugins, invalidOptions, invalidSeed, invalidVersion,
  invalidCoordinate,
  fromCss, invalidCssSeed, missingCoordinate,
];

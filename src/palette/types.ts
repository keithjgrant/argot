export type LightnessCurve = 'uniform' | 'inclusive' | 'centered';
export type ChromaCurve = 'centered' | 'weighted';
export type ColorFormat = 'oklch' | 'hex';
export type ColorGamut = 'p3' | 'srgb';

// Seed - input l,c,h (and optional name) to generate steps
// Step - tint/shade of a certain hue
// Scale - set of 16 steps
// Palette - full set of colors

export interface PaletteOptions {
  lightnessCurve?: LightnessCurve;
  chromaCurve?: ChromaCurve;
  format?: ColorFormat;
  gamut?: ColorGamut;
}

export type NormalizedPaletteOptions = Required<PaletteOptions>;

export interface OklchColor {
  /** Lightness from 0 to 1 */
  l: number;
  /** Chroma */
  c: number;
  /** Hue angle in degrees; stored without wrapping or rounding. */
  h: number;
}

/** Numeric OKLCH seed coordinates, matching Theme Machine's data model. */
export interface SeedColor extends OklchColor {
  name?: string;
}
export type NormalizedSeedColor = Required<SeedColor>;

export interface PaletteStep extends OklchColor {
  /** One-based index, from 1 through 16. */
  step: number;
}

export interface PaletteDefinition {
  version: 1;
  seedColors: readonly SeedColor[];
  options?: PaletteOptions;
}

// PaletteDefinition with all options filled in
export interface NormalizedPaletteDefinition {
  version: 1;
  seedColors: NormalizedSeedColor[];
  options: NormalizedPaletteOptions;
}

// TODO: can baseStep be removed?
// don't need to output it to CSS any longer, but might need to
// indicate to user where seedColor landed in the set
export interface PaletteScale {
  name: string;
  /** One-based step used for the unnumbered custom-property alias. */
  baseStep: number;
  steps: PaletteStep[];
}

/** Raw OKLCH coordinates, before output gamut mapping or rounding. */
export interface Palette {
  version: 1;
  colors: PaletteScale[];
  options: NormalizedPaletteOptions;
}

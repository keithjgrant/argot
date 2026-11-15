export type LightnessCurve = 'uniform' | 'inclusive' | 'centered';
export type ChromaCurve = 'centered' | 'weighted';
export type ColorFormat = 'oklch' | 'hex';
export type ColorGamut = 'p3' | 'srgb';

export interface PaletteOptions {
  lightnessCurve?: LightnessCurve;
  chromaCurve?: ChromaCurve;
  format?: ColorFormat;
  gamut?: ColorGamut;
}

export type NormalizedPaletteOptions = Required<PaletteOptions>;

/** Numeric OKLCH seed coordinates, matching Theme Machine's data model. */
export interface PaletteColorDefinition extends OklchColor {
  name: string;
}

export interface PaletteDefinition {
  version: 1;
  colors: readonly PaletteColorDefinition[];
  options?: PaletteOptions;
}

export interface NormalizedPaletteDefinition {
  version: 1;
  colors: PaletteColorDefinition[];
  options: NormalizedPaletteOptions;
}

export interface OklchColor {
  /** Lightness from 0 through 1 */
  l: number;
  /** Chroma */
  c: number;
  /** Hue angle in degrees; stored without wrapping or rounding. */
  h: number;
}

export interface PaletteStep extends OklchColor {
  /** One-based index, from 1 through 16. */
  step: number;
}

export interface PaletteColor {
  name: string;
  /** One-based step used for the unnumbered custom-property alias. */
  baseStep: number;
  steps: PaletteStep[];
}

/** Raw OKLCH coordinates, before output gamut mapping or rounding. */
export interface Palette {
  version: 1;
  options: NormalizedPaletteOptions;
  colors: PaletteColor[];
}

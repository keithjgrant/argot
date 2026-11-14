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

export interface PaletteColorDefinition {
  name: string;
  /** Standalone opaque CSS color; no browser context or variable references. */
  color: string;
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
  l: number;
  c: number;
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

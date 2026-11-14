// Browser-safe public entrypoint. Keep Node file adapters in ./node.js.
export {
  normalizePaletteDefinition,
  serializePaletteDefinition,
} from './definition.js';
export { generatePalette } from './generate.js';
export { renderPaletteCss, generatePaletteCss } from './render.js';

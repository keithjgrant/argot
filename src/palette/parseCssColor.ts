import Color from 'colorjs.io';
import { checkCoordinates } from './validation.ts';
import type { OklchColor } from './types.ts';

/**
 * Optional input adapter for standalone opaque CSS colors. Palette definitions
 * store the returned numeric coordinates, never the CSS string.
 */
function parseCssColor(value: string): OklchColor {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('color: expected an opaque CSS color string');
  }
  let color;
  try {
    color = new Color(value.trim()).to('oklch');
  } catch {
    throw new Error('color: invalid or context-dependent CSS color');
  }
  if (color.alpha !== 1) {
    throw new Error('color: expected an opaque color (alpha must be 1)');
  }
  const [l, c, h] = color.coords;

  // Conversions of white can be a fraction above 1 due to floating-point error.
  // This tolerance belongs to CSS conversion, not numeric definition validation.
  if (
    typeof l !== 'number' ||
    !Number.isFinite(l) ||
    l < -1e-12 ||
    l > 1 + 1e-12
  ) {
    throw new Error('color.l: expected finite lightness between 0 and 1');
  }
  const newL = Math.min(1, Math.max(0, l));

  let newH = h;
  // Achromatic CSS colors may have no hue; supply a numeric angle for handoff.
  if (c === 0 && (h === null || Number.isNaN(h))) {
    newH = 0;
  }
  const coordinates = { l: newL, c, h: newH };
  checkCoordinates(coordinates, 'color');
  return coordinates;
}

export { parseCssColor };

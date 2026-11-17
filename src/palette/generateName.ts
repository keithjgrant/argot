import type { OklchColor, NormalizedSeedColor } from './types.ts';

const NAMES = {
  0: 'raspberry',
  15: 'cherry',
  30: 'red',
  45: 'sienna',
  60: 'orange',
  75: 'gold',
  90: 'lemon',
  105: 'yellow',
  120: 'avocado',
  135: 'jungle',
  150: 'green',
  165: 'mint',
  180: 'seafoam',
  195: 'teal',
  210: 'cyan',
  225: 'sapphire',
  240: 'azure',
  255: 'blue',
  270: 'indigo',
  285: 'violet',
  300: 'lilac',
  315: 'purple',
  330: 'grape',
  345: 'pink',
  360: 'raspberry',
};
const NEUTRAL_NAMES = {
  0: 'dust',
  60: 'sand',
  120: 'stone',
  180: 'sage',
  240: 'slate',
  300: 'ash',
  360: 'dust',
};

export function generateName(color: OklchColor): string {
  const { c, h } = color;
  let rounded: number, names: { [k: number]: string };
  if (c >= 0.05) {
    names = NAMES;
    rounded = Math.round(h / 15) * 15;
  } else {
    names = NEUTRAL_NAMES;
    rounded = Math.round(h / 60) * 60;
  }

  return names[rounded] || 'unnamed';
}

export function dedupeNames(colors: NormalizedSeedColor[]) {
  const names: string[] = [];
  const all = [...colors];
  all.forEach((color) => {
    if (!color.name) {
      return;
    }

    names.push(color.name);
    const count = names.filter((n) => n === color.name).length;

    if (count > 1) {
      color.name = `${color.name}${count}`;
    }
  });
  return colors;
}

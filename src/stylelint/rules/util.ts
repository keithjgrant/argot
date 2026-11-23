import type { ChildNode, Declaration } from 'postcss';
import type { TokenSection } from '../../semantics/load-tokens.ts';

export function isCustomPropertyDeclaration(
  rule: ChildNode,
): rule is Declaration {
  return rule.type === 'decl' && rule.prop.startsWith('--');
}

const primitiveNamePattern = /^--[a-zA-Z0-9-_]+-[0-9]+$/;

export function isColorPrimitive(prop: string, value: string) {
  const match = primitiveNamePattern.exec(prop);
  if (!match) {
    return false;
  }
  return isColor(value);
}

const hexColorPattern = /^#([0-9a-f]{3,8})$/;
const colorFuncs = [
  'oklch(',
  'hsl(',
  'hsla(',
  'rgb(',
  'rgba(',
  'hwb(',
  'oklab(',
  'lch(',
  'lab(',
];
// TODO: keyword colors?

/* loose color match; more permissive is ok */
export function isColor(value: string) {
  const hexMatch = hexColorPattern.exec(value);
  if (hexMatch) {
    return true;
  }
  for (const func of colorFuncs) {
    if (value.startsWith(func)) {
      return true;
    }
  }
  return false;
}

export function getToken(name: string, tokens: TokenSection[]) {
  for (const section of tokens) {
    return section.tokens.find((t) => t.name === name);
  }

  return null;
}

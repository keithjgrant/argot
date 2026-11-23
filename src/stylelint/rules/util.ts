import type { ChildNode, Declaration } from 'postcss';
import type { TokenSection } from '../../semantics/load-tokens.ts';

export interface PrimitiveValues {
  [key: string]: string;
}

export interface Semantics {
  [key: string]: string;
}

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
    const match = section.tokens.find((t) => t.name === name);
    if (match) {
      return match;
    }
  }

  return null;
}

export function resolveColor(
  value: string,
  primitives: PrimitiveValues,
  semantics: Semantics,
) {
  if (isColor(value)) {
    return value;
  }
  if (!value.startsWith('var(')) {
    return;
  }

  for (const key of Object.keys(primitives)) {
    if (`var(${key})` === value) {
      return resolveColor(primitives[key], primitives, semantics);
    }
  }

  for (const key of Object.keys(semantics)) {
    if (`var(${key})` === value) {
      return resolveColor(semantics[key], primitives, semantics);
    }
  }

  return;
}

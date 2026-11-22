import stylelint from 'stylelint';
import type { ChildNode, Declaration } from 'postcss';

interface PropValues {
  [key: string]: string;
}

export const ruleName = 'argot/color-contrast';

const ruleMessages = stylelint.utils.ruleMessages(ruleName, {
  unexpected: (name, prop) =>
    `Foreground property "${prop}" has insufficient contrast with x".`,
});

const ruleFunction: stylelint.Rule = (method, opts, context) => {
  console.log('INIT');
  // sources to import custom selectors from
  // const importFrom = [].concat(Object(opts).importFrom || []);
  // const resolver = Object(opts).resolver || {};

  // // promise any custom selectors are imported
  // const customPropertiesPromise = isMethodEnabled(method)
  //   ? getCustomPropertiesFromImports(importFrom, resolver)
  //   : {};

  return async (root, result) => {
    const primitives: PropValues = {};
    const semantics: PropValues = {};

    root.walkRules((ruleNode) => {
      ruleNode.each((rule) => {
        if (!isCustomPropertyDeclaration(rule)) {
          return;
        }

        if (isColorPrimitive(rule.prop, rule.value)) {
          primitives[rule.prop] = rule.value;
        }

        if (isKnownSemantic(rule.prop)) {
          // todo
        }
      });
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = ruleMessages;
ruleFunction.meta = {
  url: 'https://github.com/keithjgrant/argot/blob/main/README.md',
};

function isCustomPropertyDeclaration(rule: ChildNode): rule is Declaration {
  return rule.type === 'decl' && rule.prop.startsWith('--');
}

const primNamePattern = /^--[a-zA-Z0-9-_]+-[0-9]+$/;

export function isColorPrimitive(prop: string, value: string) {
  const match = primNamePattern.exec(prop);
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

function isKnownSemantic(value: string) {
  return true;
}

export default stylelint.createPlugin(ruleName, ruleFunction);

// const isMethodEnabled = (method) => method === true;
// const isMethodDisabled = (method) => method === null || method === false;

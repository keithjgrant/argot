import stylelint from 'stylelint';
import Color from 'colorjs.io';
import type { Declaration } from 'postcss';
import {
  isCustomPropertyDeclaration,
  isColorPrimitive,
  getToken,
  resolveColor,
  type PrimitiveValues,
  type Semantics,
} from './util.ts';
import { loadTokens } from '../../semantics/load-tokens.ts';

export const ruleName = 'argot/color-contrast';

const AA_CONTRAST = 4.5;
const AAA_CONTRAST = 7;

interface SemanticDeclarations {
  [key: string]: Declaration;
}

const ruleMessages = stylelint.utils.ruleMessages(ruleName, {
  unexpected: (name, prop) =>
    `Foreground property "${prop}" has insufficient contrast with x".`,
});

const ruleFunction: stylelint.Rule = () => {
  const tokens = loadTokens();

  return async (root, result) => {
    const primitives: PrimitiveValues = {};
    const semantics: Semantics = {};
    const semanticDecls: SemanticDeclarations = {};

    root.walkDecls((decl) => {
      if (!isCustomPropertyDeclaration(decl)) {
        return;
      }

      if (isColorPrimitive(decl.prop, decl.value)) {
        primitives[decl.prop] = decl.value;
        return;
      }

      const token = getToken(decl.prop, tokens);
      if (!token) {
        return;
      }

      const colorString = resolveColor(decl.value, primitives, semantics);
      semantics[decl.prop] = colorString || 'unknown';
      semanticDecls[decl.prop] = decl;
    });

    const reportedPairs = new Set<string>();

    for (const [name, colorString] of Object.entries(semantics)) {
      if (!colorString || colorString == 'unknown') continue;

      const token = getToken(name, tokens);
      if (!token?.pairsWith?.length) continue;

      const decl = semanticDecls[name];
      if (!decl) continue;

      for (const pair of token.pairsWith) {
        const pairName = `--${pair}`;
        const pairKey = [name, pairName].sort().join('\0');
        if (reportedPairs.has(pairKey)) continue;

        const pairColor = semantics[pairName];
        if (!pairColor || pairColor === 'unknown') continue;

        const pairDecl = semanticDecls[pairName];
        if (!pairDecl) continue;

        reportedPairs.add(pairKey);

        const contrast = new Color(colorString).contrastWCAG21(
          new Color(pairColor),
        );
        if (contrast >= AAA_CONTRAST) continue;
        const rounded = contrast.toFixed(2);

        const message = `"${name}" does not meet WCAG AAA contrast ratio of 7:1 with "${pairName}" (${rounded}:1)`;
        const message2 = `"${pairName}" does not meet WCAG AAA contrast ratio of 7:1 with with "${name}" (${rounded}:1)`;

        stylelint.utils.report({
          ruleName,
          result,
          message,
          node: decl,
        });
        stylelint.utils.report({
          ruleName,
          result,
          message: message2,
          node: pairDecl,
        });
      }
    }
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = ruleMessages;
ruleFunction.meta = {
  url: 'https://github.com/keithjgrant/argot/blob/main/README.md',
};

export default stylelint.createPlugin(ruleName, ruleFunction);

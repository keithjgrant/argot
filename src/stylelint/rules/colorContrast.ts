import stylelint from 'stylelint';
import Color from 'colorjs.io';
import { Rule } from 'postcss';
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

interface RulesHash {
  [key: string]: Rule;
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
    const semanticRules: RulesHash = {};

    root.walkRules((ruleNode) => {
      ruleNode.each((rule) => {
        if (!isCustomPropertyDeclaration(rule)) {
          return;
        }

        if (isColorPrimitive(rule.prop, rule.value)) {
          primitives[rule.prop] = rule.value;
          return;
        }

        const token = getToken(rule.prop, tokens);
        if (!token) {
          return;
        }

        const colorString = resolveColor(rule.value, primitives, semantics);
        semantics[rule.prop] = colorString || 'unknown';
        semanticRules[rule.prop] = ruleNode;
        if (colorString && token.pairsWith && token.pairsWith.length) {
          const color = new Color(colorString);
          for (const pair of token.pairsWith) {
            const pairColor = resolveColor(
              `var(--${pair})`,
              primitives,
              semantics,
            );
            if (!pairColor) return;
            const contrast = color.contrastWCAG21(new Color(pairColor));

            const message = `${rule.prop} has contrast of ${contrast} with --${pair}`;
            stylelint.utils.report({
              ruleName,
              result,
              message,
              node: ruleNode,
            });
            const pairRule = semanticRules[`--${pair}`];
            if (pairRule) {
              console.log('reporting to ', pair, pairRule);
              stylelint.utils.report({
                ruleName,
                result,
                message,
                node: pairRule,
              });
            }
          }
        }
        // if (token?.pairsWith && token?.pairsWith.length) {
        //   stylelint.utils.report({
        //     ruleName,
        //     result,
        //     message: `${rule.prop} pairs with ${token.pairsWith.join(', ')}`,
        //     node: ruleNode,
        //     // start: { line: warning.line, column: warning.column },
        //     // end: { line: warning.endLine, column: warning.endColumn },
        //   });
        // }
      });
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = ruleMessages;
ruleFunction.meta = {
  url: 'https://github.com/keithjgrant/argot/blob/main/README.md',
};

export default stylelint.createPlugin(ruleName, ruleFunction);

// const isMethodEnabled = (method) => method === true;
// const isMethodDisabled = (method) => method === null || method === false;

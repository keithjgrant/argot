import stylelint from 'stylelint';
import {
  isCustomPropertyDeclaration,
  isColorPrimitive,
  getToken,
} from './util.ts';
import { loadTokens } from '../../semantics/load-tokens.ts';

interface PropValues {
  [key: string]: string;
}

interface Semantics {
  [key: string]: any;
}

export const ruleName = 'argot/color-contrast';

const ruleMessages = stylelint.utils.ruleMessages(ruleName, {
  unexpected: (name, prop) =>
    `Foreground property "${prop}" has insufficient contrast with x".`,
});

const ruleFunction: stylelint.Rule = (method, opts, context) => {
  const tokens = loadTokens();

  return async (root, result) => {
    const primitives: PropValues = {};
    const semantics: Semantics = {};

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
        if (token) {
          semantics[rule.prop] = token;
        }
        if (token?.pairsWith && token?.pairsWith.length) {
          stylelint.utils.report({
            ruleName,
            result,
            message: `${rule.prop} pairs with ${token.pairsWith.join(', ')}`,
            node: ruleNode,
            // start: { line: warning.line, column: warning.column },
            // end: { line: warning.endLine, column: warning.endColumn },
          });
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

export default stylelint.createPlugin(ruleName, ruleFunction);

// const isMethodEnabled = (method) => method === true;
// const isMethodDisabled = (method) => method === null || method === false;

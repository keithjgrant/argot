import stylelint from 'stylelint';

const {
  createPlugin,
  utils: { ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'argot/valid-token';

const messages = ruleMessages(ruleName, {
  rejected: (prop) =>
    `Unexpected unknown Argot token "--${prop}". Check the name against the Argot token list.`,
});

const meta = {
  url: 'https://github.com/keithjgrant/argot/blob/main/docs/product-scope.md',
};

/**
 * Placeholder: consumers are expected to extend the generated template with
 * their own custom properties. Re-enable checks here when we have rules that
 * fit that workflow (not a closed token allowlist).
 *
 * Token index helpers remain in `src/token-index.js` for future rules.
 *
 * @type {import('stylelint').Rule}
 */
const ruleFunction = (primary) => {
  return (_root, result) => {
    const validOptions = validateOptions(result, ruleName, {
      actual: primary,
      possible: [true],
    });

    if (!validOptions) return;
    // no-op
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export default createPlugin(ruleName, ruleFunction);

import recommended from 'stylelint-config-recommended';
import colorContrast from '../stylelint/rules/colorContrast.ts';

export default {
  extends: [recommended],
  plugins: [colorContrast],
  rules: {
    'argot/color-contrast': true,
  },
};

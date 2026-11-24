import { colorContrast } from 'argot-css/stylelint';

export default {
  extends: ['stylelint-config-recommended'],
  plugins: [colorContrast],
  rules: {
    'argot/color-contrast': true,
  },
};

const { loadTokens } = require('./generate');

/**
 * Build lookup data from packaged token JSON.
 * @param {{ extended?: boolean }} [options]
 */
function getTokenIndex(options = { extended: true }) {
  const names = new Set();

  for (const section of loadTokens(options)) {
    for (const token of section.tokens) {
      names.add(token.name.slice(2));
    }
  }

  const prefixes = new Set();
  for (const name of names) {
    const dash = name.indexOf('-');
    prefixes.add(dash === -1 ? name : name.slice(0, dash));
  }

  return {
    names,
    prefixes: [...prefixes].sort(),
  };
}

/**
 * True when a custom-property name (without leading --) sits in an Argot
 * namespace prefix (e.g. text-*, bg-*, space-*), whether or not it is known.
 * @param {string} name
 * @param {string[]} prefixes
 */
function looksLikeArgotToken(name, prefixes) {
  return prefixes.some(
    (prefix) => name === prefix || name.startsWith(`${prefix}-`)
  );
}

module.exports = {
  getTokenIndex,
  looksLikeArgotToken,
};

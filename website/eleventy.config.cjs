const { buildReference } = require('./lib/reference.cjs');

module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData('reference', () => buildReference());
  eleventyConfig.addWatchTarget('./tokens/');
  eleventyConfig.addWatchTarget('./src/load-tokens.js');
  eleventyConfig.addWatchTarget('./website/lib/');
  eleventyConfig.addPassthroughCopy({
    'website/assets': 'assets',
  });
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });

  return {
    dir: {
      input: 'website/content',
      includes: '../_includes',
      output: 'website/_site',
    },
    templateFormats: ['njk', 'md'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    pathPrefix: process.env.WEBSITE_PATH_PREFIX || '/',
  };
};

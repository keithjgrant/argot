// import postcssPlugin from '@jgarber/eleventy-plugin-postcss';
import { buildReference, reloadTokenLoader } from './lib/reference.js';

// Eleventy's dependency scanner only parses JavaScript. Keep this native
// TypeScript import dynamic so it does not walk into src/.
const { processStylesheet } = await import('../src/processor/index.ts');

const CSS_IN = './website/styles/index.css';
const CSS_OUT = './website/_site/styles.css';

export default function (eleventyConfig) {
  // eleventyConfig.addPlugin(postcssPlugin, { templateFormats: ['css'] });
  eleventyConfig.addGlobalData('reference', () => buildReference());
  eleventyConfig.addWatchTarget('./tokens/');
  eleventyConfig.addWatchTarget('./src/**/*.ts');
  eleventyConfig.addWatchTarget('./website/lib/');
  eleventyConfig.addWatchTarget('./website/styles/');
  eleventyConfig.on('eleventy.before', async () => {
    await processStylesheet(CSS_IN, CSS_OUT, './website/stylelint.config.js');
  });
  eleventyConfig.on('eleventy.beforeWatch', async (changedFiles) => {
    if (changedFiles.some((file) => file.endsWith('.ts'))) {
      await reloadTokenLoader();
    }
  });
  eleventyConfig.addPassthroughCopy({
    'website/assets': 'assets',
  });
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });

  return {
    dir: {
      input: 'website/content',
      includes: '_includes',
      layouts: '_layouts',
      output: 'website/_site',
    },
    templateFormats: ['njk', 'md'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    pathPrefix: process.env.WEBSITE_PATH_PREFIX || '/',
  };
}

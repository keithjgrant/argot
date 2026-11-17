import postcssPlugin from '@jgarber/eleventy-plugin-postcss';
import { buildReference, reloadTokenLoader } from './lib/reference.js';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(postcssPlugin, { templateFormats: ['css'] });
  eleventyConfig.addGlobalData('reference', () => buildReference());
  eleventyConfig.addWatchTarget('./tokens/');
  eleventyConfig.addWatchTarget('./src/**/*.ts');
  eleventyConfig.addWatchTarget('./website/lib/');
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

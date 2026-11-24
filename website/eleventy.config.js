import fs from 'node:fs';
import path from 'node:path';
import { buildReference, reloadTokenLoader } from './lib/reference.js';
import { docsStubs } from './lib/docs-stubs.js';

// Eleventy's dependency scanner only parses JavaScript. Keep this native
// TypeScript import dynamic so it does not walk into src/.
const { processStylesheet } = await import('../src/processor/index.ts');

const CSS_IN = './website/styles/index.css';

export default function (eleventyConfig) {
  eleventyConfig.addGlobalData('reference', () => buildReference());
  eleventyConfig.addGlobalData('docsStubs', docsStubs);
  eleventyConfig.addWatchTarget('./tokens/');
  eleventyConfig.addWatchTarget('./src/**/*.ts');
  eleventyConfig.addWatchTarget('./website/lib/');
  eleventyConfig.addWatchTarget('./website/styles/');
  eleventyConfig.on('eleventy.before', async ({ directories }) => {
    const cssOut = path.join(directories.output, 'assets/site.css');
    fs.mkdirSync(path.dirname(cssOut), { recursive: true });
    await processStylesheet(CSS_IN, cssOut, './website/stylelint.config.js');
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

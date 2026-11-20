import fs from 'node:fs/promises';
import path from 'path';
import postcss from 'postcss';
import cssnano from 'cssnano';
import stylelint from 'stylelint';
import atImport from './atImport.ts';
import { ANSI_GREEN, ANSI_WHITE } from '../cli/ansiColors.ts';

/**
 * Processes stylesheet and outputs destination css
 * @param sourceFile fully-qualified source filename
 * @param destFile  fully-qualified destination filename
 */
async function processStylesheet(sourceFile: string, destFile: string) {
  let css;
  try {
    css = await fs.readFile(sourceFile, 'utf8');
  } catch (error) {
    throw new Error(
      `Cannot read stylesheet "${sourceFile}": ${(error as NodeJS.ErrnoException).code}`,
      { cause: error },
    );
  }

  const result = await postcss([atImport(), getStylelint(), cssnano()]).process(
    css,
    {
      from: sourceFile,
      to: destFile,
    },
  );

  try {
    await fs.writeFile(destFile, result.css);
    console.log(`${ANSI_GREEN}Wrote output CSS: ${destFile}\n${ANSI_WHITE}`);
  } catch (error) {
    throw new Error(
      `Cannot write stylesheet ${destFile}: ${(error as NodeJS.ErrnoException).code}`,
      { cause: error },
    );
  }
}

function getStylelint() {
  // try {
  // . // TODO: doesn't throw until postcss().process() called
  //   const plugin = stylelint();
  //   // return plugin;
  // } catch (error) {
  //   if (
  //     error instanceof Error &&
  //     error.name === 'ConfigurationError' &&
  //     error.message.includes('No configuration provided')
  //   ) {
  //     //
  //   }
  //   throw error;
  // }

  const defaultConfigPath = path.resolve(
    import.meta.dirname,
    'stylelintDefaultConfig.js',
  );

  return stylelint({ configFile: defaultConfigPath });
}

export { processStylesheet };

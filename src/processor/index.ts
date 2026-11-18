import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import atImport from './atImport.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceFile = path.join(here, 'fixtures/style.css');
const destFile = path.join(here, 'dest/app.css');

const css = await fs.readFile(sourceFile, 'utf8');
const result = await postcss([atImport()]).process(css, {
  from: sourceFile,
  to: destFile,
});

console.log(result.css);

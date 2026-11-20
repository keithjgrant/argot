import fs from 'node:fs/promises';
import { parseArgs } from 'node:util';
import path from 'node:path';
import { processStylesheet } from './index.ts';
import { print, printError } from '../cli/print.ts';
import { ANSI_YELLOW } from '../cli/ansiColors.ts';

const USAGE =
  'Usage: argot <input.css> <output.css> [--lint-config="path/to/config.js"]';

export async function runProcessor(args: string[]) {
  // TODO: helper for parseArgs. catches TypeError and prints help string
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      'lint-config': { type: 'string', short: 'c' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (positionals.length !== 2) {
    printError(
      `Error: Expected 2 positional arguments but got ${positionals.length}`,
    );
    print(USAGE, ANSI_YELLOW);
    return;
  }
  if (values.help) {
    print(USAGE, ANSI_YELLOW);
  }

  const source = path.resolve(process.cwd(), positionals[0]);
  const dest = path.resolve(process.cwd(), positionals[1]);
  await fs.mkdir(path.dirname(dest), { recursive: true });

  return await processStylesheet(source, dest, values['lint-config']);
}

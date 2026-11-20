import fs from 'node:fs/promises';
import path from 'path';
import { USAGE } from './usage.ts';
import { runSemantics } from '../semantics/cli.ts';
import { runPalette } from '../palette/cli.ts';
import { processStylesheet } from '../processor/index.ts';
import { ANSI_RED, ANSI_WHITE } from './ansiColors.ts';

async function run() {
  try {
    await handleArgs(process.argv.slice(2));
  } catch (e) {
    printError(e instanceof Error ? e.message : (e as string));
    process.exit(1);
  }
}

async function handleArgs(args: string[]) {
  const [command, ...rest] = args;

  if (!command || ['help', '--help', '-h'].includes(command)) {
    process.stdout.write(USAGE);
    return;
  }

  if (command === 'semantics') {
    return await runSemantics(rest);
  }

  if (command === 'palette') {
    return await runPalette(rest);
  }

  if (command.endsWith('.css')) {
    if (!rest[0]) {
      throw new Error('No destination file specified');
    }
    const source = path.resolve(process.cwd(), command);
    const dest = path.resolve(process.cwd(), rest[0]);
    await fs.mkdir(path.dirname(dest), { recursive: true });

    return await processStylesheet(source, dest);
  }

  printError(`Unknown command: ${command}`);
  process.exit(1);
}

function printError(message: string): void {
  console.error(`${ANSI_RED}argot: ${message}\n${ANSI_WHITE}`);
}

export { run };

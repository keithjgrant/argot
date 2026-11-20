import { USAGE } from './usage.ts';
import { runSemantics } from '../semantics/cli.ts';
import { runPalette } from '../palette/cli.ts';
import { runProcessor } from '../processor/cli.ts';
import { printError } from './print.ts';

async function run() {
  try {
    await handleArgs(process.argv.slice(2));
  } catch (e) {
    printError(e);
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
    return await runProcessor(args);
  }

  printError(`Unknown command: ${command}`);
  process.exit(1);
}

export { run };

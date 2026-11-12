import fs from 'node:fs';
import path from 'node:path';
import { writeTemplate } from './generate.js';

const USAGE = `Usage:
  argot generate [path] [--extended]   Write semantic CSS template (default: ./semantics.css)
  argot help                           Show this help

Options:
  --extended   Include extended-tier tokens (default: core only)

Examples:
  npx @keithjgrant/argot generate
  npx @keithjgrant/argot generate --extended
  npx @keithjgrant/argot generate ./styles/tokens.css --extended
`;

function run(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;

  if (
    !command ||
    command === 'help' ||
    command === '--help' ||
    command === '-h'
  ) {
    process.stdout.write(USAGE);
    return;
  }

  if (command === 'generate') {
    cmdGenerate(rest);
    return;
  }

  printError(`Unknown command "${command}"\n`);
  process.stdout.write(USAGE);
  process.exitCode = 1;
}

function cmdGenerate(args) {
  const flags = args.reduce((acc, arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      acc[key] = parseFlagValue(value);
    } else if (arg.startsWith('-')) {
      acc[arg.slice(1)] = true;
    }
    return acc;
  }, {});
  const outArg = args.find((a) => !a.startsWith('-'));
  const outPath = path.resolve(process.cwd(), outArg || 'semantics.css');

  if (fs.existsSync(outPath) && fs.statSync(outPath).isDirectory()) {
    printError(`Refusing to overwrite directory: ${outPath}`);
    process.exitCode = 1;
    return;
  }

  writeTemplate(outPath, { extended: flags.extended === true });
  console.log(`Wrote ${outPath}`);
}

function parseFlagValue(value) {
  if (value === undefined) return true;
  const normalized = String(value).toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return value;
}

function printError(message) {
  console.error(`argot: ${message}`);
}

export { run, USAGE };

import fs from 'node:fs';
import path from 'node:path';
import { writeTemplate } from './generate.ts';

function runSemantics(args: string[]): void {
  const flags = args.reduce<Record<string, string | boolean>>((acc, arg) => {
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
    throw new Error(`Refusing to overwrite directory: ${outPath}`);
  }

  writeTemplate(outPath, { extended: flags.extended === true });
  console.log(`Wrote ${outPath}`);
}

function parseFlagValue(value: string | undefined): string | boolean {
  if (value === undefined) return true;
  const normalized = String(value).toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return value;
}

export { runSemantics };

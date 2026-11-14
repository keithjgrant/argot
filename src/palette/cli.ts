import path from 'node:path';
import { parseArgs } from 'node:util';
import { loadPaletteDefinition, writePalette } from './node.ts';

function runPalette(args: string[]): void {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      force: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) {
    console.log(
      'Usage: argot palette <definition.json> [output.css] [--force] [--dry-run]',
    );
    return;
  }
  if (positionals.length < 1 || positionals.length > 2) {
    throw new Error(
      'Usage: argot palette <definition.json> [output.css] [--force] [--dry-run]',
    );
  }
  const [input, output = 'primitives.css'] = positionals;
  if (path.resolve(input) === path.resolve(output)) {
    throw new Error('Palette input and output paths must be different');
  }
  const definition = loadPaletteDefinition(input);
  const result = writePalette(output, definition, {
    force: values.force,
    dryRun: values['dry-run'],
  });
  console.log(`${result.written ? 'Wrote' : 'Would write'} ${result.path}`);
}

export { runPalette };

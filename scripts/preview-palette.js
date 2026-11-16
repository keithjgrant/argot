import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import postcss from 'postcss';
import {
  generatePalette,
  normalizePaletteDefinition,
  renderPaletteCss,
} from '../src/palette/index.ts';
import { loadPaletteDefinition } from '../src/palette/node.ts';

/*
  generate a static preview page for a palette
  usage: `node scripts/preview-palette.js`
*/

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );
}

function renderCombination(definition, lightnessCurve, chromaCurve) {
  const selected =
    definition.options.lightnessCurve === lightnessCurve &&
    definition.options.chromaCurve === chromaCurve;
  const heading = `${lightnessCurve} lightness / ${chromaCurve} chroma`;
  let content;
  try {
    const palette = generatePalette({
      ...definition,
      options: { ...definition.options, lightnessCurve, chromaCurve },
    });
    const css = renderPaletteCss(palette);
    // Swatches use the final declarations, including gamut mapping and output
    // precision. Do not duplicate conversion logic or display raw coordinates.
    const values = new Map();
    postcss.parse(css).walkDecls(({ prop, value }) => {
      values.set(prop, value);
    });
    const rows = palette.colors
      .map(({ name, baseStep, steps }) => {
        const seed = definition.seedColors.find((color) => color.name === name);
        const swatches = steps
          .map(({ step }) => {
            const property = `--${name}-${step}`;
            const value = values.get(property);
            if (!value)
              throw new Error(`Missing generated declaration: ${property}`);
            return `<figure data-shade data-base="${step === baseStep}">
          <div class="chip" style="background-color: ${escapeHtml(value)}" role="img"
            aria-label="${escapeHtml(`${property}: ${value}`)}"></div>
          <figcaption><strong>${step}${step === baseStep ? ' · base' : ''}</strong>
            <code>${escapeHtml(value)}</code></figcaption>
        </figure>`;
          })
          .join('\n');
        return `<article>
        <h3>${escapeHtml(name)}</h3>
        <p class="metadata">Seed: <code>l=${seed.l}, c=${seed.c}, h=${seed.h}deg</code>
          · Alias: <code>--${escapeHtml(name)} → --${escapeHtml(name)}-${baseStep}</code></p>
        <div class="scroll"><div class="shades">${swatches}</div></div>
      </article>`;
      })
      .join('\n');
    content = `${rows}
      <details><summary>Generated CSS declarations</summary>
        <pre><code>${escapeHtml(css)}</code></pre>
      </details>`;
  } catch (error) {
    content = `<p class="error" role="alert">${escapeHtml(error.message)}</p>`;
  }
  return `<section data-combination>
    <h2>${escapeHtml(heading)}${selected ? ' <small>input settings</small>' : ''}</h2>
    ${content}
  </section>`;
}

function renderPreview(input) {
  const definition = normalizePaletteDefinition(input);
  const combinations = [];
  for (const lightness of ['uniform', 'inclusive', 'centered']) {
    for (const chroma of ['centered', 'weighted']) {
      combinations.push([lightness, chroma]);
    }
  }
  const isSelected = ([lightness, chroma]) =>
    lightness === definition.options.lightnessCurve &&
    chroma === definition.options.chromaCurve;
  combinations.sort((a, b) => Number(isSelected(b)) - Number(isSelected(a)));
  const sections = combinations
    .map(([lightness, chroma]) =>
      renderCombination(definition, lightness, chroma),
    )
    .join('\n');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Argot palette preview</title>
  <style>
    :root { color-scheme: light; font: 16px/1.5 system-ui, sans-serif; background: #f7f7fa; color: #20212a; }
    * { box-sizing: border-box; }
    body { margin: 0 auto; padding: 2rem; max-width: 110rem; }
    h1, h2, h3 { line-height: 1.2; }
    h1 { margin-top: 0; }
    h3 { margin-bottom: .25rem; }
    section { margin-block: 2rem; padding: 1.5rem; border: 1px solid #d9d9e2; border-radius: .75rem; background: white; }
    article { margin-block: 2rem; }
    .metadata { margin-top: .25rem; color: #535563; }
    .scroll { overflow-x: auto; padding: .4rem; }
    .shades { display: grid; grid-template-columns: repeat(16, minmax(4rem, 1fr)); gap: .4rem; }
    figure { margin: 0; min-width: 0; }
    figure[data-base="true"] { outline: 2px solid #375dde; outline-offset: 3px; border-radius: .25rem; }
    .chip { height: 6rem; border-radius: .25rem; border: 1px solid #0002; }
    figcaption { padding: .35rem .15rem; font-size: .75rem; }
    figcaption code { display: block; overflow-wrap: anywhere; font-size: .65rem; }
    code { font-family: ui-monospace, monospace; }
    pre { overflow: auto; padding: 1rem; border-radius: .25rem; background: #eeeef3; font-size: .85rem; }
    summary { cursor: pointer; font-weight: 600; }
    small { display: inline-block; margin-left: .5rem; padding: .2rem .5rem; border-radius: 1rem; background: #e4ebff; font-size: .75rem; vertical-align: middle; }
    .error { color: #9c2020; border-left: .25rem solid; padding-left: 1rem; }
    @media (max-width: 40rem) { body { padding: 1rem; } section { padding: .75rem; } }
  </style>
</head>
<body>
  <header>
    <h1>Argot palette preview</h1>
    <p>Format: <strong>${escapeHtml(definition.options.format)}</strong>
      · Target gamut: <strong>${escapeHtml(definition.options.gamut)}</strong>
      · 16 shades per color. The outlined shade is the base alias.</p>
    <p>Swatches show final CSS output, not raw coordinates. Display gamut and browser support affect what you see.
      The selected input curves appear first; all six combinations are included.</p>
    <details><summary>Input definition (numeric OKLCH)</summary>
      <pre><code>${escapeHtml(JSON.stringify(definition, null, 2))}</code></pre>
    </details>
  </header>
  <main>${sections}</main>
</body>
</html>
`;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(
      'Usage: npm run palette:preview -- [definition.json] [output.html]',
    );
    return;
  }
  if (args.length > 2) {
    throw new Error('Expected at most a definition path and output HTML path');
  }
  const source =
    args[0] ||
    fileURLToPath(new URL('./fixtures/palette.json', import.meta.url));
  const output = path.resolve(args[1] || 'preview/palette.html');
  if (path.resolve(source) === output) {
    throw new Error('Input and output paths must be different');
  }
  const html = renderPreview(loadPaletteDefinition(source));
  if (
    fs.existsSync(output) &&
    !fs
      .readFileSync(output, 'utf8')
      .includes('<title>Argot palette preview</title>')
  ) {
    throw new Error(
      `Refusing to replace a file that is not an Argot preview: ${output}`,
    );
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, html, 'utf8');
  console.log(`Wrote ${output}`);
  console.log(`Open ${pathToFileURL(output).href}`);
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  try {
    main();
  } catch (error) {
    console.error(`palette preview: ${error.message}`);
    process.exitCode = 1;
  }
}

export { renderPreview };

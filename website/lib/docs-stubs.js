/** Planned docs URLs rendered as shell stubs until real pages exist. */
export const docsStubs = [
  // Processor — filled in a later increment; keep resolvable now
  {
    title: 'Processor',
    description: 'Assemble imports, lint, and minify CSS.',
    permalink: '/docs/processor/',
  },
  {
    title: 'Linting',
    description:
      'Optional Stylelint integration with the processor and standalone config.',
    permalink: '/docs/processor/linting/',
  },
  {
    title: 'Color contrast rule',
    description: 'Check WCAG contrast between paired semantic color tokens.',
    permalink: '/docs/processor/linting/color-contrast/',
  },
  {
    title: 'Property naming rule',
    description: 'Planned: conventions for custom property names.',
    permalink: '/docs/processor/linting/property-naming/',
  },
  {
    title: 'Property usage rule',
    description: 'Planned: guardrails for how tokens are referenced.',
    permalink: '/docs/processor/linting/property-usage/',
  },
  // Scaffold
  {
    title: 'Scaffold',
    description:
      'What scaffold will write, ownership, and regeneration (not shipped yet).',
    permalink: '/docs/scaffold/',
  },
  {
    title: 'Architecture',
    description: 'Cascade layer order and file map (mirrors website/styles).',
    permalink: '/docs/scaffold/architecture/',
  },
  {
    title: 'Palette generator',
    description: 'Headless OKLCH palette generation and CSS output.',
    permalink: '/docs/scaffold/palette-generator/',
  },
  {
    title: 'Semantic tokens',
    description: 'Vocabulary overview; browse the live reference from here.',
    permalink: '/docs/scaffold/semantic-tokens/',
  },
  // Reference
  {
    title: 'CLI',
    description: 'Command-line interface reference.',
    permalink: '/docs/reference/',
  },
  {
    title: 'Configuration file',
    description: 'Planned project configuration (.argot.json and related).',
    permalink: '/docs/reference/configuration/',
  },
  {
    title: 'Technical details',
    description: 'Internals, package layout, and implementation notes.',
    permalink: '/docs/reference/technical/',
  },
];

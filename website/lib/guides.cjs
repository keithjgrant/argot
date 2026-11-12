module.exports = {
  'color-bg': {
    title: 'Surfaces',
    intro:
      'Give each surface a role, from the page canvas to raised cards and inset fields. Map these roles to your own palette, and choose text colors for the surface they appear on.',
    example: `.card {
  background: var(--bg-raised);
  color: var(--text-primary);
}`,
  },
  'color-text': {
    title: 'Text colors',
    intro:
      'Express emphasis, interaction, and status without coupling copy to a palette step. Check contrast against the actual background; a pairing describes intent, not a guarantee of accessibility.',
    example: `.byline {
  color: var(--text-secondary);
}
a {
  color: var(--text-interactive);
}
a:hover {
  color: var(--text-interactive-hover);
}`,
  },
  'color-border': {
    title: 'Border colors',
    intro:
      'Use neutral dividers for structure and status colors to reinforce meaning. Border color is separate from border width and radius.',
    example: `.notice--warning {
  border: 1px solid var(--border-warning);
  background: var(--bg-warning);
  color: var(--text-warning);
}`,
  },
  'color-icon': {
    title: 'Icon colors',
    intro:
      'Extended tokens give icons their own color roles when inheriting text color is not enough. Use currentColor in SVGs to pick up the assigned role.',
    example: `.status-icon {
  color: var(--icon-success);
  fill: currentColor;
}`,
  },
  'color-chart': {
    title: 'Chart colors',
    intro:
      'Extended series colors provide consistent references for data visualization. Choose a distinguishable palette and supplement color with labels, patterns, or shapes.',
    example: `.chart-series:first-child {
  stroke: var(--chart-color-1);
}
.chart-series:nth-child(2) {
  stroke: var(--chart-color-2);
}`,
  },
  typography: {
    title: 'Typography',
    intro:
      'Define typefaces, a size scale, weights, and text rhythm once. Components can then describe their typographic role without repeating font values.',
    example: `body {
  font-family: var(--font-body);
  font-size: var(--font-size-md);
  line-height: var(--line-height-normal);
}
h1 {
  font-family: var(--font-display);
  font-size: var(--font-size-xl);
  line-height: var(--line-height-tight);
}`,
  },
  spacing: {
    title: 'Spacing',
    intro:
      'Apply a shared scale to gaps, padding, and margins. The steps describe relative size; assign values that fit your design rather than treating them as a prescribed numeric scale.',
    example: `.stack {
  display: grid;
  gap: var(--space-md);
}
.panel {
  padding: var(--space-lg);
}`,
  },
  borders: {
    title: 'Border shape & width',
    intro:
      'Keep corner treatments consistent with core radius tokens. Extended width tokens are available when your design benefits from shared stroke weights.',
    example: `.card {
  border-radius: var(--border-radius-md);
}
.chip {
  border-radius: var(--border-radius-sm);
}`,
  },
  motion: {
    title: 'Motion',
    intro:
      'Pair durations with easing curves to give transitions a consistent feel. Honor reduced-motion preferences; assigning a duration does not make every animation necessary.',
    example: `@media (prefers-reduced-motion: no-preference) {
  a {
    transition: color var(--duration-fast) var(--ease-linear);
  }
}`,
  },
  layout: {
    title: 'Layout & layering',
    intro:
      'Share content widths and a deliberate stacking order. Z-index values only compare within their stacking context, and do not override the browser’s top layer.',
    example: `.container {
  max-width: var(--content-max-width);
  margin-inline: auto;
}
.sticky-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}`,
  },
  misc: {
    title: 'Focus & shadow',
    intro:
      'Make keyboard focus visible and use a shared shadow for elevation. This example assigns a color to the focus-ring token and supplies outline width and style at the point of use.',
    example: `:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 3px;
}
.popover {
  background: var(--bg-raised);
  box-shadow: var(--box-shadow);
}`,
  },
};

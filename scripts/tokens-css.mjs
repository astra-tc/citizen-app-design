// Writes tokens/tokens.css from tokens/tokens.json (the single source of truth).
import { readFileSync, writeFileSync } from 'node:fs';

export function tokensToCss(t) {
  const block = (o, p) => Object.entries(o).map(([k, v]) => `  --${p}-${k}: ${v};`).join('\n');
  const status = Object.entries(t.status || {}).map(([k, v]) => `  --status-${k}: var(--color-${v});`);
  const base = [block(t.type, 'type'), block(t.space, 'space'), block(t.radius, 'radius'), ...status].join('\n');
  const light = block(t.color.light, 'color');
  const dark = block(t.color.dark, 'color');
  return `/* Kognai citizen design tokens. Generated from tokens.json by scripts/tokens-css.mjs. Do not edit by hand. */
:root {
  color-scheme: light;
${light}
${base}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${dark.replace(/^/gm, '  ')}
  }
}

[data-theme="dark"] {
  color-scheme: dark;
${dark}
}

[data-theme="light"] {
  color-scheme: light;
${light}
}
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = new URL('../', import.meta.url);
  const t = JSON.parse(readFileSync(new URL('tokens/tokens.json', root), 'utf8'));
  writeFileSync(new URL('tokens/tokens.css', root), tokensToCss(t));
  console.log('tokens/tokens.css written');
}

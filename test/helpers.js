// Small helpers for the acceptance tests. No dependencies, no network.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const P = (...p) => path.join(ROOT, ...p);
export const read = (...p) => readFileSync(P(...p), 'utf8');
export const exists = (...p) => existsSync(P(...p));

export const SCREENS = ['first-run', 'lobby', 'chat', 'services', 'wallet', 'settings'];
export const EN = SCREENS.map((s) => `prototype/${s}.html`);
export const AR = SCREENS.map((s) => `prototype/ar/${s}.html`);
export const ALL_PAGES = ['prototype/index.html', 'prototype/design-system.html', ...EN, ...AR];
export const REQUIRED_COLORS = ['bg', 'surface', 'text', 'text-muted', 'primary', 'on-primary', 'border', 'danger'];

// WCAG 2.x relative luminance and contrast ratio
export function luminance(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// Custom properties declared directly inside the block that starts at selector
export function cssBlock(css, selector) {
  const i = css.indexOf(selector + ' {');
  if (i < 0) return null;
  let depth = 0, start = css.indexOf('{', i), j = start;
  for (; j < css.length; j++) { if (css[j] === '{') depth++; else if (css[j] === '}' && --depth === 0) break; }
  const body = css.slice(start + 1, j);
  const vars = {};
  for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

export const htmlTag = (html) => (html.match(/<html\b[^>]*>/i) || [''])[0];
export const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i')); return m ? m[1] : null; };
export const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
export const hrefs = (html) => [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
export const isLocal = (u) => !/^(?:[a-z]+:|\/\/)/i.test(u);

// Text people see: element text plus alt, aria-label, placeholder, title and value attributes
export function visibleText(html) {
  const noCode = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ');
  const attrs = [...noCode.matchAll(/\s(?:alt|aria-label|placeholder|title|value)="([^"]*)"/g)].map((m) => m[1]);
  const text = noCode.replace(/<[^>]+>/g, ' ');
  return text + ' ' + attrs.join(' ');
}
export const LONG_DASH = /[\u2012\u2013\u2014\u2015\u2E3A\u2E3B\uFE58\uFE63\uFF0D]/;
export const NON_LATIN_DIGIT = /[\u0660-\u0669\u06F0-\u06F9\u0966-\u096F\u09E6-\u09EF]/;

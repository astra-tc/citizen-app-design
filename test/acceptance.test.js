import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  ROOT, P, read, exists, SCREENS, EN, AR, ALL_PAGES, REQUIRED_COLORS, contrast, cssBlock,
  htmlTag, attr, tags, hrefs, isLocal, visibleText, LONG_DASH, NON_LATIN_DIGIT,
} from './helpers.js';
import { tokensToCss } from '../scripts/tokens-css.mjs';

const tokens = JSON.parse(read('tokens/tokens.json'));
const css = read('tokens/tokens.css');
const HEX = /^#[0-9a-f]{6}$/i;
const PAIRS = [['text', 'bg'], ['text', 'surface'], ['text-muted', 'bg'], ['text-muted', 'surface'], ['on-primary', 'primary'], ['danger', 'bg']];
// pairs the components also use (chips, bubbles, badges, hover)
const EXTRA_PAIRS = [['danger', 'surface'], ['on-primary', 'primary-hover'], ['on-primary-soft', 'primary-soft'], ['primary', 'bg'], ['primary', 'surface'], ['success', 'surface'], ['text', 'bubble-citizen'], ['on-primary', 'bubble-me'], ['text-muted', 'surface-raised']];

test('A1 tokens cover both themes with #rrggbb colours, type, space and radius, and tokens.css holds the same values', () => {
  for (const k of ['color', 'type', 'space', 'radius']) assert.ok(tokens[k] && typeof tokens[k] === 'object', `tokens.${k} missing`);
  for (const mode of ['light', 'dark']) {
    const c = tokens.color[mode];
    assert.ok(c, `color.${mode} missing`);
    for (const k of REQUIRED_COLORS) assert.match(c[k] ?? '', HEX, `${mode}.${k} is not #rrggbb`);
    for (const [k, v] of Object.entries(c)) assert.match(v, HEX, `${mode}.${k} is not #rrggbb`);
  }
  assert.deepEqual(Object.keys(tokens.color.light).sort(), Object.keys(tokens.color.dark).sort(), 'both themes have the same keys');
  // brand: terracotta, charcoal and cream
  for (const k of ['terracotta', 'charcoal', 'cream']) assert.match(tokens.brand?.[k] ?? '', HEX, `brand.${k}`);
  assert.equal(tokens.color.light.bg, tokens.brand.cream, 'light bg is the brand cream');
  assert.equal(tokens.color.light.text, tokens.brand.charcoal, 'light text is the brand charcoal');

  // CSS parity: light by default, dark under prefers-color-scheme and under [data-theme="dark"]
  assert.equal(css, tokensToCss(tokens), 'tokens.css is generated from tokens.json (npm run build)');
  const root = cssBlock(css, ':root');
  const dark = cssBlock(css, '[data-theme="dark"]');
  const media = cssBlock(css, ':root:not([data-theme="light"])');
  assert.match(css, /@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\)/);
  for (const [k, v] of Object.entries(tokens.color.light)) assert.equal(root[`color-${k}`], v, `--color-${k} light`);
  for (const [k, v] of Object.entries(tokens.color.dark)) {
    assert.equal(dark[`color-${k}`], v, `[data-theme=dark] --color-${k}`);
    assert.equal(media[`color-${k}`], v, `prefers dark --color-${k}`);
  }
  for (const g of ['type', 'space', 'radius']) for (const [k, v] of Object.entries(tokens[g])) assert.equal(root[`${g}-${k}`], v, `--${g}-${k}`);
});

test('A1 every text pair has a contrast of at least 4.5 to 1 in light and in dark', () => {
  for (const mode of ['light', 'dark']) {
    const c = tokens.color[mode];
    for (const [f, b] of [...PAIRS, ...EXTRA_PAIRS]) {
      const r = contrast(c[f], c[b]);
      assert.ok(r >= 4.5, `${mode}: ${f} on ${b} is ${r.toFixed(2)} to 1`);
    }
  }
});

test('A2 every screen exists in English and in Arabic, the Arabic screens right to left', () => {
  for (const f of [...EN, ...AR]) assert.ok(exists(f), `${f} missing`);
  for (const f of EN) {
    const h = htmlTag(read(f));
    assert.equal(attr(h, 'lang'), 'en', `${f} lang`);
  }
  for (const f of AR) {
    const html = read(f);
    const h = htmlTag(html);
    assert.equal(attr(h, 'lang'), 'ar', `${f} lang`);
    assert.equal(attr(h, 'dir'), 'rtl', `${f} dir`);
    const title = (html.match(/<h1>([^<]*)<\/h1>/) || [])[1] || '';
    assert.match(title, /[\u0600-\u06FF]/, `${f} heading is in Arabic`);
  }
  // same screens, same structure: every English screen has its Arabic twin with the same controls
  for (const s of SCREENS) {
    const en = read(`prototype/${s}.html`), ar = read(`prototype/ar/${s}.html`);
    for (const t of ['a', 'button', 'input', 'select', 'img']) assert.equal(tags(ar, t).length, tags(en, t).length, `${s}: same number of <${t}>`);
  }
  // direction aware layout: logical properties, no left or right in the component CSS
  const app = read('prototype/app.css');
  assert.doesNotMatch(app.replace(/\/\*[\s\S]*?\*\//g, ''), /(margin|padding|border)-(left|right)|\b(left|right)\s*:|text-align:\s*(left|right)/, 'app.css uses logical properties only');
  assert.match(app, /\[dir="rtl"\] \.flip/, 'direction icons flip in rtl');
});

test('A3 every screen works at 360 px in light and dark, using the tokens', () => {
  const app = read('prototype/app.css');
  const noComments = app.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(noComments, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i, 'app.css has no raw colours, only tokens');
  for (const m of noComments.replace(/@media[^{]*/g, '').matchAll(/(?<![-\w])(min-width|width)\s*:\s*(\d+)px/g)) assert.ok(+m[2] <= 360, `fixed ${m[1]} ${m[2]}px is wider than a phone`);
  assert.match(noComments, /max-width:\s*480px/);
  for (const f of ALL_PAGES) {
    const html = read(f);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/, `${f} viewport`);
    const links = tags(html, 'link').map((t) => attr(t, 'href'));
    const tok = links.find((h) => h.endsWith('tokens/tokens.css'));
    assert.ok(tok, `${f} links tokens.css`);
    assert.ok(existsSync(path.resolve(path.dirname(P(f)), tok)), `${f}: ${tok} resolves`);
    assert.ok(links.some((h) => h.endsWith('app.css')), `${f} links app.css`);
    assert.match(html, /<script src="(\.\.\/)?app\.js"><\/script>/, `${f} loads the theme switch`);
    if (f.includes('design-system')) continue;
    for (const s of html.matchAll(/style="([^"]*)"/g)) assert.doesNotMatch(s[1], /#[0-9a-f]{3,6}\b|rgb/i, `${f} inline style uses tokens`);
  }
  assert.match(read('prototype/app.js'), /data-theme/, 'the theme switch sets data-theme');
});

const chrome = process.env.NO_BROWSER ? null : ['google-chrome', 'chromium', 'chromium-browser'].find((c) => spawnSync('which', [c]).status === 0);
test('A3 rendered at 360 px in a real browser nothing overflows, light and dark, English and Arabic', { skip: chrome ? false : 'no Chrome on this machine (the static checks above still run)' }, () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'citizen-'));
  cpSync(P('prototype'), path.join(dir, 'prototype'), { recursive: true });
  cpSync(P('tokens'), path.join(dir, 'tokens'), { recursive: true });
  const probe = '<script>addEventListener("load",function(){var d=document.documentElement;var w=Math.max(d.scrollWidth,document.body.scrollWidth);var bad=[].filter.call(document.querySelectorAll("main *"),function(e){var r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left<-1)}).length;parent.postMessage(w+" "+innerWidth+" "+bad+" "+getComputedStyle(document.body).backgroundColor,"*")})</script>';
  // Chrome headless windows are at least 500 px wide, so each page is loaded in a 360 px frame
  const host = path.join(dir, 'host.html');
  for (const mode of ['light', 'dark']) {
    for (const f of ALL_PAGES) {
      const file = path.join(dir, f);
      const src = readFileSync(file, 'utf8').replace('<html ', `<html data-theme="${mode}" `).replace('</body>', probe + '</body>');
      writeFileSync(file, src);
      writeFileSync(host, `<!doctype html><html lang="en"><body style="margin:0"><output id="probe"></output><iframe title="screen" style="border:0;width:360px;height:800px" src="${'file://' + file}"></iframe><script>addEventListener("message",function(e){document.getElementById("probe").textContent=e.data})</script></body></html>`);
      const r = spawnSync(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--window-size=800,900', '--virtual-time-budget=3000', '--dump-dom', 'file://' + host], { encoding: 'utf8', timeout: 30000 });
      const m = (r.stdout || '').match(/<output id="probe">(\d+) (\d+) (\d+) ([^<]+)<\/output>/);
      assert.ok(m, `${f} ${mode}: page rendered`);
      assert.equal(+m[2], 360, 'viewport is 360 px');
      assert.ok(+m[1] <= 360, `${f} ${mode}: page is ${m[1]} px wide at 360`);
      assert.equal(+m[3], 0, `${f} ${mode}: ${m[3]} elements stick out of the screen`);
      const bg = tokens.color[mode].bg;
      const rgb = `rgb(${parseInt(bg.slice(1, 3), 16)}, ${parseInt(bg.slice(3, 5), 16)}, ${parseInt(bg.slice(5, 7), 16)})`;
      assert.equal(m[4], rgb, `${f} ${mode}: background is the ${mode} bg token`);
      writeFileSync(file, readFileSync(P(f), 'utf8'));
    }
  }
});

test('A4 the prototype is clickable: every screen is reachable from index.html and no local link is broken', () => {
  const seen = new Set(['prototype/index.html']);
  const queue = ['prototype/index.html'];
  while (queue.length) {
    const f = queue.shift();
    const html = read(f);
    for (const u of hrefs(html)) {
      if (!isLocal(u)) continue;
      const [file, frag] = u.split('#');
      const target = file ? path.relative(P(), path.resolve(path.dirname(P(f)), file)) : f;
      assert.ok(exists(target), `${f}: broken link ${u}`);
      if (frag) assert.match(read(target), new RegExp(`id="${frag}"`), `${f}: ${u} points to a missing anchor`);
      if (target.endsWith('.html') && !seen.has(target)) { seen.add(target); queue.push(target); }
    }
  }
  for (const f of ALL_PAGES) assert.ok(seen.has(f), `${f} is not reachable from index.html`);
  // every screen links on: the tab bar reaches the main screens, first run leads to the lobby, each page has its language twin
  for (const f of [...EN, ...AR]) {
    const html = read(f);
    const out = hrefs(html);
    if (f.endsWith('first-run.html')) assert.ok(out.includes('lobby.html'), `${f} leads to the lobby`);
    else for (const s of ['lobby', 'chat', 'services', 'wallet', 'settings']) assert.ok(out.includes(`${s}.html`), `${f} links ${s}`);
    const twin = f.includes('/ar/') ? `../${path.basename(f)}` : `ar/${path.basename(f)}`;
    assert.ok(out.includes(twin), `${f} links its other language version`);
    assert.ok(out.some((u) => u.endsWith('index.html')), `${f} links back to index.html`);
  }
  assert.ok(exists('index.html') && read('index.html').includes('prototype/index.html'), 'the repository root opens the prototype');
});

test('A5 accessible: images have alt text, controls have labels, every page sets its language', () => {
  for (const f of [...ALL_PAGES, 'index.html']) {
    const html = read(f);
    const lang = attr(htmlTag(html), 'lang');
    assert.match(lang ?? '', /^(en|ar)$/, `${f} sets its language`);
    assert.match(html, /<title>[^<]+<\/title>/, `${f} title`);
    for (const t of tags(html, 'img')) assert.ok((attr(t, 'alt') ?? '').trim().length > 0, `${f}: image without alt ${t}`);
    for (const t of tags(html, 'svg')) assert.ok(attr(t, 'aria-hidden') === 'true' || attr(t, 'aria-label'), `${f}: svg neither hidden nor labelled`);
    const labelFor = new Set(tags(html, 'label').map((t) => attr(t, 'for')).filter(Boolean));
    for (const name of ['input', 'select', 'textarea']) {
      for (const m of html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))) {
        const t = m[0];
        if (attr(t, 'type') === 'hidden') continue;
        const before = html.slice(0, m.index);
        const wrapped = before.lastIndexOf('<label') > before.lastIndexOf('</label>');
        const ok = (attr(t, 'id') && labelFor.has(attr(t, 'id'))) || attr(t, 'aria-label') || attr(t, 'aria-labelledby') || wrapped;
        assert.ok(ok, `${f}: ${name} without a label ${t}`);
      }
    }
    for (const m of html.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
      const text = m[3].replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim();
      const imgAlt = (m[3].match(/alt="([^"]+)"/) || [])[1];
      assert.ok(text || /aria-label="[^"]+"/.test(m[2]) || imgAlt, `${f}: ${m[1]} without a name: ${m[0].slice(0, 80)}`);
    }
    if (f === 'index.html') continue; // the root page only redirects to the prototype
    assert.match(html, /class="skip" href="#main"/, `${f} skip link`);
    assert.match(html, /<main id="main">/, `${f} main landmark`);
  }
  assert.match(read('prototype/app.css'), /:focus-visible\s*\{\s*outline:\s*3px solid var\(--color-focus\)/, 'visible focus ring');
  for (const mode of ['light', 'dark']) assert.ok(contrast(tokens.color[mode].focus, tokens.color[mode].bg) >= 3, `${mode} focus ring contrast`);
});

test('A5 house rules: text people see has Latin digits only and no long dashes', () => {
  const files = [...ALL_PAGES, 'index.html', 'README.md', ...readdirSync(P('docs')).map((d) => `docs/${d}`)];
  for (const f of files) {
    const raw = read(f);
    const text = f.endsWith('.html') ? visibleText(raw) : raw;
    assert.doesNotMatch(text, LONG_DASH, `${f} has a long dash`);
    assert.doesNotMatch(text, NON_LATIN_DIGIT, `${f} has non Latin digits`);
  }
  // no secrets
  const all = [...ALL_PAGES, 'prototype/app.js', 'scripts/build-pages.mjs', 'scripts/tokens-css.mjs'].map((f) => read(f)).join('\n');
  assert.doesNotMatch(all, /(?:api[_-]?key|secret|private[_-]?key|BEGIN [A-Z]+ KEY)\s*[:=]/i);
  assert.doesNotMatch(all, /\b0x[0-9a-fA-F]{64}\b/, 'no private key shaped value');
});

test('A6 review by the Founder with three test users: plan and script ready', () => {
  const plan = read('docs/review-plan.md');
  const users = plan.match(/^### Test user \d/gm) || [];
  assert.equal(users.length, 3, 'three test users');
  for (const s of SCREENS) assert.ok(plan.includes(`${s}.html`), `the script covers ${s}`);
  assert.match(plan, /Arabic/);
  assert.match(plan, /dark/);
});

test('A6 review by the Founder with three test users: results recorded', { todo: existsSync(P('docs/review-results.md')) ? false : 'done with the Founder during M2' }, () => {
  const r = read('docs/review-results.md');
  assert.equal((r.match(/^### Test user \d/gm) || []).length, 3);
  assert.match(r, /Founder/);
});

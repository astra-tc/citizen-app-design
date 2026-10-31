// B tests: the approval flow (nothing is sent, posted or paid without the user's yes),
// the status tokens and the components shared by the app, the landing page and the teaser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, exists, contrast, tags, attr, htmlTag } from './helpers.js';
import { STATES, FINAL, TRANSITIONS, ACTORS, COPY, createFlow, transition, revise, execute, digest, renderApproval, facts } from '../prototype/approval.mjs';
import { DEMO, flowIn } from '../scripts/build-pages.mjs';

const tokens = JSON.parse(read('tokens/tokens.json'));
const pay = { id: 'p1', kind: 'pay', title: 'Brief', to: 'Lina, Base 0x8f2c...41d0', amount: '25', currency: 'USDC', cost_credits: 1, reversible: false };
const user = (f, extra = {}) => ({ by: 'user', digest: f.digest, ...extra });

test('B1 a new request is pending, and the six states and their moves are exactly the designed ones', () => {
  assert.deepEqual(STATES, ['pending', 'running', 'confirmed', 'refused', 'failed', 'cancelled']);
  assert.equal(createFlow(pay).state, 'pending');
  for (const s of FINAL) assert.deepEqual(TRANSITIONS[s], {}, `${s} is final`);
  const reach = new Set(['pending']);
  for (const s of STATES) for (const n of Object.values(TRANSITIONS[s])) reach.add(n);
  assert.deepEqual([...reach].sort(), [...STATES].sort(), 'every state is reachable');
  assert.throws(() => transition(createFlow(pay), 'succeed', { by: 'system' }), /cannot succeed when pending/);
  assert.throws(() => createFlow({ ...pay, amount: '0' }), /positive amount/);
  assert.throws(() => createFlow({ ...pay, kind: 'delete' }), /unknown kind/);
});

test('B2 only the user can say yes or no; the citizen and the system cannot approve', () => {
  const f = createFlow(pay);
  for (const by of ['citizen', 'system', undefined]) assert.throws(() => transition(f, 'approve', { by, digest: f.digest }), /cannot approve/);
  for (const ev of ['approve', 'refuse']) assert.deepEqual(ACTORS[ev], ['user']);
  assert.equal(transition(f, 'approve', user(f)).state, 'running');
  assert.equal(transition(f, 'refuse', { by: 'user' }).state, 'refused');
});

test('B3 the yes is bound to what was shown: a changed amount, recipient or text needs a new yes', () => {
  const f = createFlow(pay);
  assert.throws(() => transition(f, 'approve', { by: 'user' }), /does not match/);
  for (const change of [{ amount: '250' }, { to: 'Someone else' }, { reversible: true }, { content: 'x' }]) {
    assert.notEqual(digest({ ...pay, ...change }), f.digest, `digest covers ${Object.keys(change)}`);
    const g = revise(f, change);
    assert.equal(g.state, 'pending');
    assert.throws(() => transition(g, 'approve', { by: 'user', digest: f.digest }), /does not match/, 'the old yes is not reused');
  }
  assert.equal(digest({ ...pay, id: 'other' }), f.digest, 'ids do not change what the user sees');
});

test('B4 the action runs only after a yes: refused, cancelled and expired requests never call the executor', async () => {
  let calls = 0;
  const run = async () => { calls++; return 'tx1'; };
  const f = createFlow(pay);
  await assert.rejects(execute(f, run), /not approved/);
  for (const g of [transition(f, 'refuse', { by: 'user' }), transition(f, 'cancel', { by: 'citizen' }), transition(f, 'expire', { by: 'system' })]) {
    assert.equal(g.state === 'refused' || g.state === 'cancelled', true);
    await assert.rejects(execute(g, run), /not approved/);
  }
  assert.equal(calls, 0);
  const done = await execute(transition(f, 'approve', user(f)), run);
  assert.equal(calls, 1);
  assert.equal(done.state, 'confirmed');
  assert.equal(done.receipt, 'tx1');
  assert.deepEqual(done.history.map((h) => h.event), ['create', 'approve', 'succeed']);
});

test('B5 a failure is shown, nothing is retried silently, and a retry asks for a new yes', async () => {
  const f = createFlow(pay);
  const failed = await execute(transition(f, 'approve', user(f)), async () => { throw new Error('address rejected'); });
  assert.equal(failed.state, 'failed');
  assert.equal(failed.error, 'address rejected');
  assert.throws(() => transition(failed, 'approve', user(failed)), /cannot approve when failed/);
  const again = transition(failed, 'retry', { by: 'user' });
  assert.equal(again.state, 'pending');
  await assert.rejects(execute(again, async () => 'x'), /not approved/);
  assert.equal(transition(failed, 'cancel', { by: 'user' }).state, 'cancelled');
});

test('B6 each state renders clearly: its label, tone, live region and only the buttons that make sense', () => {
  for (const lang of ['en', 'ar']) {
    const R = DEMO[lang].reasons;
    for (const st of STATES) {
      const html = renderApproval(flowIn({ ...pay, ...DEMO[lang].pay }, st, R), lang);
      assert.match(html, new RegExp(`data-state="${st}"`));
      assert.ok(html.includes(COPY[lang].state[st]), `${lang} ${st} label`);
      assert.match(html, new RegExp(`class="state state-${st}" role="${st === 'failed' ? 'alert' : 'status'}"`));
      const events = [...html.matchAll(/data-event="(\w+)"/g)].map((m) => m[1]);
      const expect = { pending: ['approve', 'refuse'], failed: ['retry', 'cancel'] }[st] || [];
      assert.deepEqual(events, expect, `${lang} ${st} buttons`);
      assert.doesNotMatch(html, /autofocus/, 'yes is never preselected');
      assert.match(html, new RegExp(`aria-busy="${st === 'running'}"`));
      if (st === 'failed') assert.ok(html.includes(R.failed), 'the reason is shown');
      if (st === 'confirmed') assert.ok(html.includes(R.receipt), 'the receipt is shown');
    }
  }
});

test('B7 before the yes the card shows what will happen: recipient, content, amount, cost and whether it can be undone', () => {
  const html = renderApproval(createFlow(pay));
  for (const v of ['Lina, Base 0x8f2c...41d0', '25 USDC', '1 credits', 'No, this cannot be undone']) assert.ok(html.includes(v), v);
  assert.match(html, />Yes, pay 25 USDC</, 'the yes button names the action and the amount');
  assert.match(html, />No, do not pay</);
  const post = createFlow({ id: 'q', kind: 'post', title: 'News', to: 'Newsletter', content: '220 words', cost_credits: 4, reversible: true });
  assert.deepEqual(facts(post.request).map((x) => x[0]), ['To', 'Content', 'Cost', 'Can it be undone?']);
  assert.match(renderApproval(post), />Yes, post it</);
  assert.ok(renderApproval(createFlow({ ...pay, title: '<img src=x onerror=alert(1)>' })).includes('&lt;img'), 'request text is escaped');
  for (const k of ['en', 'ar']) assert.deepEqual(Object.keys(COPY[k].state).sort(), [...STATES].sort());
});

test('B8 status tokens point at colour tokens and read at 4.5 to 1 on surface and bg in light and dark', () => {
  assert.deepEqual(Object.keys(tokens.status).sort(), [...STATES].sort());
  const css = read('tokens/tokens.css');
  for (const [s, c] of Object.entries(tokens.status)) {
    assert.ok(tokens.color.light[c], `${s} -> ${c} exists`);
    assert.ok(css.includes(`--status-${s}: var(--color-${c});`), `--status-${s} in tokens.css`);
    for (const m of ['light', 'dark']) for (const bg of ['surface', 'bg']) {
      const r = contrast(tokens.color[m][c], tokens.color[m][bg]);
      assert.ok(r >= 4.5, `${m} ${s} on ${bg} is ${r.toFixed(2)}`);
    }
  }
  const app = read('prototype/app.css');
  for (const s of STATES) assert.match(app, new RegExp(`\\.state-${s} \\{ color: var\\(--status-${s}\\); \\}`));
});

test('B9 app, approval, landing page and teaser share one token file, one stylesheet and the same components', () => {
  for (const f of ['prototype/approval.html', 'prototype/ar/approval.html', 'prototype/landing.html', 'prototype/teaser.html', 'prototype/chat.html']) {
    const html = read(f);
    const links = tags(html, 'link').map((t) => attr(t, 'href'));
    assert.ok(links.some((h) => /(^|\/)tokens\/tokens\.css$/.test(h)) && links.some((h) => /(^|\/)app\.css$/.test(h)), `${f} uses tokens.css and app.css`);
    assert.match(html, /class="btn btn-primary/, `${f} uses the shared button`);
  }
  assert.match(read('prototype/landing.html'), /class="card approval"/, 'the landing page shows the real approval card');
  assert.match(read('prototype/teaser.html'), /class="state state-pending"/, 'the teaser uses the status pill');
  const ar = read('prototype/ar/approval.html');
  assert.equal(attr(htmlTag(ar), 'dir'), 'rtl');
  assert.equal((ar.match(/class="card approval"/g) || []).length, 3 + STATES.length + 1, 'Arabic page has every card');
  assert.equal((read('prototype/approval.html').match(/class="card approval"/g) || []).length, 3 + STATES.length + 1);
  assert.match(read('prototype/approval.html'), /import \{[^}]*\} from 'approval\.mjs'/, 'the live demo uses the same module');
});

test('B10 the docs explain the flow so developers and agents can build from it', () => {
  assert.ok(exists('docs/approval-flow.md'));
  const d = read('docs/approval-flow.md');
  for (const s of STATES) assert.match(d, new RegExp('`' + s + '`'), `docs cover ${s}`);
  for (const w of ['createFlow', 'transition', 'execute', 'renderApproval', 'digest', '--status-', 'aria-live']) assert.ok(d.includes(w), `docs mention ${w}`);
});

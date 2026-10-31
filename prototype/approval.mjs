// Approval flow for the Kognai citizen app (Gok).
// Rule: nothing is sent, posted or paid until the user says yes to exactly what was shown.
// Pure ES module, no dependencies: runs in the browser (prototype/approval.html) and in Node (tests, agents).

export const STATES = ['pending', 'running', 'confirmed', 'refused', 'failed', 'cancelled'];
export const FINAL = ['confirmed', 'refused', 'cancelled'];
export const KINDS = ['send', 'post', 'pay'];

// state -> event -> next state. Anything not listed is refused with an error.
export const TRANSITIONS = {
  pending: { approve: 'running', refuse: 'refused', cancel: 'cancelled', expire: 'cancelled' },
  running: { succeed: 'confirmed', fail: 'failed' },
  failed: { retry: 'pending', cancel: 'cancelled' },
  confirmed: {}, refused: {}, cancelled: {},
};
// who may raise each event: only the user can say yes or no
export const ACTORS = {
  approve: ['user'], refuse: ['user'], cancel: ['user', 'citizen'], expire: ['system'],
  succeed: ['system'], fail: ['system'], retry: ['user', 'citizen'],
};

// The user visible fields of a request. The yes is bound to a digest of exactly these.
const SHOWN = ['kind', 'title', 'to', 'content', 'amount', 'currency', 'cost_credits', 'reversible'];
export function digest(request) {
  const s = JSON.stringify(SHOWN.map((k) => [k, request[k] ?? null]));
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

export function createFlow(request, at = new Date().toISOString()) {
  if (!KINDS.includes(request.kind)) throw new Error(`unknown kind ${request.kind}`);
  for (const k of ['id', 'title', 'to']) if (!request[k]) throw new Error(`request.${k} is required`);
  if (request.kind === 'pay' && !(Number(request.amount) > 0)) throw new Error('a payment needs a positive amount');
  return Object.freeze({ request: Object.freeze({ ...request }), state: 'pending', digest: digest(request), history: Object.freeze([{ state: 'pending', event: 'create', by: 'citizen', at }]) });
}

export function transition(flow, event, { by, digest: shown, reason, receipt, at = new Date().toISOString() } = {}) {
  const next = TRANSITIONS[flow.state]?.[event];
  if (!next) throw new Error(`cannot ${event} when ${flow.state}`);
  if (!ACTORS[event].includes(by)) throw new Error(`${by ?? 'nobody'} cannot ${event}`);
  if (event === 'approve' && shown !== flow.digest) throw new Error('the yes does not match what was shown; ask again');
  const extra = {};
  if (event === 'fail') extra.error = reason || 'Unknown error';
  if (event === 'succeed') extra.receipt = receipt || null;
  if (event === 'refuse' || event === 'cancel' || event === 'expire') extra.reason = reason || null;
  return Object.freeze({ ...flow, ...extra, state: next, history: Object.freeze([...flow.history, { state: next, event, by, at }]) });
}

// Changing what will happen (amount, recipient, text) always goes back to pending and needs a new yes.
export function revise(flow, changes, at) {
  if (!['pending', 'failed'].includes(flow.state)) throw new Error(`cannot change a request when ${flow.state}`);
  const f = createFlow({ ...flow.request, ...changes }, at);
  return Object.freeze({ ...f, history: Object.freeze([...flow.history, { state: 'pending', event: 'revise', by: 'citizen', at: f.history[0].at }]) });
}

// Runs the action only for a flow the user approved. The executor is never called otherwise.
export async function execute(flow, executor) {
  if (flow.state !== 'running') throw new Error(`refusing to run: state is ${flow.state}, not approved`);
  try {
    const receipt = await executor(flow.request);
    return transition(flow, 'succeed', { by: 'system', receipt });
  } catch (e) {
    return transition(flow, 'fail', { by: 'system', reason: String(e?.message || e) });
  }
}

// Copy. Every string the user reads lives here, in English and Arabic.
export const COPY = {
  en: {
    kind: { send: 'Send', post: 'Post', pay: 'Pay' },
    head: { send: 'Nour wants to send a message', post: 'Nour wants to post', pay: 'Nour wants to pay' },
    yes: { send: 'Yes, send it', post: 'Yes, post it', pay: (a) => `Yes, pay ${a}` },
    no: { send: 'No, do not send', post: 'No, do not post', pay: 'No, do not pay' },
    facts: { what: 'What will happen', to: 'To', content: 'Content', amount: 'Amount', cost: 'Cost', undo: 'Can it be undone?' },
    undoYes: 'Yes, within 10 minutes', undoNo: 'No, this cannot be undone', credits: 'credits',
    state: { pending: 'Waiting for your yes', running: 'Working on it', confirmed: 'Done', refused: 'You said no', failed: 'It did not go through', cancelled: 'Cancelled' },
    detail: {
      pending: 'Nothing happens until you choose.',
      running: { send: 'Sending now.', post: 'Posting now.', pay: 'Paying now.' },
      confirmed: { send: 'Sent.', post: 'Posted.', pay: 'Paid.' },
      refused: { send: 'Nothing was sent.', post: 'Nothing was posted.', pay: 'Nothing was paid.' },
      failed: { send: 'Nothing was sent.', post: 'Nothing was posted.', pay: 'No money moved.' },
      cancelled: { send: 'Nothing was sent.', post: 'Nothing was posted.', pay: 'Nothing was paid.' },
    },
    receipt: 'Receipt', reason: 'Reason', retry: 'Try again', cancel: 'Cancel', done: 'Back to chat', ask: 'You will be asked again before anything happens.',
  },
  ar: {
    kind: { send: 'إرسال', post: 'نشر', pay: 'دفع' },
    head: { send: 'تريد نور إرسال رسالة', post: 'تريد نور النشر', pay: 'تريد نور الدفع' },
    yes: { send: 'نعم، أرسلها', post: 'نعم، انشرها', pay: (a) => `نعم، ادفع ${a}` },
    no: { send: 'لا، لا ترسل', post: 'لا، لا تنشر', pay: 'لا، لا تدفع' },
    facts: { what: 'ما الذي سيحدث', to: 'إلى', content: 'المحتوى', amount: 'المبلغ', cost: 'التكلفة', undo: 'هل يمكن التراجع؟' },
    undoYes: 'نعم، خلال 10 دقائق', undoNo: 'لا، لا يمكن التراجع', credits: 'رصيد',
    state: { pending: 'بانتظار موافقتك', running: 'جار التنفيذ', confirmed: 'تم', refused: 'رفضت', failed: 'لم تنجح العملية', cancelled: 'ألغي' },
    detail: {
      pending: 'لن يحدث شيء حتى تختار.',
      running: { send: 'جار الإرسال.', post: 'جار النشر.', pay: 'جار الدفع.' },
      confirmed: { send: 'أرسلت.', post: 'نشرت.', pay: 'دفعت.' },
      refused: { send: 'لم يرسل شيء.', post: 'لم ينشر شيء.', pay: 'لم يدفع شيء.' },
      failed: { send: 'لم يرسل شيء.', post: 'لم ينشر شيء.', pay: 'لم يتحرك أي مال.' },
      cancelled: { send: 'لم يرسل شيء.', post: 'لم ينشر شيء.', pay: 'لم يدفع شيء.' },
    },
    receipt: 'الإيصال', reason: 'السبب', retry: 'حاول مرة أخرى', cancel: 'إلغاء', done: 'العودة إلى المحادثة', ask: 'سنسألك مرة أخرى قبل أن يحدث أي شيء.',
  },
};

const ICON = {
  pending: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  running: '<path d="M12 3a9 9 0 1 0 9 9"/>',
  confirmed: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  refused: '<circle cx="12" cy="12" r="9"/><path d="M6 18L18 6"/>',
  failed: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17v1"/>',
  cancelled: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (r) => `${r.amount} ${r.currency || 'USDC'}`;

// The facts shown before the yes. The same list is what the digest covers.
export function facts(request, lang = 'en') {
  const C = COPY[lang], r = request, out = [[C.facts.to, r.to]];
  if (r.content) out.push([C.facts.content, r.content]);
  if (r.kind === 'pay') out.push([C.facts.amount, money(r)]);
  out.push([C.facts.cost, `${r.cost_credits ?? 0} ${C.credits}`]);
  out.push([C.facts.undo, r.reversible ? C.undoYes : C.undoNo]);
  return out;
}

export function statusPill(state, lang = 'en') {
  const role = state === 'failed' ? 'alert' : 'status';
  return `<span class="state state-${state}" role="${role}"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON[state]}</svg>${COPY[lang].state[state]}</span>`;
}

// One approval card for any state. Buttons carry data-event so a host page or app can wire them.
export function renderApproval(flow, lang = 'en', { id = flow.request.id } = {}) {
  const C = COPY[lang], r = flow.request, k = r.kind, s = flow.state;
  const d = C.detail[s];
  const detail = typeof d === 'string' ? d : d[k];
  const yes = k === 'pay' ? C.yes.pay(money(r)) : C.yes[k];
  let actions = '';
  if (s === 'pending') actions = `<div class="approval-actions"><button class="btn btn-primary" type="button" data-event="approve" data-digest="${flow.digest}">${esc(yes)}</button><button class="btn btn-secondary" type="button" data-event="refuse">${C.no[k]}</button></div>`;
  if (s === 'failed') actions = `<p class="small">${C.ask}</p><div class="approval-actions"><button class="btn btn-primary" type="button" data-event="retry">${C.retry}</button><button class="btn btn-secondary" type="button" data-event="cancel">${C.cancel}</button></div>`;
  if (s === 'confirmed' || s === 'refused' || s === 'cancelled') actions = `<div class="approval-actions"><a class="btn btn-ghost" href="chat.html">${C.done}</a></div>`;
  const extra = s === 'failed' && flow.error ? `<p class="error">${C.reason}: ${esc(flow.error)}</p>`
    : s === 'confirmed' && flow.receipt ? `<p class="small muted">${C.receipt}: <span dir="ltr">${esc(flow.receipt)}</span></p>`
    : (s === 'refused' || s === 'cancelled') && flow.reason ? `<p class="small muted">${C.reason}: ${esc(flow.reason)}</p>` : '';
  return `<section class="card approval" data-state="${s}" data-kind="${k}" aria-labelledby="${id}-t" aria-busy="${s === 'running'}">
  <div class="row"><span class="badge">${C.kind[k]}</span><span class="grow"></span>${statusPill(s, lang)}</div>
  <h3 class="h3" id="${id}-t">${C.head[k]}: ${esc(r.title)}</h3>
  <dl class="facts" aria-label="${C.facts.what}">${facts(r, lang).map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>
  <p class="small">${detail}</p>${extra}
  ${actions}
</section>`;
}

# Approval flow

The rule: Gok never sends, posts or pays anything until the user has seen exactly what will happen and said yes. This document is the contract for designers, developers and agents. The code is `prototype/approval.mjs` (no dependencies, browser and Node), the live page is `prototype/approval.html` (Arabic: `prototype/ar/approval.html`), and `test/approval.test.js` (B1 to B10) checks every rule below.

## States

| State | Meaning | What the user sees | Buttons | Tone token |
|---|---|---|---|---|
| `pending` | The citizen asked; nothing has happened | "Waiting for your yes", the facts, "Nothing happens until you choose." | Yes (names the action and amount), No | `--status-pending` |
| `running` | The user said yes; the action is in progress | "Working on it", `aria-busy="true"` | none | `--status-running` |
| `confirmed` | It happened | "Done", "Paid." and the receipt | Back to chat | `--status-confirmed` |
| `refused` | The user said no | "You said no", "Nothing was paid." | Back to chat | `--status-refused` |
| `failed` | The user said yes but it did not go through | "It did not go through", the reason, "No money moved." | Try again, Cancel | `--status-failed` |
| `cancelled` | Withdrawn by the citizen or the user, or expired, before it ran | "Cancelled", the reason, "Nothing was paid." | Back to chat | `--status-cancelled` |

Moves (anything else throws):

```
pending  --approve (user only, digest must match)--> running
pending  --refuse (user only)--> refused
pending  --cancel (user or citizen) / expire (system)--> cancelled
running  --succeed (system)--> confirmed
running  --fail (system)--> failed
failed   --retry (user or citizen)--> pending   (a new yes is needed)
failed   --cancel--> cancelled
```

## Rules

1. **Show before asking.** The card lists To, Content (send and post), Amount (pay), Cost in credits and whether it can be undone. The yes button repeats the verb and the amount: "Yes, pay 25 USDC", never just "OK".
2. **The yes is bound to what was shown.** `digest(request)` hashes the visible fields (kind, title, to, content, amount, currency, cost, reversible). `approve` must carry the digest that was on screen. If the citizen changes anything (`revise`), the request goes back to `pending` and the old yes no longer works.
3. **Only the user decides.** `approve` and `refuse` accept `by: 'user'` only. A citizen or the system cannot approve on the user's behalf.
4. **Nothing runs without a yes.** `execute(flow, executor)` throws unless the state is `running`, so refused, cancelled, expired and failed requests never reach the executor.
5. **No silent retries.** A failure shows its reason; retry goes back to `pending` and asks again.
6. **Say what did not happen.** Refused, failed and cancelled states say plainly that nothing was sent, posted or paid.
7. **Accessible.** The status pill has `role="status"` (an `aria-live` polite region); `failed` uses `role="alert"`. No button is preselected or autofocused, so Enter never approves by accident. Yes and No are both full size (48 px). Colour is never the only signal: every state has its own icon and words.
8. **Both directions.** All copy lives in `COPY.en` and `COPY.ar`; the card uses logical CSS only, so it works right to left. Addresses and receipts stay `dir="ltr"`.

## Tokens and components

* Status tones are tokens in `tokens/tokens.json` under `status`, each pointing at a colour token: pending to `warning`, running to `primary`, confirmed to `success`, refused and cancelled to `text-muted`, failed to `danger`. `tokens.css` exposes them as `--status-pending` and so on, so a theme change carries through. B8 checks each one reads at 4.5 to 1 on surface and bg in light and dark.
* Components in `prototype/app.css`: `.approval` (card with a status edge), `.state` and `.state-<name>` (pill), `.facts` (the what will happen list), `.approval-actions`. They reuse `.card`, `.btn`, `.badge` and the type, space and radius tokens.
* The landing page (`prototype/landing.html`) and the teaser (`prototype/teaser.html`) load the same `tokens.css` and `app.css` and show the same approval card and status pills as the app (B9).

## Using it from code

```js
import { createFlow, transition, execute, renderApproval } from './approval.mjs';

let flow = createFlow({ id: 'r1', kind: 'pay', title: 'Research brief', to: 'Lina, Base 0x8f2c...41d0', amount: '25', currency: 'USDC', cost_credits: 1, reversible: false });
el.innerHTML = renderApproval(flow, 'en');                  // pending card, buttons carry data-event
// on the user's click of the yes button (it carries data-digest):
flow = transition(flow, 'approve', { by: 'user', digest: button.dataset.digest });
flow = await execute(flow, (req) => wallet.pay(req));       // confirmed with a receipt, or failed with the reason
el.innerHTML = renderApproval(flow, 'en');
```

An agent that wants to act calls `createFlow` and waits; it only proceeds when the host app reports a `running` flow. Keep `flow.history` as the record (who did what, when) for the Transparency Covenant.

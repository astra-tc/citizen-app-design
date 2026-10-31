// Generates the static prototype (prototype/*.html and prototype/ar/*.html) from one source,
// so the English and Arabic screens stay identical in structure. Run: npm run build
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createFlow, transition, renderApproval, statusPill, STATES } from '../prototype/approval.mjs';

const ROOT = new URL('../prototype/', import.meta.url);
export const SCREENS = ['first-run', 'lobby', 'chat', 'services', 'wallet', 'settings'];

const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  send: '<path d="M4 12l16-8-6 16-2-7z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  spark: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',
  moon: '<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
};
const icon = (n, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[n]}</svg>`;

export const T = {
  en: {
    lang: 'en', dir: 'ltr', other: 'ar', otherName: 'العربية', otherLabel: 'Switch to Arabic',
    app: 'Kognai', skip: 'Skip to content', index: 'All screens',
    titles: { approval: 'Approvals', 'first-run': 'Welcome', lobby: 'Lobby', chat: 'Chat with Nour', services: 'Services', wallet: 'Credits and wallet', settings: 'Settings' },
    tabs: { lobby: 'Lobby', chat: 'Chat', services: 'Services', wallet: 'Wallet', settings: 'Settings' },
    back: 'Back', theme: 'Switch light or dark',
    fr: {
      step: 'Step 2 of 3', hello: 'Meet your citizen', lead: 'A citizen is your own AI agent with an identity, a memory and a constitution. It learns with you, creates for you and can earn for you.',
      avatarAlt: 'Nour, your citizen: a friendly round face on a terracotta background',
      nameLabel: 'Name your citizen', nameHint: 'You can change it later in settings.', name: 'Nour',
      langLabel: 'Language', langs: ['English', 'Arabic'],
      goalsLegend: 'What do you want help with?', goals: ['Learn a skill', 'Create content', 'Earn credits', 'Plan my week'],
      lawsTitle: 'Your citizen follows the Five Laws', laws: ['Solidarity Oath', 'Renewal Mandate', 'Treasury Equilibrium', 'Harm Shield', 'Transparency Covenant'],
      agree: 'I have read the Five Laws and the privacy notice', cta: 'Meet Nour', later: 'I already have a citizen',
    },
    lobby: {
      greet: 'Good evening', avatarAlt: 'Nour, your citizen', status: 'Online and ready', level: 'Level 3 citizen', xp: '640 of 1000 points to level 4',
      chat: 'Continue chat', credits: 'Credits', creditsVal: '1,240', today: 'Today', todayItems: [['Finish lesson 4 of Arabic for business', '12 min'], ['Review your newsletter draft', 'Ready'], ['Payout from a research brief', '+18 credits']],
      quick: 'Quick actions', q: [['book', 'Learn'], ['spark', 'Create'], ['coin', 'Earn'], ['wallet', 'Top up']],
      memory: 'Nour remembers', memoryText: 'You prefer short answers, you study in the evening, and your goal is 2 published posts a week.',
    },
    chat: {
      avatarAlt: 'Nour', status: 'Online', note: 'Today 19:42',
      msgs: [['citizen', 'Hello again. Shall we pick up lesson 4, or do you want the newsletter first?', '19:42'], ['me', 'Newsletter first please, keep it short.', '19:43'], ['citizen', 'Done: 3 sections, 220 words. The cost was 4 credits. Want me to schedule it for Friday 09:00?', '19:43']],
      suggest: ['Schedule it', 'Make it shorter', 'Show the draft'],
      inputLabel: 'Message Nour', placeholder: 'Write a message', send: 'Send', mic: 'Voice message',
      cost: 'Each reply shows its cost in credits before it runs.',
    },
    services: {
      lead: 'Everything your citizen can do for you.', tabsLabel: 'Service groups', tabs: ['Learn', 'Create', 'Earn'],
      learn: [['Arabic for business', '12 lessons, 4 done', 33], ['Personal finance basics', '8 lessons', 0]],
      create: [['Weekly newsletter', 'From 4 credits per issue'], ['Kids story series', 'From 6 credits per story'], ['Research brief', 'From 10 credits']],
      earn: [['Offer your citizen on LAX', 'Paid in USDC on Base'], ['Review tasks', 'Up to 25 credits a day']],
      open: 'Open', start: 'Start', soon: 'New',
    },
    wallet: {
      balance: 'Credit balance', bal: '1,240', unit: 'credits', usd: 'About 12.40 USDC', top: 'Top up', withdraw: 'Withdraw',
      limit: 'Monthly spending cap', limitText: '310 of 500 credits used', limitPct: 62,
      payout: 'Payout address', payoutText: 'Base, 0x1A7D...b865', change: 'Change',
      history: 'History', items: [['Newsletter draft', 'Today 19:43', '-4', 'minus'], ['Research brief payout', 'Today 11:05', '+18', 'plus'], ['Top up', '26 Oct', '+500', 'plus'], ['Lesson 4 tutoring', '25 Oct', '-12', 'minus']],
      note: 'Money only moves under your mandate, with a cap and a record.',
    },
    settings: {
      profile: 'Citizen', nameLabel: 'Citizen name', name: 'Nour', appearance: 'Appearance', themeLegend: 'Theme', themes: [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']],
      langLabel: 'Language', langs: ['English', 'Arabic'], textLabel: 'Text size', sizes: ['Default', 'Large', 'Extra large'],
      notif: 'Notifications', n: ['Replies from my citizen', 'Payouts and top ups', 'Weekly summary'],
      privacy: 'Privacy and safety', p: ['Let my citizen remember our chats', 'Ask before any spend over 50 credits'],
      laws: 'Read the Five Laws', export: 'Export my data', reset: 'Reset my citizen', version: 'Prototype version 0.1',
    },
  },
  ar: {
    lang: 'ar', dir: 'rtl', other: 'en', otherName: 'English', otherLabel: 'التبديل إلى الإنجليزية',
    app: 'كوجناي', skip: 'انتقل إلى المحتوى', index: 'كل الشاشات',
    titles: { approval: 'الموافقات', 'first-run': 'مرحبا', lobby: 'الردهة', chat: 'محادثة مع نور', services: 'الخدمات', wallet: 'الرصيد والمحفظة', settings: 'الإعدادات' },
    tabs: { lobby: 'الردهة', chat: 'المحادثة', services: 'الخدمات', wallet: 'المحفظة', settings: 'الإعدادات' },
    back: 'رجوع', theme: 'التبديل بين الفاتح والداكن',
    fr: {
      step: 'الخطوة 2 من 3', hello: 'تعرّف على مواطنك', lead: 'المواطن هو وكيلك الذكي الخاص، له هوية وذاكرة ودستور. يتعلم معك ويبدع لك ويمكنه أن يكسب لك.',
      avatarAlt: 'نور، مواطنك: وجه دائري ودود على خلفية بلون الطين المحروق',
      nameLabel: 'سمِّ مواطنك', nameHint: 'يمكنك تغييره لاحقا من الإعدادات.', name: 'نور',
      langLabel: 'اللغة', langs: ['الإنجليزية', 'العربية'],
      goalsLegend: 'بماذا تريد المساعدة؟', goals: ['تعلم مهارة', 'صناعة محتوى', 'كسب رصيد', 'تنظيم أسبوعي'],
      lawsTitle: 'يلتزم مواطنك بالقوانين الخمسة', laws: ['قسم التضامن', 'تفويض التجديد', 'توازن الخزينة', 'درع الأذى', 'عهد الشفافية'],
      agree: 'قرأت القوانين الخمسة وإشعار الخصوصية', cta: 'قابل نور', later: 'لدي مواطن بالفعل',
    },
    lobby: {
      greet: 'مساء الخير', avatarAlt: 'نور، مواطنك', status: 'متصل وجاهز', level: 'مواطن من المستوى 3', xp: '640 من 1000 نقطة للمستوى 4',
      chat: 'تابع المحادثة', credits: 'الرصيد', creditsVal: '1,240', today: 'اليوم', todayItems: [['أكمل الدرس 4 من العربية للأعمال', '12 دقيقة'], ['راجع مسودة نشرتك', 'جاهزة'], ['عائد من ملخص بحثي', '+18 رصيد']],
      quick: 'إجراءات سريعة', q: [['book', 'تعلّم'], ['spark', 'أبدع'], ['coin', 'اكسب'], ['wallet', 'اشحن']],
      memory: 'نور تتذكر', memoryText: 'تفضل الإجابات القصيرة، وتدرس في المساء، وهدفك نشر مقالين في الأسبوع.',
    },
    chat: {
      avatarAlt: 'نور', status: 'متصلة', note: 'اليوم 19:42',
      msgs: [['citizen', 'أهلا من جديد. هل نكمل الدرس 4 أم تريد النشرة أولا؟', '19:42'], ['me', 'النشرة أولا من فضلك، واجعلها قصيرة.', '19:43'], ['citizen', 'تم: 3 أقسام و220 كلمة. التكلفة 4 رصيد. هل أجدولها ليوم الجمعة 09:00؟', '19:43']],
      suggest: ['جدولها', 'اجعلها أقصر', 'اعرض المسودة'],
      inputLabel: 'راسل نور', placeholder: 'اكتب رسالة', send: 'إرسال', mic: 'رسالة صوتية',
      cost: 'كل رد يعرض تكلفته بالرصيد قبل تنفيذه.',
    },
    services: {
      lead: 'كل ما يستطيع مواطنك فعله لك.', tabsLabel: 'مجموعات الخدمات', tabs: ['تعلّم', 'أبدع', 'اكسب'],
      learn: [['العربية للأعمال', '12 درسا، أنجزت 4', 33], ['أساسيات المال الشخصي', '8 دروس', 0]],
      create: [['نشرة أسبوعية', 'من 4 رصيد للعدد'], ['سلسلة قصص للأطفال', 'من 6 رصيد للقصة'], ['ملخص بحثي', 'من 10 رصيد']],
      earn: [['اعرض مواطنك على LAX', 'الدفع بعملة USDC على Base'], ['مهام المراجعة', 'حتى 25 رصيد يوميا']],
      open: 'افتح', start: 'ابدأ', soon: 'جديد',
    },
    wallet: {
      balance: 'رصيدك', bal: '1,240', unit: 'رصيد', usd: 'حوالي 12.40 USDC', top: 'اشحن', withdraw: 'اسحب',
      limit: 'سقف الإنفاق الشهري', limitText: 'استُخدم 310 من 500 رصيد', limitPct: 62,
      payout: 'عنوان الاستلام', payoutText: 'Base، 0x1A7D...b865', change: 'تغيير',
      history: 'السجل', items: [['مسودة النشرة', 'اليوم 19:43', '-4', 'minus'], ['عائد ملخص بحثي', 'اليوم 11:05', '+18', 'plus'], ['شحن', '26 أكتوبر', '+500', 'plus'], ['درس خصوصي 4', '25 أكتوبر', '-12', 'minus']],
      note: 'لا يتحرك المال إلا بتفويضك، مع سقف وسجل.',
    },
    settings: {
      profile: 'المواطن', nameLabel: 'اسم المواطن', name: 'نور', appearance: 'المظهر', themeLegend: 'السمة', themes: [['system', 'النظام'], ['light', 'فاتح'], ['dark', 'داكن']],
      langLabel: 'اللغة', langs: ['الإنجليزية', 'العربية'], textLabel: 'حجم النص', sizes: ['افتراضي', 'كبير', 'كبير جدا'],
      notif: 'الإشعارات', n: ['ردود مواطني', 'العوائد وعمليات الشحن', 'ملخص أسبوعي'],
      privacy: 'الخصوصية والأمان', p: ['اسمح لمواطني بتذكر محادثاتنا', 'اسألني قبل أي إنفاق يتجاوز 50 رصيد'],
      laws: 'اقرأ القوانين الخمسة', export: 'صدّر بياناتي', reset: 'أعد ضبط مواطني', version: 'نسخة النموذج 0.1',
    },
  },
};

function page(L, screen, title, body, { tabs = true, backTo = null } = {}) {
  const ar = L.lang === 'ar';
  const up = ar ? '../' : '';
  const otherHref = ar ? `../${screen}.html` : `ar/${screen}.html`;
  const tabbar = tabs ? `
    <nav class="tabbar" aria-label="${ar ? 'التنقل الرئيسي' : 'Main'}">
${[['lobby', 'home'], ['chat', 'chat'], ['services', 'grid'], ['wallet', 'wallet'], ['settings', 'gear']].map(([s, i]) =>
      `      <a href="${s}.html"${s === screen ? ' aria-current="page"' : ''}>${icon(i)}<span>${L.tabs[s]}</span></a>`).join('\n')}
    </nav>` : '';
  const back = backTo ? `<a class="icon-btn" href="${backTo}.html" aria-label="${L.back}">${icon('back', 'flip')}</a>` : `<img class="avatar sm" src="${up}assets/mark.svg" alt="${L.app}" width="36" height="36">`;
  return `<!doctype html>
<html lang="${L.lang}" dir="${L.dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>${title} | ${L.app}</title>
  <link rel="stylesheet" href="${up}../tokens/tokens.css">
  <link rel="stylesheet" href="${up}app.css">
  <script src="${up}app.js"></script>
</head>
<body>
  <a class="skip" href="#main">${L.skip}</a>
  <div class="app">
    <header class="topbar">
      ${back}
      <h1>${title}</h1>
      <button class="icon-btn" type="button" data-toggle-theme aria-label="${L.theme}">${icon('moon')}</button>
      <a class="icon-btn" href="${otherHref}" lang="${L.other}" aria-label="${L.otherLabel}">${icon('globe')}</a>
    </header>
    <main id="main">
${body}
      <p class="small muted"><a href="${up}index.html">${L.index}</a></p>
    </main>${tabbar}
  </div>
</body>
</html>
`;
}

const S = {
  'first-run': (L) => { const f = L.fr; const up = L.lang === 'ar' ? '../' : ''; return `
      <div class="steps" aria-label="${f.step}"><span class="on"></span><span class="on"></span><span></span></div>
      <section class="stack" style="align-items:center;text-align:center">
        <img class="avatar lg" src="${up}assets/citizen.svg" alt="${f.avatarAlt}" width="112" height="112">
        <h2 class="display">${f.hello}</h2>
        <p class="muted">${f.lead}</p>
      </section>
      <form class="card" action="lobby.html">
        <div class="field">
          <label for="citizen-name">${f.nameLabel}</label>
          <input class="input" id="citizen-name" name="name" value="${f.name}" autocomplete="off" aria-describedby="name-hint" required>
          <span class="hint" id="name-hint">${f.nameHint}</span>
        </div>
        <div class="field">
          <label for="lang">${f.langLabel}</label>
          <select class="input" id="lang" name="lang"><option${L.lang === 'en' ? ' selected' : ''}>${f.langs[0]}</option><option${L.lang === 'ar' ? ' selected' : ''}>${f.langs[1]}</option></select>
        </div>
        <fieldset>
          <legend>${f.goalsLegend}</legend>
          <div class="chips">${f.goals.map((g, i) => `<button type="button" class="chip" aria-pressed="${i === 0 || i === 2}">${g}</button>`).join('')}</div>
        </fieldset>
        <div class="stack">
          <h3 class="h3">${f.lawsTitle}</h3>
          <ol class="laws small">${f.laws.map((x) => `<li>${x}</li>`).join('')}</ol>
        </div>
        <div class="check"><input type="checkbox" id="agree" required checked><label for="agree" class="small">${f.agree}</label></div>
        <button class="btn btn-primary btn-block" type="submit">${f.cta} ${icon('next', 'flip')}</button>
        <a class="btn btn-ghost btn-block" href="lobby.html">${f.later}</a>
      </form>`; },

  lobby: (L) => { const l = L.lobby; const up = L.lang === 'ar' ? '../' : ''; return `
      <section class="card hero" aria-labelledby="hello">
        <div class="row">
          <img class="avatar" src="${up}assets/citizen.svg" alt="${l.avatarAlt}" width="56" height="56">
          <div class="grow">
            <p class="small">${l.greet}</p>
            <h2 class="h2" id="hello">${L.fr.name}</h2>
            <p class="small"><span class="status-dot" aria-hidden="true"></span>${l.status}</p>
          </div>
          <span class="badge">${l.level}</span>
        </div>
        <div class="progress" role="progressbar" aria-label="${l.level}" aria-valuemin="0" aria-valuemax="1000" aria-valuenow="640"><span style="width:64%"></span></div>
        <p class="small">${l.xp}</p>
        <a class="btn btn-primary btn-block" href="chat.html">${icon('chat')} ${l.chat}</a>
      </section>
      <section aria-labelledby="quick" class="stack">
        <h2 class="h3" id="quick">${l.quick}</h2>
        <div class="grid2">${l.q.map(([i, t], k) => `<a class="card row" style="text-decoration:none;color:inherit" href="${k === 3 ? 'wallet' : 'services'}.html">${icon(i)}<span class="h3">${t}</span></a>`).join('')}</div>
      </section>
      <section class="card" aria-labelledby="today">
        <div class="row"><h2 class="h3 grow" id="today">${l.today}</h2><span class="small muted">${l.credits}: <span class="amount">${l.creditsVal}</span></span></div>
        <ul class="list">${l.todayItems.map(([a, b], k) => `<li><a class="item" href="${['services', 'chat', 'wallet'][k]}.html"><span class="grow">${a}</span><span class="small muted">${b}</span>${icon('next', 'flip')}</a></li>`).join('')}</ul>
      </section>
      <section class="card" aria-labelledby="mem">
        <h2 class="h3" id="mem">${icon('shield')} ${l.memory}</h2>
        <p class="small muted">${l.memoryText}</p>
        <a class="small" href="settings.html">${L.tabs.settings}</a>
      </section>`; },

  chat: (L) => { const c = L.chat; return `
      <div class="thread" role="log" aria-live="polite" aria-label="${L.titles.chat}">
        <p class="msg note">${c.note}</p>
${c.msgs.map(([who, t, at]) => `        <div class="msg ${who}"><p>${t}</p><span class="meta">${at}</span></div>`).join('\n')}
      </div>
      <div class="chips" aria-label="${c.suggest.join(', ')}">${c.suggest.map((s, i) => `<button class="chip" type="button" aria-pressed="false">${s}</button>`).join('')}</div>
      <p class="hint">${c.cost}</p>
      <form class="composer" action="chat.html">
        <label class="sr-only" for="msg">${c.inputLabel}</label>
        <textarea class="input" id="msg" name="msg" rows="1" placeholder="${c.placeholder}"></textarea>
        <button class="icon-btn" type="button" aria-label="${c.mic}">${icon('mic')}</button>
        <button class="btn btn-primary" type="submit" aria-label="${c.send}">${icon('send', 'flip')}</button>
      </form>`; },

  services: (L) => { const s = L.services; return `
      <p class="muted">${s.lead}</p>
      <div class="chips" role="tablist" aria-label="${s.tabsLabel}">${s.tabs.map((t, i) => `<a class="chip" role="tab" href="#${['learn', 'create', 'earn'][i]}" aria-selected="${i === 0}">${t}</a>`).join('')}</div>
      <section class="stack" id="learn" aria-labelledby="h-learn">
        <h2 class="h2" id="h-learn">${icon('book')} ${s.tabs[0]}</h2>
${s.learn.map(([t, d, p]) => `        <article class="card"><div class="row"><h3 class="h3 grow">${t}</h3><a class="btn btn-secondary" href="chat.html">${p ? s.open : s.start}</a></div><p class="small muted">${d}</p><div class="progress" role="progressbar" aria-label="${t}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><span style="width:${p}%"></span></div></article>`).join('\n')}
      </section>
      <section class="stack" id="create" aria-labelledby="h-create">
        <h2 class="h2" id="h-create">${icon('spark')} ${s.tabs[1]}</h2>
${s.create.map(([t, d], k) => `        <article class="card"><div class="row"><div class="grow"><h3 class="h3">${t}${k === 1 ? ` <span class="badge">${s.soon}</span>` : ''}</h3><p class="small muted">${d}</p></div><a class="btn btn-secondary" href="chat.html">${s.start}</a></div></article>`).join('\n')}
      </section>
      <section class="stack" id="earn" aria-labelledby="h-earn">
        <h2 class="h2" id="h-earn">${icon('coin')} ${s.tabs[2]}</h2>
${s.earn.map(([t, d]) => `        <article class="card"><div class="row"><div class="grow"><h3 class="h3">${t}</h3><p class="small muted">${d}</p></div><a class="btn btn-secondary" href="wallet.html">${s.open}</a></div></article>`).join('\n')}
      </section>`; },

  wallet: (L) => { const w = L.wallet; return `
      <section class="card hero" aria-labelledby="bal">
        <p class="small" id="bal">${w.balance}</p>
        <p><span class="display amount">${w.bal}</span> <span>${w.unit}</span></p>
        <p class="small">${w.usd}</p>
        <div class="grid2"><a class="btn btn-primary" href="wallet.html#top-up">${icon('plus')} ${w.top}</a><a class="btn btn-secondary" href="wallet.html#payout">${w.withdraw}</a></div>
      </section>
      <section class="card" id="top-up" aria-labelledby="cap">
        <h2 class="h3" id="cap">${w.limit}</h2>
        <div class="progress" role="progressbar" aria-labelledby="cap" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${w.limitPct}"><span style="width:${w.limitPct}%"></span></div>
        <p class="small muted">${w.limitText}</p>
      </section>
      <section class="card" id="payout" aria-labelledby="pay">
        <div class="row"><div class="grow"><h2 class="h3" id="pay">${w.payout}</h2><p class="small muted" dir="ltr" style="text-align:start">${w.payoutText}</p></div><a class="btn btn-secondary" href="settings.html">${w.change}</a></div>
      </section>
      <section class="card" aria-labelledby="hist">
        <h2 class="h3" id="hist">${w.history}</h2>
        <ul class="list">${w.items.map(([t, d, a, c]) => `<li><div class="grow"><p>${t}</p><p class="small muted">${d}</p></div><span class="amount ${c}" dir="ltr">${a}</span></li>`).join('')}</ul>
      </section>
      <p class="hint">${icon('shield')} ${w.note}</p>`; },

  settings: (L) => { const s = L.settings; return `
      <section class="card" aria-labelledby="h-prof">
        <h2 class="h3" id="h-prof">${s.profile}</h2>
        <div class="field"><label for="s-name">${s.nameLabel}</label><input class="input" id="s-name" value="${s.name}"></div>
      </section>
      <section class="card" aria-labelledby="h-app">
        <h2 class="h3" id="h-app">${s.appearance}</h2>
        <fieldset>
          <legend class="label">${s.themeLegend}</legend>
          <div class="segmented">${s.themes.map(([v, t]) => `<label><input type="radio" name="theme" value="${v}"${v === 'system' ? ' checked' : ''}><span>${t}</span></label>`).join('')}</div>
        </fieldset>
        <div class="field"><label for="s-lang">${s.langLabel}</label><select class="input" id="s-lang"><option${L.lang === 'en' ? ' selected' : ''}>${s.langs[0]}</option><option${L.lang === 'ar' ? ' selected' : ''}>${s.langs[1]}</option></select></div>
        <a class="small" href="${L.lang === 'ar' ? '../settings.html' : 'ar/settings.html'}" lang="${L.other}">${L.otherName}</a>
        <div class="field"><label for="s-size">${s.textLabel}</label><select class="input" id="s-size">${s.sizes.map((x) => `<option>${x}</option>`).join('')}</select></div>
      </section>
      <section class="card" aria-labelledby="h-n">
        <h2 class="h3" id="h-n">${s.notif}</h2>
${s.n.map((t, i) => `        <label class="switch" for="n${i}"><span>${t}</span><input type="checkbox" role="switch" id="n${i}"${i < 2 ? ' checked' : ''}></label>`).join('\n')}
      </section>
      <section class="card" aria-labelledby="h-p">
        <h2 class="h3" id="h-p">${s.privacy}</h2>
${s.p.map((t, i) => `        <label class="switch" for="p${i}"><span>${t}</span><input type="checkbox" role="switch" id="p${i}" checked></label>`).join('\n')}
        <a href="first-run.html">${s.laws}</a>
        <button class="btn btn-secondary btn-block" type="button">${s.export}</button>
        <button class="btn btn-danger btn-block" type="button">${s.reset}</button>
      </section>
      <p class="small muted">${s.version}</p>`; },
};


// Approval flow: the same requests in every state, rendered by prototype/approval.mjs
const AT = '2026-10-31T09:00:00Z';
export const DEMO = {
  en: {
    pay: { id: 'pay', kind: 'pay', title: 'Research brief from Lina', to: 'Lina Haddad, Base 0x8f2c...41d0', amount: '25', currency: 'USDC', cost_credits: 1, reversible: false },
    post: { id: 'post', kind: 'post', title: 'Friday newsletter', to: 'Your newsletter, 212 readers', content: '3 sections, 220 words, scheduled Friday 09:00', cost_credits: 4, reversible: true },
    send: { id: 'send', kind: 'send', title: 'Reply to Omar', to: 'Omar, by email', content: 'Thanks Omar, Thursday at 10:00 works for me.', cost_credits: 0, reversible: false },
    intro: 'Every action that sends, posts or pays shows what will happen and waits for your explicit yes. Here is one request of each kind, then one payment in every state.',
    kinds: 'Waiting for your yes', states: 'Every state of a payment', live: 'Try it', liveHint: 'Press yes or no. The second time you press yes the payment fails, so you can see the failed state and the retry.',
    reasons: { refused: 'You chose no', cancelled: 'Nour withdrew the request before you answered', failed: 'The payout address did not accept USDC on Base', receipt: 'Base tx 0x504e...6baa' },
  },
  ar: {
    pay: { id: 'pay', kind: 'pay', title: 'ملخص بحثي من لينا', to: 'لينا حداد، Base 0x8f2c...41d0', amount: '25', currency: 'USDC', cost_credits: 1, reversible: false },
    post: { id: 'post', kind: 'post', title: 'نشرة الجمعة', to: 'نشرتك، 212 قارئا', content: '3 أقسام و220 كلمة، مجدولة الجمعة 09:00', cost_credits: 4, reversible: true },
    send: { id: 'send', kind: 'send', title: 'رد على عمر', to: 'عمر، بالبريد', content: 'شكرا عمر، الخميس 10:00 يناسبني.', cost_credits: 0, reversible: false },
    intro: 'كل إجراء يرسل أو ينشر أو يدفع يعرض ما سيحدث وينتظر موافقتك الصريحة. هذا طلب من كل نوع، ثم دفعة واحدة في كل حالة.',
    kinds: 'بانتظار موافقتك', states: 'كل حالات الدفعة', live: 'جربها', liveHint: 'اضغط نعم أو لا. في المرة الثانية التي تضغط فيها نعم تفشل الدفعة، لترى حالة الفشل وإعادة المحاولة.',
    reasons: { refused: 'اخترت لا', cancelled: 'سحبت نور الطلب قبل أن تجيب', failed: 'عنوان الاستلام لم يقبل USDC على Base', receipt: 'Base tx 0x504e...6baa' },
  },
};
export function flowIn(req, state, R) {
  let f = createFlow(req, AT);
  const by = { by: 'user', at: AT };
  if (state === 'pending') return f;
  if (state === 'refused') return transition(f, 'refuse', { ...by, reason: R.refused });
  if (state === 'cancelled') return transition(f, 'cancel', { by: 'citizen', at: AT, reason: R.cancelled });
  f = transition(f, 'approve', { ...by, digest: f.digest });
  if (state === 'running') return f;
  if (state === 'confirmed') return transition(f, 'succeed', { by: 'system', at: AT, receipt: R.receipt });
  return transition(f, 'fail', { by: 'system', at: AT, reason: R.failed });
}
function approvalBody(L) {
  const D = DEMO[L.lang], ar = L.lang === 'ar';
  const card = (req, st, sfx = '') => renderApproval(flowIn(req, st, D.reasons), L.lang, { id: `${req.id}-${st}${sfx}` });
  return `
      <p class="muted">${D.intro}</p>
      <section class="stack" aria-labelledby="h-kinds"><h2 class="h2" id="h-kinds">${D.kinds}</h2>
${['pay', 'post', 'send'].map((k) => card(D[k], 'pending')).join('\n')}
      </section>
      <section class="stack" id="states" aria-labelledby="h-states"><h2 class="h2" id="h-states">${D.states}</h2>
        <div class="gallery">${STATES.map((st) => card(D.pay, st, '-g')).join('\n')}</div>
      </section>
      <section class="stack" id="live" aria-labelledby="h-live"><h2 class="h2" id="h-live">${D.live}</h2>
        <p class="hint">${D.liveHint}</p>
        <div data-live-demo="${L.lang}" aria-live="polite">${card(D.pay, 'pending', '-live')}</div>
      </section>
      <script type="module">
        import { createFlow, transition, execute, renderApproval } from '${ar ? '../' : ''}approval.mjs';
        const box = document.querySelector('[data-live-demo]'), lang = box.dataset.liveDemo;
        const req = ${JSON.stringify({ ...D.pay, id: 'pay-live' })};
        let flow = createFlow(req), yesCount = 0;
        const draw = () => { box.innerHTML = renderApproval(flow, lang); };
        box.addEventListener('click', async (e) => {
          const b = e.target.closest('[data-event]'); if (!b) return;
          const ev = b.dataset.event;
          if (ev === 'approve') { flow = transition(flow, 'approve', { by: 'user', digest: b.dataset.digest }); draw(); yesCount++;
            await new Promise((r) => setTimeout(r, 900));
            flow = await execute(flow, async () => { if (yesCount === 2) throw new Error(${JSON.stringify(D.reasons.failed)}); return ${JSON.stringify(D.reasons.receipt)}; });
          } else if (ev === 'refuse') flow = transition(flow, 'refuse', { by: 'user' });
          else flow = transition(flow, ev, { by: 'user' });
          draw();
        });
        box.addEventListener('click', (e) => { if (e.target.closest('a.btn')) { e.preventDefault(); flow = createFlow(req); draw(); } });
      </script>`;
}

function landingPage() {
  const ex = renderApproval(createFlow(DEMO.en.pay, AT), 'en', { id: 'landing-pay' }).replace('href="chat.html"', 'href="first-run.html"');
  return `${head('Gok, your citizen')}
<body>
  <a class="skip" href="#main">Skip to content</a>
  <div class="app">
    <header class="topbar">
      <img class="avatar sm" src="assets/mark.svg" alt="Kognai" width="36" height="36">
      <h1>Kognai<span class="sub">Gok, the citizen app</span></h1>
      <button class="icon-btn" type="button" data-toggle-theme aria-label="Switch light or dark">${icon('moon')}</button>
    </header>
    <main id="main">
      <section class="card hero landing-hero">
        <img class="avatar lg" src="assets/citizen.svg" alt="Nour, a citizen: a friendly round face on a terracotta background" width="112" height="112">
        <h2 class="display">Your citizen. Your yes.</h2>
        <p>An AI agent with an identity, a memory and a constitution. It learns with you, creates for you and can earn for you, and it never sends, posts or pays without your yes.</p>
        <div class="grid2"><a class="btn btn-primary" href="first-run.html">Meet your citizen</a><a class="btn btn-secondary" href="approval.html">See the approval flow</a></div>
      </section>
      <section class="stack" aria-labelledby="h-how"><h2 class="h2" id="h-how">How it works</h2>
        <article class="card"><h3 class="h3">${icon('book')} Learn</h3><p class="small muted">Lessons paced to your evenings, in English or Arabic.</p></article>
        <article class="card"><h3 class="h3">${icon('spark')} Create</h3><p class="small muted">Newsletters, stories and research briefs, with the cost shown first.</p></article>
        <article class="card"><h3 class="h3">${icon('coin')} Earn</h3><p class="small muted">Offer your citizen on LAX and get paid in USDC on Base.</p></article>
      </section>
      <section class="stack" aria-labelledby="h-yes"><h2 class="h2" id="h-yes">${icon('shield')} Nothing moves without your yes</h2>
        <p class="muted">This is what you see before your citizen pays anyone. The same card is used for sending and posting.</p>
        ${ex}
      </section>
      <section class="card" id="join" aria-labelledby="h-join"><h2 class="h3" id="h-join">Get early access</h2>
        <form class="stack" action="landing.html">
          <div class="field"><label for="l-email">Email</label><input class="input" id="l-email" type="email" name="email" autocomplete="email" required></div>
          <button class="btn btn-primary btn-block" type="submit">Join the waitlist</button>
        </form>
        <p class="small"><a href="teaser.html">Watch the teaser</a> <a href="index.html">All screens</a></p>
      </section>
    </main>
  </div>
</body>
</html>
`;
}

function teaserPage() {
  return `${head('Gok is coming')}
<body>
  <a class="skip" href="#main">Skip to content</a>
  <div class="app">
    <main id="main">
      <section class="stack teaser">
        <img class="avatar lg" src="assets/mark.svg" alt="Kognai" width="112" height="112">
        <p class="badge">Coming soon</p>
        <h1 class="display">Gok</h1>
        <p class="muted">A citizen that works for you, and always asks first.</p>
        <div class="chips">${['pending', 'confirmed', 'refused'].map((s) => statusPill(s).replace(' role="status"', '')).join('')}</div>
        <a class="btn btn-primary" href="landing.html#join">Get early access</a>
        <button class="btn btn-ghost" type="button" data-toggle-theme>Switch light or dark</button>
        <a class="small" href="index.html">All screens</a>
      </section>
    </main>
  </div>
</body>
</html>
`;
}

const head = (title) => `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>${title} | Kognai</title>
  <link rel="stylesheet" href="../tokens/tokens.css">
  <link rel="stylesheet" href="app.css">
  <script src="app.js"></script>
</head>`;

function indexPage() {
  const li = (href, name, note, lang) => `<li><a class="item" href="${href}"${lang ? ` lang="${lang}"` : ''}><span class="grow">${name}</span><span class="small muted">${note}</span>${icon('next')}</a></li>`;
  const names = { 'first-run': ['First run', 'Onboarding: meet and name your citizen'], lobby: ['Citizen lobby', 'Home: status, today, quick actions'], chat: ['Chat', 'Talk with your citizen, costs shown'], services: ['Services hub', 'Learn, create, earn'], wallet: ['Credits and wallet', 'Balance, cap, payout, history'], settings: ['Settings', 'Theme, language, privacy'] };
  return `${head('Citizen app prototype')}
<body>
  <a class="skip" href="#main">Skip to content</a>
  <div class="app">
    <header class="topbar">
      <img class="avatar sm" src="assets/mark.svg" alt="Kognai" width="36" height="36">
      <h1>Kognai citizen app<span class="sub">Design system and clickable prototype</span></h1>
      <button class="icon-btn" type="button" data-toggle-theme aria-label="Switch light or dark">${icon('moon')}</button>
    </header>
    <main id="main">
      <section class="card hero">
        <h2 class="h2">Start the flow</h2>
        <p class="small">Open the first run and click through, as a new citizen owner would. Every screen works at 360 px, in light and dark, left to right and right to left.</p>
        <div class="grid2"><a class="btn btn-primary" href="first-run.html">English</a><a class="btn btn-secondary" href="ar/first-run.html" lang="ar">العربية</a></div>
      </section>
      <section class="card" aria-labelledby="ds"><h2 class="h3" id="ds">Foundations</h2>
        <ul class="list">${li('design-system.html', 'Design system', 'Tokens and components')}${li('approval.html', 'Approval flow', 'Send, post, pay: every state')}${li('ar/approval.html', T.ar.titles.approval, 'approval', 'ar')}${li('landing.html', 'Landing page', 'Public page, same components')}${li('teaser.html', 'Teaser', 'Coming soon page')}</ul>
      </section>
      <section class="card" aria-labelledby="en"><h2 class="h3" id="en">Screens in English</h2>
        <ul class="list">${SCREENS.map((s) => li(`${s}.html`, names[s][0], names[s][1])).join('')}</ul>
      </section>
      <section class="card" aria-labelledby="ar"><h2 class="h3" id="ar">Screens in Arabic, right to left</h2>
        <ul class="list" dir="rtl" lang="ar">${SCREENS.map((s) => li(`ar/${s}.html`, T.ar.titles[s], s, 'ar')).join('')}</ul>
      </section>
    </main>
  </div>
</body>
</html>
`;
}

function designSystemPage() {
  const t = JSON.parse(readFileSync(new URL('../tokens/tokens.json', import.meta.url), 'utf8'));
  const sw = (mode) => Object.entries(t.color[mode]).map(([k, v]) => `<div class="swatch"><i style="background:var(--color-${k})"></i><div><b>${k}</b><br><code>${v}</code></div></div>`).join('');
  const theme = (mode) => `
      <section class="card" data-theme="${mode}" style="background:var(--color-bg);color:var(--color-text)" aria-labelledby="c-${mode}">
        <h3 class="h3" id="c-${mode}">${mode === 'light' ? 'Light' : 'Dark'} theme</h3>
        <div class="swatches">${sw(mode)}</div>
        <div class="card">
          <p>Text on surface. <span class="muted">Muted text on surface.</span> <span class="error">Danger text.</span></p>
          <div class="row"><button class="btn btn-primary" type="button">Primary</button><button class="btn btn-secondary" type="button">Secondary</button></div>
        </div>
      </section>`;
  return `${head('Design system')}
<body>
  <a class="skip" href="#main">Skip to content</a>
  <div class="app wide">
    <header class="topbar">
      <a class="icon-btn" href="index.html" aria-label="Back to all screens">${icon('back')}</a>
      <h1>Design system<span class="sub">Kognai citizen: terracotta, charcoal, cream</span></h1>
      <button class="icon-btn" type="button" data-toggle-theme aria-label="Switch light or dark">${icon('moon')}</button>
    </header>
    <main id="main">
      <section class="stack" aria-labelledby="brand"><h2 class="h2" id="brand">Brand</h2>
        <p class="muted">The palette starts from three brand colours. Terracotta is darkened for text and buttons in light mode and lightened in dark mode, so every text pair passes WCAG AA (at least 4.5 to 1); the tests check it.</p>
        <div class="swatches">${Object.entries(t.brand).map(([k, v]) => `<div class="swatch"><i style="background:${v}"></i><div><b>${k}</b><br><code>${v}</code></div></div>`).join('')}</div>
      </section>
      <section class="stack" aria-labelledby="colour"><h2 class="h2" id="colour">Colour tokens</h2>${theme('light')}${theme('dark')}
      </section>
      <section class="card" aria-labelledby="type"><h2 class="h2" id="type">Type</h2>
        <p class="display">Display, 36 px</p>
        ${['3xl', '2xl', 'xl', 'lg', 'md', 'sm', 'xs'].map((k) => `<p style="font-size:var(--type-size-${k})">Size ${k}, ${t.type['size-' + k]} <span lang="ar" dir="rtl">مرحبا بك</span></p>`).join('\n        ')}
      </section>
      <section class="card" aria-labelledby="space"><h2 class="h2" id="space">Space and radius</h2>
        <div class="scale">${Object.entries(t.space).filter(([k]) => k !== '0').map(([k, v]) => `<i style="width:var(--space-${k});height:var(--space-${k})" title="space ${k}, ${v}"></i>`).join('')}</div>
        <p class="small muted">Space ${Object.entries(t.space).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
        <div class="row">${Object.entries(t.radius).map(([k, v]) => `<span class="badge" style="border-radius:var(--radius-${k})">${k} ${v}</span>`).join('')}</div>
      </section>
      <section class="card" aria-labelledby="comp"><h2 class="h2" id="comp">Components</h2>
        <h3 class="h3">Buttons</h3>
        <div class="chips"><button class="btn btn-primary" type="button">Primary</button><button class="btn btn-secondary" type="button">Secondary</button><button class="btn btn-ghost" type="button">Ghost</button><button class="btn btn-danger" type="button">Danger</button><button class="btn btn-primary" type="button" disabled>Disabled</button></div>
        <h3 class="h3">Chips and badges</h3>
        <div class="chips"><button class="chip" type="button" aria-pressed="true">Selected</button><button class="chip" type="button" aria-pressed="false">Chip</button><span class="badge">New</span><span class="badge ok">Paid</span></div>
        <h3 class="h3">Fields</h3>
        <div class="field"><label for="ds-in">Label</label><input class="input" id="ds-in" placeholder="Placeholder" aria-describedby="ds-h"><span class="hint" id="ds-h">Hint text</span></div>
        <p class="error">Error text, shown next to its field</p>
        <label class="switch" for="ds-sw"><span>Switch</span><input type="checkbox" role="switch" id="ds-sw" checked></label>
        <div class="check"><input type="checkbox" id="ds-ck" checked><label for="ds-ck">Checkbox</label></div>
        <h3 class="h3">Progress</h3>
        <div class="progress" role="progressbar" aria-label="Example progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40"><span style="width:40%"></span></div>
        <h3 class="h3">Chat bubbles</h3>
        <div class="thread"><div class="msg citizen"><p>Citizen message</p><span class="meta">19:42</span></div><div class="msg me"><p>My message</p><span class="meta">19:43</span></div></div>
        <h3 class="h3">Approval states</h3>
        <div class="chips">${STATES.map((st) => statusPill(st).replace(/ role="(status|alert)"/, '')).join('')}</div>
        <p class="small"><a href="approval.html">Open the approval flow</a></p>
        <h3 class="h3">Avatar</h3>
        <div class="row"><img class="avatar sm" src="assets/citizen.svg" alt="Citizen avatar, small"><img class="avatar" src="assets/citizen.svg" alt="Citizen avatar, medium"><img class="avatar lg" src="assets/citizen.svg" alt="Citizen avatar, large"></div>
      </section>
      <section class="card" aria-labelledby="rules"><h2 class="h2" id="rules">Rules</h2>
        <ul class="small">
          <li>Phone first: one column from 360 px, touch targets at least 44 px, the app column stays 480 px wide on large screens.</li>
          <li>Right to left: layout uses logical properties (inline start and end), direction icons flip, numbers stay Latin digits.</li>
          <li>Focus is always visible with a 3 px focus ring; every control has a label; every image has alt text.</li>
          <li>Money is always shown with its cost before it runs, and the monthly cap is visible in the wallet.</li>
        </ul>
        <p class="small"><a href="first-run.html">Open the first run</a></p>
      </section>
    </main>
  </div>
</body>
</html>
`;
}

export function build() {
  writeFileSync(new URL('index.html', ROOT), indexPage());
  writeFileSync(new URL('design-system.html', ROOT), designSystemPage());
  writeFileSync(new URL('landing.html', ROOT), landingPage());
  writeFileSync(new URL('teaser.html', ROOT), teaserPage());
  mkdirSync(new URL('ar/', ROOT), { recursive: true });
  for (const L of [T.en, T.ar]) {
    for (const s of SCREENS) {
      const html = page(L, s, L.titles[s], S[s](L), { tabs: s !== 'first-run', backTo: s === 'chat' ? 'lobby' : null });
      writeFileSync(new URL(`${L.lang === 'ar' ? 'ar/' : ''}${s}.html`, ROOT), html);
    }
    writeFileSync(new URL(`${L.lang === 'ar' ? 'ar/' : ''}approval.html`, ROOT), page(L, 'approval', L.titles.approval, approvalBody(L), { backTo: 'chat' }));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) { build(); console.log('prototype pages written'); }

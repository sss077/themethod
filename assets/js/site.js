/* Главная страница: собирает секции из базы в нужном порядке. */
(function () {
  'use strict';
  const { sb, ui, tr, esc, hl, rich, q, ICONS, ICON_TG, ICON_WA, SIGN_U } = App;
  const app = document.getElementById('app');

  const head = (sec, extra) =>
    '<div class="sec-head rv">' + (extra || '') + '<h2 class="h-lg">' + hl(tr(sec, 'title')) + '</h2>' +
    (tr(sec, 'subtitle') ? '<p class="sec-sub">' + hl(tr(sec, 'subtitle')) + '</p>' : '') + '</div>';

  /* ---------------- секции ---------------- */
  const R = {};

  R.hero = (sec, d) => {
    const s = d.settings;
    const counters = (s.counters || []).filter((c) => c && c.value).map((c) =>
      '<div class="counter"><b data-count="' + esc(c.value) + '">' + esc(c.value) + '</b><span>' + esc(tr(c, 'label')) + '</span></div>').join('');
    const formOn = d.sections.some((x) => x.key === 'form' && x.enabled);
    const casesOn = d.sections.some((x) => x.key === 'cases' && x.enabled) && d.cases.length;
    return '<section id="hero" class="hero">' +
      '<div class="hero-bg" aria-hidden="true"><div class="road-lines"></div><div class="hero-slab"></div></div>' +
      '<div class="container hero-in">' +
        '<div class="hero-copy">' +
          (tr(s, 'hero_badge') ? '<div class="badge rv"><span class="pulse"></span>' + esc(tr(s, 'hero_badge')) + '</div>' : '') +
          '<h1 class="h-xl rv">' + hl(tr(sec, 'title')) + '</h1>' +
          (tr(sec, 'subtitle') ? '<p class="lead rv">' + hl(tr(sec, 'subtitle')) + '</p>' : '') +
          '<div class="btns rv">' +
            (formOn ? '<a class="btn btn-primary btn-lg" href="#form">' + esc(tr(s, 'hero_button') || ui('cta')) + '<span class="arr">→</span></a>' : '') +
            (casesOn && tr(s, 'hero_button2') ? '<a class="btn btn-ghost btn-lg" href="#cases">' + esc(tr(s, 'hero_button2')) + '</a>' : '') +
          '</div>' +
        '</div>' +
        '<div class="hero-sign rv" aria-hidden="true">' + SIGN_U + '</div>' +
      '</div>' +
      (counters ? '<div class="container"><div class="counters rv">' + counters + '</div></div>' : '') +
    '</section>';
  };

  R.pains = (sec, d) => {
    if (!d.pains.length) return '';
    return '<section id="pains" class="sec glow-tl"><div class="container">' + head(sec) +
      '<div class="grid g2">' + d.pains.map((p, i) =>
        '<article class="card pain rv"><span class="pain-n">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="pain-x" aria-hidden="true">✕</span>' +
        '<h3 class="h-sm">' + hl(tr(p, 'title')) + '</h3><p class="muted">' + hl(tr(p, 'text')) + '</p></article>').join('') +
      '</div></div></section>';
  };

  R.offer = (sec, d) => {
    const s = d.settings;
    const cur = esc(s.offer_currency || '$');
    const points = String(tr(s, 'offer_points') || '').split('\n').filter((x) => x.trim());
    const formOn = d.sections.some((x) => x.key === 'form' && x.enabled);
    const price = (v) => (/^\d/.test(String(v)) ? cur + esc(v) : esc(v));
    return '<section id="offer" class="sec offer-sec"><div class="offer-slant" aria-hidden="true"></div><div class="container">' +
      '<div class="offer rv">' +
        '<div class="offer-main">' +
          (tr(s, 'offer_badge') ? '<span class="badge badge-dark">' + esc(tr(s, 'offer_badge')) + '</span>' : '') +
          '<h2 class="h-lg">' + hl(tr(sec, 'title')) + '</h2>' +
          (tr(sec, 'subtitle') ? '<p class="sec-sub">' + hl(tr(sec, 'subtitle')) + '</p>' : '') +
          '<div class="price">' +
            (s.offer_price_old ? '<span class="price-old" aria-label="' + esc(ui('old_price')) + '"><s>' + price(s.offer_price_old) + '</s></span>' : '') +
            (s.offer_price_new ? '<span class="price-new">' + price(s.offer_price_new) + '</span>' : '') +
            (tr(s, 'offer_period') ? '<span class="price-period">' + esc(tr(s, 'offer_period')) + '</span>' : '') +
          '</div>' +
          (points.length ? '<ul class="tri">' + points.map((p) => '<li>' + hl(p.replace(/^\s*[-•▲]\s*/, '')) + '</li>').join('') + '</ul>' : '') +
        '</div>' +
        '<div class="guarantee">' +
          '<div class="g-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg></div>' +
          '<span class="g-title">' + esc(tr(s, 'offer_guarantee_title')) + '</span>' +
          '<p class="g-text">' + hl(tr(s, 'offer_guarantee')) + '</p>' +
          (tr(s, 'offer_note') ? '<p class="g-note">' + hl(tr(s, 'offer_note')) + '</p>' : '') +
          (formOn ? '<a class="btn btn-light btn-lg" href="#form">' + esc(tr(s, 'offer_button') || ui('cta')) + '<span class="arr">→</span></a>' : '') +
        '</div>' +
      '</div></div></section>';
  };

  R.services = (sec, d) => {
    if (!d.services.length) return '';
    return '<section id="services" class="sec glow-tr"><div class="container">' + head(sec) +
      '<div class="grid g3">' + d.services.map((x) =>
        '<article class="card service rv"><div class="ico">' + (ICONS[x.icon] || ICONS.target) + '</div>' +
        '<h3 class="h-sm">' + hl(tr(x, 'title')) + '</h3><p class="muted">' + hl(tr(x, 'text')) + '</p></article>').join('') +
      '</div></div></section>';
  };

  R.cases = (sec, d) => {
    const body = d.cases.length
      ? '<div class="grid g3 cases-grid">' + d.cases.map(App.caseCard).join('') + '</div>'
      : '<p class="muted rv">' + esc(ui('cases_empty')) + '</p>';
    return '<section id="cases" class="sec sec-alt glow-bl"><div class="container">' + head(sec) + body + '</div></section>';
  };

  R.process = (sec, d) => {
    if (!d.steps.length) return '';
    return '<section id="process" class="sec"><div class="container">' + head(sec) +
      '<ol class="steps">' + d.steps.map((x, i) =>
        '<li class="step rv"><span class="step-n">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<h3 class="h-sm">' + hl(tr(x, 'title')) + '</h3><p class="muted">' + hl(tr(x, 'text')) + '</p></li>').join('') +
      '</ol></div></section>';
  };

  R.team = (sec, d) => {
    if (!d.team.length) return '';
    return '<section id="team" class="sec sec-alt glow-tr"><div class="container">' + head(sec) +
      '<div class="grid g3 team-grid">' + d.team.map((m) => {
        const name = tr(m, 'name');
        const initials = name.replace(/\[.*?\]/g, '').trim().split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase() || '•';
        const photo = App.safeImg(m.photo_url)
          ? '<img src="' + esc(m.photo_url) + '" alt="' + esc(name) + '" loading="lazy">'
          : '<span class="initials">' + esc(initials) + '</span>';
        return '<article class="card member rv"><div class="member-ph">' + photo + '</div>' +
          '<div class="member-info"><h3 class="h-sm">' + esc(name) + '</h3><span class="member-role">' + esc(tr(m, 'role')) + '</span>' +
          (tr(m, 'bio') ? '<p class="muted">' + hl(tr(m, 'bio')) + '</p>' : '') + '</div></article>';
      }).join('') + '</div></div></section>';
  };

  R.faq = (sec, d) => {
    if (!d.faq.length) return '';
    return '<section id="faq" class="sec glow-bl"><div class="container narrow">' + head(sec) +
      '<div class="faq">' + d.faq.map((x) =>
        '<details class="faq-item rv"><summary><span>' + esc(tr(x, 'question')) + '</span><i aria-hidden="true"></i></summary>' +
        '<div class="faq-a">' + rich(tr(x, 'answer')) + '</div></details>').join('') +
      '</div></div></section>';
  };

  /* Варианты ответов в форме: value — как сохраняется в базе, ru/uz — как показывается */
  const OPTS = {
    city: [['Ташкент', ui('city_tashkent')], ['Другой', ui('city_other')]],
    branches: [['1', '1'], ['2–3', '2–3'], ['4+', '4+']],
    students: [['до 20', ui('students_1')], ['20–50', '20–50'], ['50+', '50+']],
    budget: [['до $300', App.lang === 'uz' ? '$300 gacha' : 'до $300'], ['$300–700', '$300–700'], ['$700+', '$700+'], ['не знаю', ui('budget_unknown')]],
  };
  const chips = (name, label) =>
    '<fieldset class="field chips-f" data-field="' + name + '"><legend>' + esc(label) + ' <i>*</i></legend><div class="chips">' +
    OPTS[name].map(([v, l], i) => '<label class="chip"><input type="radio" name="' + name + '" value="' + esc(v) + '"' + (i === 0 && name === 'city' ? ' checked' : '') +
      '><span>' + esc(l) + '</span></label>').join('') + '</div><small class="err"></small></fieldset>';

  const contactsRow = (s) => {
    const b = [];
    if (App.tgUser(s.telegram)) b.push('<a class="btn btn-ghost btn-sm" href="' + esc(App.tgLink(s.telegram)) + '" target="_blank" rel="noopener">' + ICON_TG + 'Telegram</a>');
    if (App.waDigits(s.whatsapp)) b.push('<a class="btn btn-ghost btn-sm" href="' + esc(App.waLink(s.whatsapp)) + '" target="_blank" rel="noopener">' + ICON_WA + 'WhatsApp</a>');
    if (s.phone) b.push('<a class="btn btn-ghost btn-sm" href="tel:' + esc(String(s.phone).replace(/[^\d+]/g, '')) + '">' + ICONS.phone + esc(s.phone) + '</a>');
    return b.length ? '<div class="form-contacts">' + b.join('') + '</div>' : '';
  };

  R.form = (sec, d) => {
    const s = d.settings;
    const btns = [];
    if (App.tgUser(s.telegram)) btns.push('<button class="btn btn-primary btn-lg" type="submit" data-channel="telegram">' + ICON_TG + esc(ui('send_tg')) + '</button>');
    if (App.waDigits(s.whatsapp)) btns.push('<button class="btn ' + (btns.length ? 'btn-ghost' : 'btn-primary') + ' btn-lg" type="submit" data-channel="whatsapp">' + ICON_WA + esc(ui('send_wa')) + '</button>');
    if (!btns.length) btns.push('<button class="btn btn-primary btn-lg" type="submit" data-channel="">' + esc(ui('send')) + '</button>');
    return '<section id="form" class="sec form-sec"><div class="form-slant" aria-hidden="true"></div><div class="container form-wrap">' +
      '<div class="form-copy rv">' + head(sec).replace('sec-head rv', 'sec-head') + contactsRow(s) + '<div class="form-sign" aria-hidden="true">' + SIGN_U + '</div></div>' +
      '<div class="form-card rv" id="leadBox">' +
        '<form id="leadForm" novalidate>' +
          '<div class="field"><label for="f-name">' + esc(ui('f_name')) + ' <i>*</i></label><input id="f-name" name="name" autocomplete="name" maxlength="80"><small class="err"></small></div>' +
          '<div class="field"><label for="f-contact">' + esc(ui('f_contact')) + ' <i>*</i></label><input id="f-contact" name="contact" inputmode="tel" autocomplete="tel" placeholder="+998 __ ___-__-__" maxlength="40"><small class="err"></small></div>' +
          '<div class="field"><label for="f-school">' + esc(ui('f_school')) + ' <i>*</i></label><input id="f-school" name="school" maxlength="120"><small class="err"></small></div>' +
          chips('city', ui('f_city')) + chips('branches', ui('f_branches')) + chips('students', ui('f_students')) + chips('budget', ui('f_budget')) +
          '<div class="field"><label for="f-problem">' + esc(ui('f_problem')) + '</label><textarea id="f-problem" name="problem" rows="3" maxlength="1000" placeholder="' + esc(ui('f_problem_ph')) + '"></textarea></div>' +
          '<div class="form-btns">' + btns.join('') + '</div>' +
          '<p class="consent">' + esc(ui('consent')) + '</p>' +
        '</form>' +
      '</div></div></section>';
  };


  /* ---------------- форма заявки ---------------- */
  function fmtPhone(v) {
    let d = v.replace(/\D/g, '');
    if (d && !d.startsWith('998') && d.length <= 9) d = '998' + d;
    d = d.slice(0, 12);
    const r = d.slice(3);
    let out = '+998';
    if (r.length) out += ' ' + r.slice(0, 2);
    if (r.length > 2) out += ' ' + r.slice(2, 5);
    if (r.length > 5) out += '-' + r.slice(5, 7);
    if (r.length > 7) out += '-' + r.slice(7, 9);
    return out;
  }
  const isUsernameMode = (v) => /^\s*[@A-Za-z]/.test(v);
  function validContact(v) {
    v = v.trim();
    if (isUsernameMode(v)) return /^@?[A-Za-z][A-Za-z0-9_]{3,31}$/.test(v);
    return v.replace(/\D/g, '').length === 12 && v.replace(/\D/g, '').startsWith('998');
  }
  const normContact = (v) => { v = v.trim(); return isUsernameMode(v) && v[0] !== '@' ? '@' + v : v; };

  function buildMessage(L) {
    const lines = [
      ui('msg_title'),
      ui('msg_name') + ': ' + L.name,
      ui('msg_contact') + ': ' + L.contact,
      ui('msg_school') + ': ' + L.school,
      ui('msg_city') + ': ' + L.cityLabel,
      ui('msg_branches') + ': ' + L.branchesLabel,
      ui('msg_students') + ': ' + L.studentsLabel,
      ui('msg_budget') + ': ' + L.budgetLabel,
    ];
    if (L.problem) lines.push(ui('msg_problem') + ': ' + L.problem);
    return lines.join('\n');
  }

  function initForm(d) {
    const form = document.getElementById('leadForm');
    if (!form) return;
    const contact = form.elements.contact;
    contact.addEventListener('focus', () => { if (!contact.value) contact.value = '+998 '; });
    contact.addEventListener('blur', () => { if (contact.value.trim() === '+998') contact.value = ''; });
    contact.addEventListener('input', () => {
      let v = contact.value;
      const um = v.match(/^\+998\s*([@A-Za-z_].*)$/); // начали вводить @username поверх «+998 »
      if (um) { v = um[1]; contact.value = v; }
      if (isUsernameMode(v)) { contact.setAttribute('inputmode', 'text'); return; }
      contact.setAttribute('inputmode', 'tel');
      if (!v.replace(/\D/g, '')) return;
      contact.value = fmtPhone(v);
    });
    form.addEventListener('input', (e) => { const f = e.target.closest('.field'); if (f) setErr(f, ''); });
    form.addEventListener('change', (e) => { const f = e.target.closest('.field'); if (f) setErr(f, ''); });

    let channel = '';
    form.querySelectorAll('[data-channel]').forEach((b) => b.addEventListener('click', () => { channel = b.dataset.channel; }));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.dataset.busy) return;
      const submitter = e.submitter || form.querySelector('[data-channel]');
      if (e.submitter) channel = e.submitter.dataset.channel || '';
      const el = form.elements;
      const radio = (n) => { const r = form.querySelector('input[name="' + n + '"]:checked'); return r ? r.value : ''; };
      const label = (n) => { const r = form.querySelector('input[name="' + n + '"]:checked'); return r ? r.nextElementSibling.textContent : ''; };
      let ok = true;
      const need = (input, cond, msg) => { if (!cond) { setErr(input.closest('.field'), msg); ok = false; } };
      need(el.name, el.name.value.trim().length >= 2, ui('err_required'));
      need(el.contact, validContact(el.contact.value), ui('err_contact'));
      need(el.school, el.school.value.trim().length >= 2, ui('err_required'));
      ['city', 'branches', 'students', 'budget'].forEach((n) => {
        if (!radio(n)) { setErr(form.querySelector('[data-field="' + n + '"]'), ui('err_choose')); ok = false; }
      });
      if (!ok) { const first = form.querySelector('.field.bad'); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

      const lead = {
        name: el.name.value.trim().slice(0, 120),
        contact: normContact(el.contact.value).slice(0, 120),
        school: el.school.value.trim().slice(0, 200),
        city: radio('city'), branches: radio('branches'), students: radio('students'), budget: radio('budget'),
        problem: el.problem.value.trim().slice(0, 2000),
        lang: App.lang, channel: channel || '',
        page: (location.pathname + location.search).slice(0, 300),
      };
      const msg = buildMessage(Object.assign({}, lead, {
        cityLabel: label('city'), branchesLabel: label('branches'), studentsLabel: label('students'), budgetLabel: label('budget'),
      }));
      const url = channel === 'telegram' ? App.tgLink(d.settings.telegram, msg)
        : channel === 'whatsapp' ? App.waLink(d.settings.whatsapp, msg) : '';

      form.dataset.busy = '1';
      const orig = submitter.innerHTML;
      submitter.textContent = ui('sending');

      // 1) сохраняем заявку в базу (запрос уходит сразу)
      const saving = sb.from('leads').insert(lead).then((r) => { if (r.error) throw r.error; return true; });
      const saved = Promise.race([saving, new Promise((res) => setTimeout(() => res(false), 8000))])
        .catch((err) => { console.error('Lead save error', err); return false; });
      // 2) открываем мессенджер синхронно с нажатием, чтобы браузер не заблокировал окно
      let win = null;
      if (url) { try { win = window.open(url, '_blank'); if (win) win.opener = null; } catch (_) { win = null; } }

      await saved;
      delete form.dataset.busy;
      submitter.innerHTML = orig;
      showSuccess(d, url, channel);
      if (url && !win) setTimeout(() => { location.href = url; }, 900);
    });
  }

  function setErr(field, msg) {
    if (!field) return;
    field.classList.toggle('bad', !!msg);
    const s = field.querySelector('.err'); if (s) s.textContent = msg;
  }

  function showSuccess(d, url, channel) {
    const box = document.getElementById('leadBox');
    const form = document.getElementById('leadForm');
    form.hidden = true;
    let done = box.querySelector('.form-done');
    if (!done) { done = document.createElement('div'); done.className = 'form-done'; box.appendChild(done); }
    done.innerHTML = '<div class="done-ico" aria-hidden="true">✓</div><h3 class="h-md">' + esc(ui('success_title')) + '</h3>' +
      '<p>' + esc(tr(d.settings, 'form_success')) + '</p>' +
      (url ? '<a class="btn btn-primary btn-lg" id="openMsg" href="' + esc(url) + '" target="_blank" rel="noopener">' +
        (channel === 'whatsapp' ? ICON_WA + esc(ui('open_wa')) : ICON_TG + esc(ui('open_tg'))) + '</a>' : '') +
      '<button type="button" class="btn btn-ghost" id="againBtn">' + esc(ui('again')) + '</button>';
    done.hidden = false;
    done.querySelector('#againBtn').addEventListener('click', () => { form.reset(); form.hidden = false; done.hidden = true; });
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------------- счётчики ---------------- */
  function animateCounters() {
    const els = document.querySelectorAll('[data-count]');
    const run = (el) => {
      const raw = el.dataset.count;
      const m = raw.match(/^(\D*)(\d[\d\s]*)(.*)$/);
      if (!m) return;
      const target = parseInt(m[2].replace(/\s/g, ''), 10);
      if (!target || target > 1e7) return;
      const t0 = performance.now(), dur = 1300;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = m[1] + Math.round(target * e) + m[3];
        if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { run(x.target); io.unobserve(x.target); } }));
    els.forEach((e) => io.observe(e));
  }

  /* ---------------- запуск ---------------- */
  async function init() {
    const hdr = document.getElementById('hdr'), ftr = document.getElementById('ftr');
    if (!sb) { App.notice(app, ui('not_configured')); return; }
    try {
      const listOpts = (x) => x.eq('visible', true).order('sort');
      const [common, pains, services, steps, faq, team, cases] = await Promise.all([
        App.loadCommon(),
        q('pains', listOpts), q('services', listOpts), q('steps', listOpts), q('faq', listOpts), q('team', listOpts),
        q('cases', (x) => x.eq('status', 'published').order('sort')),
      ]);
      const d = Object.assign({}, common, { pains, services, steps, faq, team, cases });
      App.data = d;
      App.renderHeader(hdr, d, { home: true });
      app.innerHTML = d.sections.filter((s) => s.enabled && R[s.key]).map((s) => R[s.key](s, d)).join('');
      App.renderFooter(ftr, d);
      initForm(d);
      animateCounters();
      App.reveal(app);
      // одно открытое FAQ за раз
      app.querySelectorAll('.faq-item').forEach((det) => det.addEventListener('toggle', () => {
        if (det.open) app.querySelectorAll('.faq-item[open]').forEach((o) => { if (o !== det) o.open = false; });
      }));
      if (location.hash) { const t = document.querySelector(location.hash); if (t) setTimeout(() => t.scrollIntoView(), 50); }
    } catch (err) {
      console.error(err);
      App.notice(app, ui('load_error'));
    }
  }

  App._test = { fmtPhone, validContact, buildMessage };
  init();
})();

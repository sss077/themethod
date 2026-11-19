/* Главная страница: собирает секции из базы в нужном порядке. */
(function () {
  'use strict';
  const { sb, ui, tr, esc, hl, rich, q, ICONS, ICON_TG, ICON_WA, SIGN_U } = App;
  const app = document.getElementById('app');

  /* Подпись над заголовком: «02 — Проблемы» */
  const eyebrow = (sec, d) => {
    const n = d.idx && d.idx[sec.key];
    const label = tr(sec, 'menu');
    return n ? '<div class="eyebrow"><b>' + String(n).padStart(2, '0') + '</b>' + esc(label) + '</div>' : '';
  };
  const head = (sec, d) =>
    '<div class="sec-head rv">' + eyebrow(sec, d || App.data || {}) + '<h2 class="h-lg">' + hl(tr(sec, 'title')) + '</h2>' +
    (tr(sec, 'subtitle') ? '<p class="sec-sub">' + hl(tr(sec, 'subtitle')) + '</p>' : '') + '</div>';
  const isOn = (d, key) => d.sections.some((x) => x.key === key && x.enabled);

  /* ---------------- секции ---------------- */
  const R = {};

  R.hero = (sec, d) => {
    const s = d.settings;
    const list = (s.counters || []).filter((c) => c && c.value);
    const counters = list.map((c, i) =>
      '<div class="counter" data-i="' + i + '"><b data-count="' + esc(c.value) + '">' + esc(c.value) + '</b><span>' + esc(tr(c, 'label')) + '</span></div>').join('');
    const casesOn = isOn(d, 'cases') && d.cases.length;
    return '<section id="hero" class="scene scene-hero" style="--len:' + (list.length ? 230 : 140) + '"><div class="scene-pin"><div class="container hero-in">' +
        '<div class="hero-copy">' +
          (tr(s, 'hero_badge') ? '<div class="badge">' + esc(tr(s, 'hero_badge')) + '</div>' : '') +
          '<h1 class="h-xl">' + hl(tr(sec, 'title')) + '</h1>' +
          (tr(sec, 'subtitle') ? '<p class="lead">' + hl(tr(sec, 'subtitle')) + '</p>' : '') +
          '<div class="btns">' +
            (isOn(d, 'form') ? '<a class="btn btn-primary btn-lg" href="#form">' + esc(tr(s, 'hero_button') || ui('cta')) + '<span class="arr">→</span></a>' : '') +
            (casesOn && tr(s, 'hero_button2') ? '<a class="btn btn-ghost btn-lg" href="#cases">' + esc(tr(s, 'hero_button2')) + '</a>' : '') +
          '</div>' +
          (counters ? '<div class="counters">' + counters + '</div>' : '') +
        '</div>' +
      '</div><div class="scroll-hint" aria-hidden="true"><i></i></div></div></section>';
  };

  R.pains = (sec, d) => {
    if (!d.pains.length) return '';
    return '<section id="pains" class="sec"><div class="container">' + head(sec, d) +
      '<div class="pains">' + d.pains.map((p, i) =>
        '<article class="pain rv"><span class="pain-n">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<h3 class="h-sm">' + hl(tr(p, 'title')) + '</h3><p>' + hl(tr(p, 'text')) + '</p></article>').join('') +
      '</div></div></section>';
  };

  R.offer = (sec, d) => {
    const s = d.settings;
    const cur = esc(s.offer_currency || '$');
    const points = String(tr(s, 'offer_points') || '').split('\n').filter((x) => x.trim());
    const price = (v) => (/^\d/.test(String(v)) ? cur + esc(v) : esc(v));
    const g = String(tr(s, 'offer_guarantee') || '');
    const gm = g.match(/^\s*(\d+)\s*(.*)$/s); // «40 записей…» → большая цифра 40 + текст
    const layers = [];
    if (s.offer_price_old || points.length) {
      layers.push('<span class="label">' + esc(ui('old_price')) + '</span>' +
        (s.offer_price_old ? '<span class="price-old">' + price(s.offer_price_old) + '</span>' : '') +
        (points.length ? '<ul class="tri">' + points.map((x) => '<li>' + hl(x.replace(/^\s*[-•▲]\s*/, '')) + '</li>').join('') + '</ul>' : ''));
    }
    if (s.offer_price_new) {
      layers.push('<span class="label">' + esc(tr(s, 'offer_badge')) + '</span>' +
        '<div class="price-new">' + price(s.offer_price_new) + '</div>' +
        (tr(s, 'offer_period') ? '<span class="price-period">' + esc(tr(s, 'offer_period')) + '</span>' : ''));
    }
    layers.push('<span class="label">' + esc(tr(s, 'offer_guarantee_title')) + '</span>' +
      (gm ? '<div class="g-num" data-num="' + esc(gm[1]) + '">' + esc(gm[1]) + '</div><p class="g-text">' + hl(gm[2]) + '</p>' : '<p class="g-text">' + hl(g) + '</p>') +
      (tr(s, 'offer_note') ? '<p class="g-note">' + hl(tr(s, 'offer_note')) + '</p>' : '') +
      (isOn(d, 'form') ? '<a class="btn btn-primary btn-lg" href="#form">' + esc(tr(s, 'offer_button') || ui('cta')) + '<span class="arr">→</span></a>' : ''));
    return '<section id="offer" class="scene scene-offer" style="--len:' + (100 + layers.length * 70) + '"><div class="scene-pin"><div class="container"><div class="offer">' +
        '<div class="offer-main">' + eyebrow(sec, d) +
          '<h2 class="h-lg">' + hl(tr(sec, 'title')) + '</h2>' +
          (tr(sec, 'subtitle') ? '<p class="sec-sub">' + hl(tr(sec, 'subtitle')) + '</p>' : '') +
          '<div class="offer-steps" aria-hidden="true">' + layers.map(() => '<i></i>').join('') + '</div>' +
        '</div>' +
        '<div class="offer-stage">' + layers.map((l) => '<div class="offer-layer">' + l + '</div>').join('') + '</div>' +
      '</div></div></div></section>';
  };

  R.services = (sec, d) => {
    if (!d.services.length) return '';
    return '<section id="services" class="sec"><div class="container">' + head(sec, d) +
      '<div class="grid g3">' + d.services.map((x, i) =>
        '<article class="card service rv" style="--d:' + (i % 3) * 0.08 + 's"><div class="ico">' + (ICONS[x.icon] || ICONS.target) + '</div>' +
        '<h3 class="h-sm">' + hl(tr(x, 'title')) + '</h3><p class="muted">' + hl(tr(x, 'text')) + '</p></article>').join('') +
      '</div></div></section>';
  };

  R.cases = (sec, d) => {
    const body = d.cases.length
      ? '<div class="grid g3 cases-grid">' + d.cases.map(App.caseCard).join('') + '</div>'
      : '<p class="muted rv">' + esc(ui('cases_empty')) + '</p>';
    return '<section id="cases" class="sec"><div class="container">' + head(sec, d) + body + '</div></section>';
  };

  R.process = (sec, d) => {
    if (!d.steps.length) return '';
    return '<section id="process" class="sec"><div class="container">' + head(sec, d) +
      '<ol class="steps">' + d.steps.map((x, i) =>
        '<li class="step rv" style="--d:' + i * 0.1 + 's"><span class="step-n">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<h3 class="h-sm">' + hl(tr(x, 'title')) + '</h3><p>' + hl(tr(x, 'text')) + '</p></li>').join('') +
      '</ol></div></section>';
  };

  R.team = (sec, d) => {
    if (!d.team.length) return '';
    return '<section id="team" class="sec"><div class="container">' + head(sec, d) +
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
    return '<section id="faq" class="sec"><div class="container narrow">' + head(sec, d) +
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
    return '<section id="form" class="sec form-sec"><div class="container form-wrap">' +
      '<div class="form-copy rv">' + head(sec, d).replace('sec-head rv', 'sec-head') + contactsRow(s) + '</div>' +
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

  /* ---------------- счётчик 0 → N ---------------- */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const raw = el.dataset.count;
    const m = raw.match(/^(\D*)(\d[\d\s]*)(.*)$/);
    if (!m) return;
    const target = parseInt(m[2].replace(/\s/g, ''), 10);
    if (!target || target > 1e7) return;
    const t0 = performance.now(), dur = 1100;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = m[1] + Math.round(target * e) + m[3];
      if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
    };
    requestAnimationFrame(step);
  }

  /* =====================================================================
     СЦЕНЫ И ДОРОГА
     Экран «залипает» (position: sticky), а прогресс прокрутки внутри
     сцены (0…1) переключает шаги. Учебная машина едет по дороге через
     всю страницу и всегда держится примерно в одной точке экрана —
     дорога «течёт» под ней, на поворотах машина подъезжает к блокам.
     ===================================================================== */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const NS = 'http://www.w3.org/2000/svg';
  const CAR = '<g class="car-body">' +
    '<path class="beam" d="M-11 22 L-30 120 L30 120 L11 22 Z" fill="url(#beam)"/>' +
    '<rect x="-13" y="-24" width="26" height="48" rx="8" fill="#EDEDF0"/>' +
    '<rect x="-10.5" y="6" width="21" height="10" rx="3" fill="#1B1B20"/>' +
    '<rect x="-10" y="-19" width="20" height="6" rx="2.5" fill="#1B1B20"/>' +
    '<path d="M0 -9 L7.5 3.5 L-7.5 3.5 Z" fill="#E0352B"/>' +
    '<rect x="-11" y="21" width="5" height="2.5" rx="1" fill="#FFF3CF"/><rect x="6" y="21" width="5" height="2.5" rx="1" fill="#FFF3CF"/>' +
    '<rect x="-11" y="-24" width="5" height="2" rx="1" fill="#E0352B"/><rect x="6" y="-24" width="5" height="2" rx="1" fill="#E0352B"/>' +
    '</g>';

  function initScenes() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      app.querySelectorAll('[data-count]').forEach((e) => { e.dataset.done = '1'; });
      return;
    }
    document.documentElement.classList.add('js-scenes');

    const hero = app.querySelector('.scene-hero');
    const offer = app.querySelector('.scene-offer');
    const heroCounters = hero ? Array.from(hero.querySelectorAll('.counter')) : [];
    const heroCopy = hero && hero.querySelector('.hero-copy');
    const hint = hero && hero.querySelector('.scroll-hint');
    const layers = offer ? Array.from(offer.querySelectorAll('.offer-layer')) : [];
    const dots = offer ? Array.from(offer.querySelectorAll('.offer-steps i')) : [];
    const oldPrice = offer && offer.querySelector('.price-old');
    const gNum = offer && offer.querySelector('.g-num');

    /* --- дорога --- */
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'road'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<defs><linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3CF" stop-opacity=".22"/><stop offset="1" stop-color="#FFF3CF" stop-opacity="0"/></linearGradient>' +
      '<mask id="trailMask" maskUnits="userSpaceOnUse"><path class="trail-mask" fill="none" stroke="#fff"/></mask></defs>' +
      '<path class="asphalt-edge" fill="none" stroke-linecap="round"/><path class="asphalt" fill="none" stroke-linecap="round"/>' +
      '<path class="dash" fill="none"/><path class="trail" fill="none" mask="url(#trailMask)"/>' +
      '<g class="finish"></g><g class="car">' + CAR + '</g>';
    app.prepend(svg);
    const P = {
      edge: svg.querySelector('.asphalt-edge'), asphalt: svg.querySelector('.asphalt'), dash: svg.querySelector('.dash'),
      trail: svg.querySelector('.trail'), mask: svg.querySelector('.trail-mask'), car: svg.querySelector('.car'), finish: svg.querySelector('.finish'),
    };
    let S = null; // выборка точек пути: {xs, ys, ls, total, scale}

    function docY(el) { return el.getBoundingClientRect().top + window.scrollY - (app.getBoundingClientRect().top + window.scrollY); }

    function build() {
      const W = document.documentElement.clientWidth;
      const H = app.offsetHeight;
      const vh = window.innerHeight;
      const mobile = W < 600;
      const scale = mobile ? 0.62 : W < 1024 ? 0.8 : 1;
      const cont = app.querySelector('.container');
      if (!cont) return;
      const cr = cont.getBoundingClientRect();
      const contentRight = cr.right - parseFloat(getComputedStyle(cont).paddingRight);
      const laneX = Math.min((contentRight + W) / 2, contentRight + 90);
      const pts = [];
      const add = (x, y) => { if (!pts.length || y > pts[pts.length - 1][1] + 30) pts.push([x, y]); };

      // первый экран: справа от текста (если есть место), иначе в полосе
      let startX = laneX;
      if (hero && heroCopy && W >= 1024) {
        const copyRight = heroCopy.getBoundingClientRect().right;
        if (contentRight - copyRight > 200) startX = (copyRight + contentRight) / 2 + 40;
      }
      if (hero) {
        const top = docY(hero), h = hero.offsetHeight;
        add(startX, top - 40);
        add(startX, top + h - vh * 0.55);
        add(laneX, top + h + vh * 0.1);
      } else add(laneX, 0);

      // повороты к заголовкам блоков
      app.querySelectorAll('main > section').forEach((sec) => {
        if (sec === hero) return;
        const isScene = sec.classList.contains('scene');
        const headEl = sec.querySelector(isScene ? '.offer-main h2' : '.sec-head h2');
        if (!headEl) return;
        const y = isScene ? docY(sec) + vh * 0.45 : docY(headEl) + headEl.offsetHeight / 2;
        const headRight = isScene ? contentRight : headEl.getBoundingClientRect().left + Math.min(headEl.scrollWidth, headEl.offsetWidth);
        const room = laneX - headRight - (mobile ? 40 : 90);
        let sw = W >= 1024 ? clamp(room, 0, 220) : 0;
        // не заезжаем на соседние блоки (например, карточку формы справа от заголовка)
        sec.querySelectorAll('.form-card, .grid, .steps, .pains, .faq').forEach((el) => {
          const r = el.getBoundingClientRect(), top = docY(el);
          if (top < y + 240 && top + r.height > y - 240) sw = Math.min(sw, Math.max(0, laneX - r.right - 60));
        });
        if (isScene) {
          add(laneX, docY(sec));
          add(laneX, docY(sec) + sec.offsetHeight - vh * 0.4);
        } else if (sw > 40) {
          add(laneX, y - 220); add(laneX - sw, y); add(laneX, y + 220);
        } else add(laneX, y);
      });

      // финиш — у формы заявки (или в конце страницы)
      const form = app.querySelector('#form .form-card');
      const endY = form ? docY(form) + Math.min(form.offsetHeight * 0.5, 320) : H - 60;
      add(laneX, endY);
      if (pts.length < 2) return;

      let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], k = (y1 - y0) * 0.5;
        d += ' C' + x0.toFixed(1) + ' ' + (y0 + k).toFixed(1) + ' ' + x1.toFixed(1) + ' ' + (y1 - k).toFixed(1) + ' ' + x1.toFixed(1) + ' ' + y1.toFixed(1);
      }
      svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      const roadW = 40 * scale;
      [P.edge, P.asphalt, P.dash, P.trail, P.mask].forEach((el) => el.setAttribute('d', d));
      P.edge.setAttribute('stroke-width', roadW + 2);
      P.asphalt.setAttribute('stroke-width', roadW);
      P.dash.setAttribute('stroke-width', 2); P.dash.setAttribute('stroke-dasharray', (16 * scale) + ' ' + (18 * scale));
      P.trail.setAttribute('stroke-width', 2); P.trail.setAttribute('stroke-dasharray', (16 * scale) + ' ' + (18 * scale));
      P.mask.setAttribute('stroke-width', roadW + 10);
      const [fx, fy] = pts[pts.length - 1];
      P.finish.innerHTML = Array.from({ length: 8 }, (_, i) => '<rect x="' + (fx - roadW / 2 + i * roadW / 8).toFixed(1) + '" y="' + (fy + (i % 2 ? 0 : 4 * scale)).toFixed(1) + '" width="' + (roadW / 8).toFixed(1) + '" height="' + (4 * scale).toFixed(1) + '"/>').join('');

      const total = P.dash.getTotalLength();
      const xs = [], ys = [], ls = [];
      for (let l = 0; l <= total; l += 4) { const pt = P.dash.getPointAtLength(l); xs.push(pt.x); ys.push(pt.y); ls.push(l); }
      S = { xs, ys, ls, total, scale, mobile };
      frame();
    }

    function placeCar(vh) {
      if (!S) return;
      const target = window.scrollY - (app.getBoundingClientRect().top + window.scrollY) + vh * (S.mobile ? 0.68 : 0.6);
      const { xs, ys, ls } = S;
      const n = ys.length - 1;
      let lo = 0, hi = n;
      if (target <= ys[0]) hi = 0; else if (target >= ys[n]) lo = hi = n;
      else { while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ys[mid] < target) lo = mid; else hi = mid; } }
      const i = hi;
      const a = Math.max(0, i - 4), b = Math.min(n, i + 4);
      const ang = Math.atan2(xs[b] - xs[a], ys[b] - ys[a]) * 180 / Math.PI;
      P.car.setAttribute('transform', 'translate(' + xs[i].toFixed(1) + ' ' + ys[i].toFixed(1) + ') rotate(' + (-ang).toFixed(2) + ') scale(' + S.scale + ')');
      P.mask.setAttribute('stroke-dasharray', ls[i].toFixed(0) + ' ' + (S.total + 100).toFixed(0));
    }

    function sceneProgress(sc, vh) {
      const r = sc.getBoundingClientRect();
      return clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
    }

    function frame() {
      ticking = false;
      const vh = window.innerHeight;
      if (hero) {
        const p = sceneProgress(hero, vh);
        const n = heroCounters.length;
        heroCounters.forEach((c, i) => {
          const on = p >= (i + 1) / (n + 1) * 0.8;
          if (on && !c.classList.contains('on')) { c.classList.add('on'); const b = c.querySelector('[data-count]'); if (b) countUp(b); }
          else if (!on) c.classList.remove('on');
        });
        if (heroCopy) heroCopy.style.transform = 'translateY(' + (-p * 24).toFixed(1) + 'px)';
        if (hint) hint.style.opacity = String(clamp(1 - p * 5, 0, 1));
      }
      if (offer && layers.length) {
        const p = sceneProgress(offer, vh);
        const k = layers.length;
        const step = Math.min(k - 1, Math.floor(p * k * 0.999));
        layers.forEach((l, i) => l.classList.toggle('on', i === step));
        dots.forEach((dt, i) => dt.classList.toggle('on', i <= step));
        if (oldPrice) oldPrice.style.setProperty('--strike', clamp((p * k - 0.15) / 0.6, 0, 1).toFixed(3));
        if (gNum) {
          const local = clamp((p * k - (k - 1)) / 0.55, 0, 1);
          gNum.textContent = String(Math.round(+gNum.dataset.num * (1 - Math.pow(1 - local, 3))));
        }
      }
      placeCar(vh);
    }

    let ticking = false;
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    let rt = 0;
    const rebuild = () => { clearTimeout(rt); rt = setTimeout(build, 120); };
    window.addEventListener('resize', rebuild);
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(app);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
    build();
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
      // номера разделов для подписей «02 — Проблемы»
      d.idx = {}; let n = 0;
      d.sections.forEach((s) => { if (s.enabled && R[s.key] && s.key !== 'hero') d.idx[s.key] = ++n + 1; });
      App.data = d;
      App.renderHeader(hdr, d, { home: true });
      app.innerHTML = d.sections.filter((s) => s.enabled && R[s.key]).map((s) => R[s.key](s, d)).join('');
      App.renderFooter(ftr, d);
      initForm(d);
      initScenes();
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

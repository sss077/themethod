/* =====================================================================
   Главная страница. Контент — из базы (админка), анимации — GSAP,
   плавная прокрутка — Lenis, рой частиц — swarm.js (WebGL).
   ===================================================================== */
(function () {
  'use strict';
  const { sb, ui, tr, esc, hl, rich, q, ICONS, ICON_TG, ICON_WA, SIGN_U } = App;
  const app = document.getElementById('app');
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);
  const MOTION = HAS_GSAP && !REDUCE;
  const FINE = matchMedia('(pointer: fine)').matches;
  const pad2 = (n) => String(n).padStart(2, '0');
  const isOn = (d, key) => d.sections.some((x) => x.key === key && x.enabled);

  /* Сцена «Воронка»: если в базе ещё нет строки — показываем со стандартным текстом */
  const FUNNEL_DEFAULT = {
    key: 'funnel', enabled: true, sort: 2.5,
    title_ru: '*ЗАЯВКИ*, А НЕ ОХВАТЫ', title_uz: '*ARIZALAR*, QAMROV EMAS',
    subtitle_ru: 'Просмотры\nКлики\nЗаявки\nЗаписи на пробное', subtitle_uz: 'Koʻrishlar\nKliklar\nArizalar\nSinov darsiga yozilish',
    menu_ru: '', menu_uz: '',
  };

  /* подпись над заголовком: 02 — ПРОБЛЕМЫ */
  const eyebrow = (sec, d) => {
    const n = d.idx && d.idx[sec.key];
    return n ? '<div class="eyebrow"><b>' + pad2(n) + '</b><span>' + esc(tr(sec, 'menu')) + '</span></div>' : '';
  };
  const head = (sec, d) =>
    '<div class="sec-head">' + eyebrow(sec, d || App.data || {}) + '<h2 class="h-lg" data-split>' + hl(tr(sec, 'title')) + '</h2>' +
    (tr(sec, 'subtitle') ? '<p class="sec-sub" data-fade>' + hl(tr(sec, 'subtitle')) + '</p>' : '') + '</div>';

  /* ---------------- секции ---------------- */
  const R = {};

  R.hero = (sec, d) => {
    const s = d.settings;
    const list = (s.counters || []).filter((c) => c && c.value);
    return '<section id="hero" class="hero" data-scene="hero">' +
      '<div class="container hero-in">' +
        '<div class="hero-top" data-fade>' +
          (tr(s, 'hero_badge') ? '<span class="badge">' + esc(tr(s, 'hero_badge')) + '</span>' : '<span></span>') +
          '<span class="geo">41.2995° N · 69.2401° E</span>' +
        '</div>' +
        '<h1 class="hero-title" data-split>' + hl(tr(sec, 'title')) + '</h1>' +
        '<div class="hero-bottom">' +
          (tr(sec, 'subtitle') ? '<p class="lead" data-fade>' + hl(tr(sec, 'subtitle')) + '</p>' : '<span></span>') +
          '<div class="btns" data-fade>' +
            (isOn(d, 'form') ? '<a class="btn btn-primary btn-lg" data-magnetic href="#form"><span>' + esc(tr(s, 'hero_button') || ui('cta')) + '</span><span class="arr">→</span></a>' : '') +
            (isOn(d, 'cases') && d.cases.length && tr(s, 'hero_button2') ? '<a class="btn btn-ghost btn-lg" data-magnetic href="#cases"><span>' + esc(tr(s, 'hero_button2')) + '</span></a>' : '') +
          '</div>' +
        '</div>' +
        (list.length ? '<div class="counters">' + list.map((c) =>
          '<div class="counter" data-fade><b data-count="' + esc(c.value) + '">' + esc(c.value) + '</b><span>' + esc(tr(c, 'label')) + '</span></div>').join('') + '</div>' : '') +
      '</div>' +
      '<div class="scroll-cue" aria-hidden="true"><span></span></div>' +
    '</section>';
  };

  /* Бегущая строка между первым экраном и болями */
  const marquee = (d) => {
    const f = d.sections.find((x) => x.key === 'funnel') || FUNNEL_DEFAULT;
    const words = [tr(f, 'title'), tr(d.sections.find((x) => x.key === 'hero') || {}, 'title')].map((w) => String(w || '').replace(/\*/g, '')).filter(Boolean);
    const unit = words.map((w) => '<span>' + esc(w) + '</span><i>▲</i>').join('');
    return '<div class="marquee" aria-hidden="true"><div class="mq-track">' + unit.repeat(4) + '</div></div>';
  };

  R.pains = (sec, d) => {
    if (!d.pains.length) return '';
    return '<section id="pains" class="sec" data-scene="pains"><div class="container">' + head(sec, d) +
      '<div class="pains">' + d.pains.map((p, i) =>
        '<article class="pain"><span class="pain-n">' + pad2(i + 1) + '</span>' +
        '<h3 class="pain-t" data-fill>' + hl(tr(p, 'title')) + '</h3><p data-fade>' + hl(tr(p, 'text')) + '</p><i class="pain-line"></i></article>').join('') +
      '</div></div></section>';
  };

  R.funnel = (sec, d) => {
    const stages = String(tr(sec, 'subtitle') || '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 6);
    if (!stages.length) return '';
    return '<section id="funnel" class="funnel" data-scene="funnel" data-stages="' + stages.length + '"><div class="container funnel-in">' +
      '<div class="funnel-copy">' + eyebrow(sec, d) +
        '<h2 class="h-lg" data-split>' + hl(tr(sec, 'title')) + '</h2>' +
        '<ol class="stages">' + stages.map((st, i) =>
          '<li class="stage' + (i === stages.length - 1 ? ' last' : '') + '"><span class="st-n">' + pad2(i + 1) + '</span><span class="st-t">' + esc(st) + '</span><i class="st-bar"><b></b></i></li>').join('') + '</ol>' +
      '</div>' +
      '<div class="funnel-big" aria-hidden="true">' + stages.map((st, i) => '<span class="fb' + (i === stages.length - 1 ? ' last' : '') + '">' + esc(st) + '</span>').join('') + '</div>' +
    '</div></section>';
  };

  R.offer = (sec, d) => {
    const s = d.settings;
    const cur = esc(s.offer_currency || '$');
    const points = String(tr(s, 'offer_points') || '').split('\n').filter((x) => x.trim());
    const price = (v) => (/^\d/.test(String(v)) ? cur + esc(v) : esc(v));
    const g = String(tr(s, 'offer_guarantee') || '');
    const layers = [];
    if (s.offer_price_old) {
      layers.push({ shape: 'old', html: '<span class="label">' + esc(ui('old_price')) + '</span><div class="o-price old">' + price(s.offer_price_old) + '</div>' +
        (points.length ? '<ul class="tri">' + points.map((x) => '<li>' + hl(x.replace(/^\s*[-•▲]\s*/, '')) + '</li>').join('') + '</ul>' : '') });
    }
    if (s.offer_price_new) {
      layers.push({ shape: 'new', html: '<span class="label">' + esc(tr(s, 'offer_badge')) + '</span><div class="o-price">' + price(s.offer_price_new) + '</div>' +
        (tr(s, 'offer_period') ? '<p class="o-sub">' + esc(tr(s, 'offer_period')) + '</p>' : '') });
    }
    layers.push({ shape: 'g', html: '<span class="label">' + esc(tr(s, 'offer_guarantee_title')) + '</span><p class="o-g">' + hl(g) + '</p>' +
      (tr(s, 'offer_note') ? '<p class="o-sub">' + hl(tr(s, 'offer_note')) + '</p>' : '') +
      (isOn(d, 'form') ? '<a class="btn btn-primary btn-lg" data-magnetic href="#form"><span>' + esc(tr(s, 'offer_button') || ui('cta')) + '</span><span class="arr">→</span></a>' : '') });
    return '<section id="offer" class="offer" data-scene="offer" data-layers="' + layers.map((l) => l.shape).join(',') + '"><div class="container offer-in">' +
      '<div class="offer-copy">' + eyebrow(sec, d) +
        '<h2 class="h-lg" data-split>' + hl(tr(sec, 'title')) + '</h2>' +
        (tr(sec, 'subtitle') ? '<p class="sec-sub" data-fade>' + hl(tr(sec, 'subtitle')) + '</p>' : '') +
        '<div class="o-dots" aria-hidden="true">' + layers.map(() => '<i></i>').join('') + '</div>' +
      '</div>' +
      '<div class="offer-stage">' + layers.map((l, i) => '<div class="o-layer" data-i="' + i + '">' + l.html + '</div>').join('') + '</div>' +
    '</div></section>';
  };

  R.process = (sec, d) => {
    if (!d.steps.length) return '';
    return '<section id="process" class="process" data-scene="process"><div class="proc-pin"><div class="container">' + head(sec, d) + '</div>' +
      '<div class="proc-track">' + d.steps.map((x, i) =>
        '<article class="proc-card"><span class="proc-n">' + pad2(i + 1) + '</span>' +
        '<div><h3 class="h-md">' + hl(tr(x, 'title')) + '</h3><p>' + hl(tr(x, 'text')) + '</p></div></article>').join('') +
      '<div class="proc-end" aria-hidden="true">' + SIGN_U + '</div></div></div></section>';
  };

  R.services = (sec, d) => {
    if (!d.services.length) return '';
    return '<section id="services" class="sec" data-scene="cases"><div class="container">' + head(sec, d) +
      '<div class="grid g3">' + d.services.map((x) =>
        '<article class="card service" data-rise><div class="ico">' + (ICONS[x.icon] || ICONS.target) + '</div>' +
        '<h3 class="h-sm">' + hl(tr(x, 'title')) + '</h3><p class="muted">' + hl(tr(x, 'text')) + '</p></article>').join('') +
      '</div></div></section>';
  };

  R.cases = (sec, d) => {
    const body = d.cases.length
      ? '<div class="grid g3 cases-grid">' + d.cases.map((c) => App.caseCard(c).replace('class="card case-card rv"', 'class="card case-card" data-rise data-cursor="' + esc(ui('case_more')) + '"')).join('') + '</div>'
      : '<p class="muted">' + esc(ui('cases_empty')) + '</p>';
    return '<section id="cases" class="sec" data-scene="cases"><div class="container">' + head(sec, d) + body + '</div></section>';
  };

  R.team = (sec, d) => {
    if (!d.team.length) return '';
    return '<section id="team" class="sec" data-scene="cases"><div class="container">' + head(sec, d) +
      '<div class="grid g3 team-grid">' + d.team.map((m) => {
        const name = tr(m, 'name');
        const initials = name.replace(/\[.*?\]/g, '').trim().split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase() || '•';
        const photo = App.safeImg(m.photo_url) ? '<img src="' + esc(m.photo_url) + '" alt="' + esc(name) + '" loading="lazy">' : '<span class="initials">' + esc(initials) + '</span>';
        return '<article class="card member" data-rise><div class="member-ph">' + photo + '</div><div class="member-info"><h3 class="h-sm">' + esc(name) +
          '</h3><span class="member-role">' + esc(tr(m, 'role')) + '</span>' + (tr(m, 'bio') ? '<p class="muted">' + hl(tr(m, 'bio')) + '</p>' : '') + '</div></article>';
      }).join('') + '</div></div></section>';
  };

  R.faq = (sec, d) => {
    if (!d.faq.length) return '';
    return '<section id="faq" class="sec" data-scene="cases"><div class="container narrow">' + head(sec, d) +
      '<div class="faq">' + d.faq.map((x) => '<details class="faq-item" data-rise><summary><span>' + esc(tr(x, 'question')) + '</span><i aria-hidden="true"></i></summary><div class="faq-a">' + rich(tr(x, 'answer')) + '</div></details>').join('') +
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
    return '<section id="form" class="sec form-sec" data-scene="form"><div class="container form-wrap">' +
      '<div class="form-copy">' + head(sec, d) + contactsRow(s) + '</div>' +
      '<div class="form-card" id="leadBox" data-rise>' +
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
      showSuccess(d, url, channel); celebrate();
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
    done.querySelector('#againBtn').addEventListener('click', () => { form.reset(); form.hidden = false; done.hidden = true; App.formDone = false; if (window.Swarm) window.Swarm.go('form'); });
    const y = box.getBoundingClientRect().top + window.scrollY - 100; if (lenis) lenis.scrollTo(y); else window.scrollTo({ top: y, behavior: 'smooth' });
  }

  /* =====================================================================
     АНИМАЦИИ
     ===================================================================== */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let lenis = null;

  /* Разбивка заголовка на слова и буквы (для «выезда» букв) */
  function split(el) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            Array.from(part).forEach((c) => { const s = document.createElement('span'); s.className = 'c'; s.textContent = c; w.appendChild(s); });
            frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') walk(ch);
      });
    };
    walk(el);
    return el.querySelectorAll('.c');
  }

  function countUp(el, delay) {
    const raw = el.dataset.count;
    const m = raw.match(/^(\D*)(\d[\d\s]*)(.*)$/);
    if (!m) return;
    const target = parseInt(m[2].replace(/\s/g, ''), 10);
    if (!target || target > 1e7) return;
    const o = { v: 0 };
    gsap.to(o, { v: target, duration: 1.6, delay: delay || 0, ease: 'power3.out', onUpdate: () => { el.textContent = m[1] + Math.round(o.v) + m[3]; }, onComplete: () => { el.textContent = raw; } });
  }

  /* ---------- состояния роя под контент ---------- */
  function defineSwarm(d) {
    const W = window.Swarm, Sh = W.shapes;
    if (!W.ready) return;
    const s = d.settings;
    const cur = s.offer_currency || '$';
    const price = (v) => (/^\d/.test(String(v)) ? cur + v : String(v));
    // на телефоне знак — над заголовком, а если места мало — крупным «водяным знаком» за текстом
    let heroMobile = { h: 0.5, w: 0.9, fx: 0, fy: 0.12, alpha: 0.55 };
    const ht = app.querySelector('.hero-title');
    if (ht) {
      const vh = window.innerHeight, hdrH = 64, top = ht.getBoundingClientRect().top + window.scrollY;
      const free = (top - hdrH - 40) / vh;
      if (free >= 0.16) { const cy = hdrH + 30 + (top - hdrH - 40) / 2; heroMobile = { h: Math.min(0.26, free * 0.85), w: 0.7, fx: 0.15, fy: 1 - 2 * cy / vh }; }
    }
    W.define('hero', { build: (n) => Sh.signShape(n), n: 0.62, h: 0.62, w: 0.42, fx: 0.5, fy: 0.06, sway: 0.55, dust: 'scatter', dustAlpha: 0.2,
      mobile: heroMobile });
    // дождь: «реклама утекает»
    let phase = null;
    W.define('pains', { n: 0, dust: 'hide', k: 0.09, damp: 0.7, follow: false, repel: 0.6,
      dyn(t, dt, o) {
        if (!phase) phase = new Float32Array(o.N).fill(-1);
        o.g.tx = 0; o.g.ty = 0; o.g.rotV = 0; o.g.rot *= 0.95;
        for (let i = 0; i < o.N; i++) {
          const r = o.R[i];
          const ph = (r * 13.7 + t * 0.045 * (0.6 + r)) % 1;
          const x = ((r * 97.1) % 1 * 2 - 1) * o.viewW * 0.62, z = -3 + ((r * 51.3) % 1) * 5;
          const y = o.viewH * 0.62 - ph * o.viewH * 1.24;
          o.T[i * 3] = x; o.T[i * 3 + 1] = y; o.T[i * 3 + 2] = z;
          if (ph < phase[i]) { o.P[i * 3] = x; o.P[i * 3 + 1] = y; o.P[i * 3 + 2] = z; o.V[i * 3] = o.V[i * 3 + 1] = o.V[i * 3 + 2] = 0; }
          phase[i] = ph;
          const red = r < 0.025;
          const col = red ? o.COL.red : o.COL.grey;
          o.CT[i * 3] = col[0]; o.CT[i * 3 + 1] = col[1]; o.CT[i * 3 + 2] = col[2];
          o.AT[i] = red ? 1 : 0.6;
        }
      } });
    // воронка: с каждым этапом частиц меньше, финал — красный
    const stages = +((app.querySelector('#funnel') || {}).dataset || {}).stages || 4;
    for (let k = 0; k < stages; k++) {
      const f = k / Math.max(1, stages - 1); // 0…1
      W.define('funnel' + k, {
        build: (n) => Sh.sphere(n, 0.5, (i) => (f > 0.95 ? (i % 7 ? 'red' : 'white') : f > 0.6 ? (i % 3 ? 'white' : 'red') : f > 0.3 ? (i % 4 ? 'grey' : 'white') : 'grey')),
        n: [1, 0.3, 0.11, 0.075][Math.min(3, Math.round(f * 3))] * (f === 0 ? 0.9 : 1),
        h: 1.15 - f * 0.8, fx: 0.45, fy: 0, spin: 0.35 + f * 0.6, dust: 'fall', face: false,
        mobile: { fx: 0, fy: 0.42, h: 0.7 - f * 0.42 },
      });
    }
    // оффер: цифры из частиц
    W.define('offer-old', { build: (n) => Sh.sample(Sh.textPoints(price(s.offer_price_old || '')), n).map((p) => Object.assign(p, { c: 'grey' })), n: 0.5, h: 0.28, w: 0.42, fx: 0.5, fy: 0.34, face: true, dust: 'scatter', dustAlpha: 0.1,
      mobile: { fx: 0, fy: -0.06, h: 0.12, w: 0.8 } });
    W.define('offer-new', { build: (n) => Sh.sample(Sh.textPoints(price(s.offer_price_new || '')), n).map((p, i) => Object.assign(p, { c: i % 9 ? 'white' : 'red' })), n: 0.5, h: 0.32, w: 0.42, fx: 0.5, fy: 0.32, face: true, dust: 'scatter', dustAlpha: 0.1,
      mobile: { fx: 0, fy: -0.08, h: 0.14, w: 0.8 } });
    const gm = String(tr(s, 'offer_guarantee') || '').match(/\d+/);
    W.define('offer-g', { build: (n) => Sh.sample(Sh.textPoints(gm ? gm[0] : '✓'), n).map((p, i) => Object.assign(p, { c: i % 11 ? 'red' : 'white' })), n: 0.55, h: 0.36, w: 0.36, fx: 0.5, fy: 0.3, face: true, dust: 'scatter', dustAlpha: 0.1,
      mobile: { fx: 0, fy: 0.1, h: 0.15, w: 0.5 } });
    // ночная трасса
    let rz = null;
    W.define('process', { n: 0, dust: 'hide', k: 0.12, damp: 0.6, follow: false, repel: 0,
      dyn(t, dt, o) {
        if (!rz) rz = new Float32Array(o.N).map((_, i) => -40 + ((o.R[i] * 71.3) % 1) * 47);
        o.g.tx = 0; o.g.ty = 0; o.g.rotV = 0; o.g.rot *= 0.9;
        const speed = 7 + Math.min(60, Math.abs(o.params.speed) * 0.04);
        const yRoad = -1.7;
        for (let i = 0; i < o.N; i++) {
          const r = o.R[i];
          let z = rz[i] + speed * dt;
          let wrapped = false;
          if (z > 7) { z -= 47; wrapped = true; }
          rz[i] = z;
          let x, y, col, a;
          const kind = r < 0.38 ? 0 : r < 0.6 ? 1 : 2;
          if (kind === 0) { x = (r < 0.19 ? -1 : 1) * 2.3; y = yRoad; col = o.COL.white; a = 0.75; }
          else if (kind === 1) { x = 0; y = yRoad; const dash = ((z % 3) + 3) % 3 < 1.5; col = o.COL.red; a = dash ? 1 : 0; }
          else { const side = r < 0.8 ? -1 : 1; x = side * (3.6 + ((r * 33.7) % 1) * 5); y = yRoad + ((r * 17.9) % 1) * 3.2; col = r % 0.01 < 0.005 ? o.COL.warm : o.COL.grey; a = 0.35; }
          o.T[i * 3] = x; o.T[i * 3 + 1] = y; o.T[i * 3 + 2] = z;
          if (wrapped) { o.P[i * 3] = x; o.P[i * 3 + 1] = y; o.P[i * 3 + 2] = z; o.V[i * 3] = o.V[i * 3 + 1] = o.V[i * 3 + 2] = 0; }
          o.CT[i * 3] = col[0]; o.CT[i * 3 + 1] = col[1]; o.CT[i * 3 + 2] = col[2];
          o.AT[i] = a * clamp((z + 40) / 12, 0, 1);
        }
      } });
    W.define('cases', { build: (n) => Sh.ring(n, 0.75, 0.16, (i) => (i % 14 ? 'dim' : 'red')), n: 0.7, h: 1, fx: 0, fy: 0, spin: 0.06, dust: 'scatter', dustAlpha: 0.08, repel: 0.4 });
    W.define('form', { build: (n) => Sh.ring(n, 0.5, 0.03, (i) => (i % 6 ? 'red' : 'white')), n: 0.5, h: 0.46, fx: -0.62, fy: -0.42, spin: 0.35, dust: 'scatter', dustAlpha: 0.1,
      mobile: { fx: 0, fy: 0.05, h: 0.5 } });
    W.define('check', { build: (n) => Sh.checkShape(n), n: 0.5, h: 0.36, fx: -0.6, fy: -0.22, face: true, dust: 'scatter', dustAlpha: 0.1, mobile: { fx: 0, fy: 0.05, h: 0.3 } });
  }

  function celebrate() {
    App.formDone = true;
    if (!window.Swarm || !window.Swarm.ready) return;
    window.Swarm.go('check'); window.Swarm.burst(0.5);
  }

  /* ---------- плавная прокрутка и якоря ---------- */
  function initScroll() {
    if (MOTION && window.Lenis && FINE) {
      lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      document.documentElement.classList.add('lenis');
    }
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href*="#"]'); if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const el = document.querySelector(url.hash); if (!el) return;
      e.preventDefault();
      const y = el.getBoundingClientRect().top + window.scrollY - (url.hash === '#form' ? 20 : 0);
      if (lenis) lenis.scrollTo(y, { duration: 1.6 }); else window.scrollTo({ top: y, behavior: REDUCE ? 'auto' : 'smooth' });
    });
  }

  /* ---------- курсор и «магнитные» кнопки ---------- */
  function initCursor() {
    if (!FINE || REDUCE) return;
    const c = document.createElement('div'); c.className = 'cursor'; c.innerHTML = '<span></span>';
    document.body.appendChild(c);
    const label = c.querySelector('span');
    const pos = { x: innerWidth / 2, y: innerHeight / 2 }, tgt = { x: pos.x, y: pos.y };
    window.addEventListener('pointermove', (e) => { tgt.x = e.clientX; tgt.y = e.clientY; c.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerleave', () => c.classList.remove('on'));
    gsap.ticker.add(() => { pos.x += (tgt.x - pos.x) * 0.2; pos.y += (tgt.y - pos.y) * 0.2; c.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)'; });
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const hot = e.target.closest('a, button, label, summary, input, textarea');
      c.classList.toggle('hot', !!hot && !lab); c.classList.toggle('lab', !!lab);
      label.textContent = lab ? lab.dataset.cursor : '';
      c.classList.toggle('text', !!e.target.closest('input, textarea'));
    });
    document.querySelectorAll('[data-magnetic]').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: 'power3.out' });
      });
      b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }));
    });
    // 3D-наклон карточек кейсов
    document.querySelectorAll('.case-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, { rotateY: px * 8, rotateX: -py * 8, duration: 0.5, ease: 'power3.out', transformPerspective: 900 });
        card.style.setProperty('--gx', (px + 0.5) * 100 + '%'); card.style.setProperty('--gy', (py + 0.5) * 100 + '%');
      });
      card.addEventListener('pointerleave', () => gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'power3.out' }));
    });
  }

  /* ---------- сцены ---------- */
  function initMotion(d) {
    const W = window.Swarm;
    const swarmOn = W && W.ready;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('motion');

    // заголовки — буквы выезжают снизу
    app.querySelectorAll('[data-split]').forEach((el) => {
      const chars = split(el);
      if (el.closest('#hero')) return; // первый экран анимируется после прелоадера
      gsap.from(chars, { yPercent: 110, rotate: 6, duration: 1, ease: 'power4.out', stagger: 0.018,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
    app.querySelectorAll('[data-fade]').forEach((el) => {
      if (el.closest('#hero')) return;
      gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    app.querySelectorAll('.eyebrow').forEach((el) => gsap.from(el, { opacity: 0, x: -20, duration: 0.8, scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
    gsap.utils.toArray('[data-rise]').forEach((el, i) => {
      gsap.from(el, { y: 80, opacity: 0, clipPath: 'inset(20% 0% 0% 0% round 16px)', duration: 1.1, ease: 'power3.out', delay: (i % 3) * 0.08,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });

    const mm = gsap.matchMedia();
    let funnelState = null, offerState = null;

    // ---- первый экран: при прокрутке строки разъезжаются, знак растёт ----
    const hero = app.querySelector('#hero');
    if (hero) {
      gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: '+=90%', scrub: 0.6, pin: true, anticipatePin: 1,
        onUpdate: (st) => { if (swarmOn) W.set('progress', st.progress); } } })
        .to(hero.querySelector('.hero-title'), { yPercent: -20, opacity: 0.08, scale: 0.94, transformOrigin: 'left bottom', ease: 'none' }, 0)
        .to(hero.querySelectorAll('.hero-top, .hero-bottom, .counters, .scroll-cue'), { y: -60, opacity: 0, ease: 'none', stagger: 0.04 }, 0);
    }

    // ---- бегущая строка: скорость и наклон от скорости прокрутки ----
    const mq = app.querySelector('.mq-track');
    if (mq) {
      const loop = gsap.to(mq, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
      let skew = gsap.quickTo(mq, 'skewX', { duration: 0.4, ease: 'power3' });
      ScrollTrigger.create({ trigger: mq, start: 'top bottom', end: 'bottom top',
        onUpdate: (st) => { const v = st.getVelocity(); loop.timeScale(clamp(1 + Math.abs(v) / 250, 1, 8) * (st.direction < 0 ? -1 : 1)); skew(clamp(v / -300, -12, 12)); } });
      ScrollTrigger.addEventListener('scrollEnd', () => { gsap.to(loop, { timeScale: loop.timeScale() < 0 ? -1 : 1, duration: 0.6 }); skew(0); });
    }

    // ---- боли: заголовки «заливаются» белым ----
    app.querySelectorAll('[data-fill]').forEach((el) => {
      gsap.fromTo(el, { backgroundPositionX: '100%' }, { backgroundPositionX: '0%', ease: 'none', scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 45%', scrub: true } });
    });
    app.querySelectorAll('.pain-line').forEach((el) => gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 60%', scrub: true } }));

    // ---- воронка: экран замирает, этапы по очереди ----
    const fun = app.querySelector('#funnel');
    if (fun) {
      const st = Array.from(fun.querySelectorAll('.stage')), big = Array.from(fun.querySelectorAll('.fb'));
      const n = st.length;
      let last = -1;
      const setStage = (k) => {
        if (k === last) return; last = k;
        st.forEach((el, i) => { el.classList.toggle('on', i === k); el.classList.toggle('done', i < k); });
        big.forEach((el, i) => el.classList.toggle('on', i === k));
        if (swarmOn) W.go('funnel' + k);
      };
      funnelState = () => 'funnel' + Math.max(0, last);
      ScrollTrigger.create({ trigger: fun, start: 'top top', end: '+=' + (n * 70) + '%', pin: true, anticipatePin: 1, scrub: true,
        onUpdate: (s) => {
          const k = Math.min(n - 1, Math.floor(s.progress * n));
          setStage(k);
          st.forEach((el, i) => el.querySelector('.st-bar b').style.transform = 'scaleX(' + clamp(s.progress * n - i, 0, 1) + ')');
        },
        onEnter: () => setStage(Math.max(0, last)), onEnterBack: () => { const k = last; last = -1; setStage(k < 0 ? n - 1 : k); } });
      setStage(0);
    }

    // ---- оффер: $1000 → $500 → гарантия ----
    const off = app.querySelector('#offer');
    if (off) {
      const layers = Array.from(off.querySelectorAll('.o-layer')), dots = Array.from(off.querySelectorAll('.o-dots i'));
      const shapes = off.dataset.layers.split(',');
      const n = layers.length;
      let last = -1;
      const setL = (k, force) => {
        if (k === last && !force) return; last = k;
        layers.forEach((l, i) => l.classList.toggle('on', i === k));
        dots.forEach((dt, i) => dt.classList.toggle('on', i <= k));
        if (swarmOn) { W.go('offer-' + shapes[k]); if (shapes[k] === 'new') W.burst(0.18); }
      };
      offerState = () => 'offer-' + shapes[Math.max(0, last)];
      ScrollTrigger.create({ trigger: off, start: 'top top', end: '+=' + (n * 80) + '%', pin: true, anticipatePin: 1,
        onUpdate: (s) => setL(Math.min(n - 1, Math.floor(s.progress * n))),
        onEnter: () => setL(Math.max(0, last), true), onEnterBack: () => setL(last < 0 ? n - 1 : last, true) });
      setL(0);
    }

    // ---- как работаем: горизонтальная прокрутка (компьютер) ----
    const proc = app.querySelector('#process');
    if (proc) {
      mm.add('(min-width: 900px)', () => {
        const track = proc.querySelector('.proc-track');
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth + 64);
        gsap.to(track, { x: () => -dist(), ease: 'none',
          scrollTrigger: { trigger: proc.querySelector('.proc-pin'), start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true } });
      });
      mm.add('(max-width: 899px)', () => {
        proc.querySelectorAll('.proc-card').forEach((c) => gsap.from(c, { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 90%', once: true } }));
      });
    }

    // ---- рой: какая фигура в какой секции ----
    if (swarmOn) {
      // какая секция сейчас в центре экрана — такая и фигура
      const scenes = Array.from(app.querySelectorAll('[data-scene]'));
      const pick = () => {
        const mid = window.innerHeight * 0.55;
        let sec = scenes[0];
        for (const el of scenes) { const r = el.getBoundingClientRect(); if (r.top <= mid) sec = el; }
        if (!sec) return;
        const key = sec.dataset.scene;
        if (key === 'funnel' && funnelState) W.go(funnelState());
        else if (key === 'offer' && offerState) W.go(offerState());
        else if (key === 'form' && App.formDone) W.go('check');
        else W.go(key);
      };
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: pick, onRefresh: pick });
      // скорость прокрутки → скорость трассы и вращения
      let vel = 0;
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { vel = s.getVelocity(); W.set('speed', vel); } });
      ScrollTrigger.addEventListener('scrollEnd', () => W.set('speed', 0));
    }

    initCursor();
    ScrollTrigger.refresh();
  }

  /* ---------- первый экран: вход после прелоадера ---------- */
  function heroIntro() {
    const hero = app.querySelector('#hero');
    if (!hero) return;
    const chars = hero.querySelectorAll('.hero-title .c');
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from(chars, { yPercent: 120, rotate: 8, duration: 1.2, stagger: 0.022 }, 0.1)
      .from(hero.querySelectorAll('[data-fade]'), { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out' }, 0.5)
      .from(hero.querySelector('.scroll-cue'), { opacity: 0, duration: 1 }, 1.2);
    hero.querySelectorAll('[data-count]').forEach((el, i) => countUp(el, 0.9 + i * 0.15));
  }

  /* ---------- прелоадер ---------- */
  const preloader = (() => {
    const el = document.getElementById('preloader');
    const num = el && el.querySelector('.pl-num'), bar = el && el.querySelector('.pl-bar i');
    let shown = 0, target = 0, done = false, raf = 0;
    const t0 = performance.now();
    const tick = () => {
      shown += (target - shown) * 0.12;
      if (num) num.textContent = pad2(Math.min(100, Math.round(shown)));
      if (bar) bar.style.transform = 'scaleX(' + shown / 100 + ')';
      if (!done) raf = requestAnimationFrame(tick);
    };
    if (el) raf = requestAnimationFrame(tick);
    return {
      set(p) { target = Math.max(target, p); },
      finish() {
        return new Promise((resolve) => {
          if (!el) { resolve(); return; }
          target = 100;
          const wait = Math.max(0, 900 - (performance.now() - t0));
          setTimeout(() => {
            done = true; cancelAnimationFrame(raf);
            if (num) num.textContent = '100'; if (bar) bar.style.transform = 'scaleX(1)';
            if (MOTION) {
              gsap.timeline({ onComplete: () => { el.remove(); } })
                .to(el.querySelector('.pl-in'), { yPercent: -40, opacity: 0, duration: 0.6, ease: 'power3.in' })
                .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut' }, '-=0.25')
                .add(resolve, '-=0.6');
            } else { el.remove(); resolve(); }
          }, wait);
        });
      },
    };
  })();

  /* ---------------- запуск ---------------- */
  async function init() {
    const hdr = document.getElementById('hdr'), ftr = document.getElementById('ftr');
    if (!sb) { preloader.finish(); App.notice(app, ui('not_configured')); return; }
    preloader.set(20);
    try {
      const listOpts = (x) => x.eq('visible', true).order('sort');
      const [common, pains, services, steps, faq, team, cases] = await Promise.all([
        App.loadCommon(),
        q('pains', listOpts), q('services', listOpts), q('steps', listOpts), q('faq', listOpts), q('team', listOpts),
        q('cases', (x) => x.eq('status', 'published').order('sort')),
      ]);
      preloader.set(60);
      const d = Object.assign({}, common, { pains, services, steps, faq, team, cases });
      if (!d.sections.some((x) => x.key === 'funnel')) d.sections = d.sections.concat([FUNNEL_DEFAULT]).sort((a, b) => a.sort - b.sort);
      d.idx = {}; let n = 1;
      d.sections.forEach((s) => { if (s.enabled && R[s.key] && s.key !== 'hero') d.idx[s.key] = ++n; });
      App.data = d;
      App.renderHeader(hdr, d, { home: true });
      app.innerHTML = d.sections.filter((s) => s.enabled && R[s.key]).map((s) => {
        const html = R[s.key](s, d);
        return s.key === 'hero' ? html + marquee(d) : html;
      }).join('');
      App.renderFooter(ftr, d);
      ftr.insertAdjacentHTML('afterbegin', '<div class="footer-giant" aria-hidden="true">' + esc(d.settings.agency_name || '') + '</div>');
      initForm(d);
      initScroll();
      const past = () => document.body.classList.toggle('past-hero', window.scrollY > window.innerHeight * 0.8);
      window.addEventListener('scroll', past, { passive: true }); past();
      app.querySelectorAll('.faq-item').forEach((det) => det.addEventListener('toggle', () => {
        if (det.open) app.querySelectorAll('.faq-item[open]').forEach((o) => { if (o !== det) o.open = false; });
      }));

      // рой частиц
      const canvas = document.getElementById('swarm');
      let swarmOk = false;
      if (canvas && window.Swarm && !REDUCE) {
        try { await (document.fonts && document.fonts.ready); } catch (e) { /* ничего */ }
        swarmOk = window.Swarm.init(canvas);
        if (swarmOk) { defineSwarm(d); document.documentElement.classList.add('has-swarm'); }
      }
      preloader.set(90);
      if (MOTION) initMotion(d); else App.reveal(app);
      await preloader.finish();
      if (swarmOk) window.Swarm.go(app.querySelector('#hero') ? 'hero' : 'cases');
      if (MOTION) heroIntro();
      if (location.hash) { const t = document.querySelector(location.hash); if (t) setTimeout(() => { const y = t.getBoundingClientRect().top + scrollY; if (lenis) lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y); }, 80); }
    } catch (err) {
      console.error(err);
      preloader.finish();
      App.notice(app, ui('load_error'));
    }
  }

  App._test = { fmtPhone, validContact, buildMessage };
  init();
})();

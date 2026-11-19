/* Общий код для index.html и case.html: подключение к базе, языки, шапка, подвал. */
(function () {
  'use strict';

  const CFG = window.APP_CONFIG || {};
  const configured = CFG.SUPABASE_URL && !/YOUR-PROJECT/.test(CFG.SUPABASE_URL) &&
    CFG.SUPABASE_ANON_KEY && !/YOUR-ANON/.test(CFG.SUPABASE_ANON_KEY);
  const sb = configured && window.supabase
    ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY)
    : null;

  /* ---------- язык ---------- */
  const LANGS = ['ru', 'uz'];
  function detectLang() {
    const q = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(q)) { store('lang', q); return q; }
    const s = store('lang');
    return LANGS.includes(s) ? s : 'ru';
  }
  function store(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      localStorage.setItem(k, v);
    } catch (e) { return null; }
  }
  let lang = detectLang();
  document.documentElement.lang = lang === 'uz' ? 'uz-Latn' : 'ru';

  /* Мелкие надписи интерфейса (кнопки формы, меню). Основные тексты — в базе. */
  const UI = {
    ru: {
      menu: 'Меню', close: 'Закрыть', cta: 'Получить разбор', loading: 'Загрузка…',
      not_configured: 'Сайт ещё не подключён к базе. Откройте config.js и вставьте ключи Supabase (SETUP.md, шаг 3).',
      load_error: 'Не удалось загрузить данные. Обновите страницу.',
      old_price: 'обычная цена', case_more: 'Смотреть кейс', cases_empty: 'Кейсы скоро появятся',
      f_name: 'Ваше имя', f_contact: 'Телефон или Telegram @username', f_school: 'Название автошколы',
      f_city: 'Город', f_branches: 'Филиалов', f_students: 'Учеников в месяц сейчас', f_budget: 'Рекламный бюджет в месяц',
      f_problem: 'Главная проблема', f_problem_ph: 'Например: заявки есть, но не доходят до пробного',
      city_tashkent: 'Ташкент', city_other: 'Другой город',
      students_1: 'до 20', budget_unknown: 'не знаю',
      send_tg: 'Отправить в Telegram', send_wa: 'Отправить в WhatsApp', send: 'Отправить заявку',
      sending: 'Отправляем…', consent: 'Нажимая кнопку, вы соглашаетесь на обработку контактных данных.',
      err_required: 'Заполните это поле', err_contact: 'Введите телефон +998 XX XXX-XX-XX или @username',
      err_choose: 'Выберите вариант', open_tg: 'Открыть Telegram', open_wa: 'Открыть WhatsApp',
      again: 'Отправить ещё одну заявку', success_title: 'Спасибо!',
      tg_float: 'Написать в Telegram',
      case_school: 'Автошкола', case_city: 'Город', case_duration: 'Срок работы',
      case_before: 'Было', case_after: 'Стало', case_numbers: 'Цифры: было → стало',
      case_task: 'Задача', case_done: 'Что сделали', case_result: 'Результат', case_gallery: 'Скриншоты и креативы',
      case_video: 'Смотреть Reels', case_cta_title: 'Хотите так же?', case_cta_text: 'Оставьте заявку — разберём вашу автошколу бесплатно.',
      case_cta: 'Хочу так же', case_other: 'Другие кейсы', case_back: 'Все кейсы', case_notfound: 'Кейс не найден или ещё не опубликован.',
      case_share: 'Скопировать ссылку', copied: 'Ссылка скопирована', footer_rights: 'Все права защищены',
      msg_title: 'Заявка с сайта', msg_name: 'Имя', msg_contact: 'Контакт', msg_school: 'Автошкола', msg_city: 'Город',
      msg_branches: 'Филиалов', msg_students: 'Учеников в месяц', msg_budget: 'Бюджет', msg_problem: 'Проблема',
    },
    uz: {
      menu: 'Menyu', close: 'Yopish', cta: 'Tahlil olish', loading: 'Yuklanmoqda…',
      not_configured: 'Sayt hali bazaga ulanmagan. config.js faylini oching va Supabase kalitlarini kiriting (SETUP.md, 3-qadam).',
      load_error: 'Maʼlumotlarni yuklab boʻlmadi. Sahifani yangilang.',
      old_price: 'odatiy narx', case_more: 'Keysni koʻrish', cases_empty: 'Keyslar tez orada paydo boʻladi',
      f_name: 'Ismingiz', f_contact: 'Telefon yoki Telegram @username', f_school: 'Avtomaktab nomi',
      f_city: 'Shahar', f_branches: 'Filiallar soni', f_students: 'Hozir oyiga oʻquvchilar', f_budget: 'Oylik reklama byudjeti',
      f_problem: 'Asosiy muammo', f_problem_ph: 'Masalan: arizalar bor, lekin sinov darsigacha yetib kelmaydi',
      city_tashkent: 'Toshkent', city_other: 'Boshqa shahar',
      students_1: '20 gacha', budget_unknown: 'bilmayman',
      send_tg: 'Telegramga yuborish', send_wa: 'WhatsAppga yuborish', send: 'Arizani yuborish',
      sending: 'Yuborilmoqda…', consent: 'Tugmani bosish orqali kontakt maʼlumotlaringizni qayta ishlashga rozilik bildirasiz.',
      err_required: 'Bu maydonni toʻldiring', err_contact: 'Telefon +998 XX XXX-XX-XX yoki @username kiriting',
      err_choose: 'Variantni tanlang', open_tg: 'Telegramni ochish', open_wa: 'WhatsAppni ochish',
      again: 'Yana ariza yuborish', success_title: 'Rahmat!',
      tg_float: 'Telegramga yozish',
      case_school: 'Avtomaktab', case_city: 'Shahar', case_duration: 'Ish muddati',
      case_before: 'Oldin', case_after: 'Keyin', case_numbers: 'Raqamlar: oldin → keyin',
      case_task: 'Vazifa', case_done: 'Nima qildik', case_result: 'Natija', case_gallery: 'Skrinshotlar va kreativlar',
      case_video: 'Reelsni koʻrish', case_cta_title: 'Sizga ham shunday kerakmi?', case_cta_text: 'Ariza qoldiring — avtomaktabingizni bepul tahlil qilamiz.',
      case_cta: 'Menga ham shunday', case_other: 'Boshqa keyslar', case_back: 'Barcha keyslar', case_notfound: 'Keys topilmadi yoki hali eʼlon qilinmagan.',
      case_share: 'Havolani nusxalash', copied: 'Havola nusxalandi', footer_rights: 'Barcha huquqlar himoyalangan',
      msg_title: 'Saytdan ariza', msg_name: 'Ism', msg_contact: 'Kontakt', msg_school: 'Avtomaktab', msg_city: 'Shahar',
      msg_branches: 'Filiallar', msg_students: 'Oyiga oʻquvchilar', msg_budget: 'Byudjet', msg_problem: 'Muammo',
    },
  };
  const ui = (k) => (UI[lang] && UI[lang][k]) || UI.ru[k] || k;

  /* ---------- помощники ---------- */
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* Значение поля на текущем языке (если узбекского нет — берём русский) */
  const tr = (obj, field) => {
    if (!obj) return '';
    const v = obj[field + '_' + lang];
    return (v != null && String(v).trim() !== '') ? v : (obj[field + '_ru'] || '');
  };

  /* *слово* → красное слово; перенос строки → <br> */
  const hl = (s) => esc(s).replace(/\*([^*]+)\*/g, '<span class="hl">$1</span>').replace(/\n/g, '<br>');

  /* Текст из админки → абзацы и списки (строки, начинающиеся с "- " или "• ") */
  function rich(s) {
    const lines = String(s || '').split(/\r?\n/);
    let html = '', list = [];
    const flush = () => { if (list.length) { html += '<ul class="tri">' + list.map((l) => '<li>' + hl(l) + '</li>').join('') + '</ul>'; list = []; } };
    lines.forEach((line) => {
      const m = line.match(/^\s*[-•▲]\s+(.*)$/);
      if (m) list.push(m[1]);
      else { flush(); if (line.trim()) html += '<p>' + hl(line) + '</p>'; }
    });
    flush();
    return html;
  }

  /* Безопасная внешняя ссылка */
  const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '');
  /* Картинка: https-ссылка (или data:image) */
  const safeImg = (u) => (/^(https?:\/\/|data:image\/)/i.test(String(u || '').trim()) ? String(u).trim() : '');

  /* ---------- контакты и мессенджеры ---------- */
  const tgUser = (v) => String(v || '').trim().replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
  const waDigits = (v) => String(v || '').replace(/\D/g, '');
  const tgLink = (v, text) => { const u = tgUser(v); return u ? 'https://t.me/' + encodeURIComponent(u) + (text ? '?text=' + encodeURIComponent(text) : '') : ''; };
  const waLink = (v, text) => { const d = waDigits(v); return d ? 'https://wa.me/' + d + (text ? '?text=' + encodeURIComponent(text) : '') : ''; };
  const igLink = (v) => {
    const s = String(v || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) return s;
    return 'https://instagram.com/' + encodeURIComponent(s.replace(/^@/, ''));
  };

  /* ---------- иконки ---------- */
  const I = (p) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  const ICONS = {
    target: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/><path d="M21 3l-7.5 7.5M17 3h4v4"/>'),
    video: I('<rect x="3" y="5" width="13" height="14" rx="2"/><path d="M16 10l5-3v10l-5-3"/>'),
    account: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    creative: I('<path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A4.6 4.6 0 0 0 21 9.8C21 6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>'),
    filter: I('<path d="M3 5h18l-7 8v6l-4 2v-8z"/>'),
    chart: I('<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>'),
    phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
    chat: I('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
    star: I('<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>'),
    road: I('<path d="M8 3L4 21M16 3l4 18M12 4v3M12 10v3M12 16v3"/>'),
  };
  const ICON_TG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.9 4.3l-3.2 15.2c-.2 1-.9 1.3-1.7.8l-4.8-3.6-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2l-11 6.9-4.7-1.5c-1-.3-1-1 .2-1.5L20.6 3c.9-.3 1.6.2 1.3 1.3z"/></svg>';
  const ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.3-.3-.4-.5-.5z"/></svg>';
  const ICON_IG = I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>');

  /* Знак «У» — учебный автомобиль */
  const SIGN_U = '<svg class="sign-u" viewBox="0 0 100 88" aria-hidden="true"><path d="M50 4L96 84H4z" fill="#0B0B0D" stroke="#E0352B" stroke-width="7" stroke-linejoin="round"/><text x="50" y="72" text-anchor="middle" font-family="Oswald, sans-serif" font-weight="700" font-size="44" fill="#fff">У</text></svg>';

  /* ---------- загрузка данных ---------- */
  async function q(table, build) {
    let query = sb.from(table).select('*');
    if (build) query = build(query);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  async function loadCommon() {
    const [settingsRows, sections] = await Promise.all([
      q('settings', (x) => x.eq('id', 1)),
      q('sections', (x) => x.order('sort')),
    ]);
    return { settings: (settingsRows[0] && settingsRows[0].data) || {}, sections };
  }

  /* ---------- шапка, подвал, переключатель языка ---------- */
  function langSwitch() {
    return '<div class="lang" role="group" aria-label="Language">' + LANGS.map((l) =>
      '<button type="button" data-lang="' + l + '" class="' + (l === lang ? 'on' : '') + '" aria-pressed="' + (l === lang) + '">' + l.toUpperCase() + '</button>').join('') + '</div>';
  }
  function logo(settings, href) {
    return '<a class="logo" href="' + href + '"><span class="logo-mark" aria-hidden="true"></span><span class="logo-text">' + esc(settings.agency_name || 'AGENCY') + '</span></a>';
  }

  function renderHeader(el, ctx, opts) {
    const base = opts.home ? '' : 'index.html';
    const links = ctx.sections.filter((s) => s.enabled && s.key !== 'hero' && tr(s, 'menu'))
      .map((s) => '<a href="' + base + '#' + s.key + '">' + esc(tr(s, 'menu')) + '</a>').join('');
    const formOn = ctx.sections.some((s) => s.key === 'form' && s.enabled);
    const tg = tgLink(ctx.settings.telegram);
    const cta = formOn ? '<a class="btn btn-primary btn-sm" href="' + base + '#form">' + esc(ui('cta')) + '</a>'
      : (tg ? '<a class="btn btn-primary btn-sm" href="' + esc(tg) + '" target="_blank" rel="noopener">' + esc(ui('cta')) + '</a>' : '');
    el.innerHTML =
      '<div class="container header-in">' + logo(ctx.settings, opts.home ? '#top' : 'index.html') +
      '<nav class="nav" id="nav" aria-label="Main">' + links + '</nav>' +
      '<div class="header-r">' + langSwitch() + '<span class="hide-m">' + cta + '</span>' +
      '<button class="burger" type="button" aria-label="' + esc(ui('menu')) + '" aria-expanded="false" aria-controls="nav"><span></span><span></span></button></div></div>';

    const burger = el.querySelector('.burger');
    burger.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    el.querySelectorAll('.nav a').forEach((a) => a.addEventListener('click', () => {
      document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false');
    }));
    el.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
      store('lang', b.dataset.lang);
      const u = new URL(location.href); u.searchParams.delete('lang');
      location.href = u.toString();
    }));
    const onScroll = () => el.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  function renderFooter(el, ctx) {
    const s = ctx.settings;
    const items = [];
    if (s.telegram) items.push('<a href="' + esc(tgLink(s.telegram)) + '" target="_blank" rel="noopener">' + ICON_TG + '<span>@' + esc(tgUser(s.telegram)) + '</span></a>');
    if (s.whatsapp) items.push('<a href="' + esc(waLink(s.whatsapp)) + '" target="_blank" rel="noopener">' + ICON_WA + '<span>WhatsApp</span></a>');
    if (s.phone) items.push('<a href="tel:' + esc(String(s.phone).replace(/[^\d+]/g, '')) + '">' + ICONS.phone + '<span>' + esc(s.phone) + '</span></a>');
    if (s.instagram) items.push('<a href="' + esc(igLink(s.instagram)) + '" target="_blank" rel="noopener">' + ICON_IG + '<span>Instagram</span></a>');
    el.innerHTML =
      '<div class="footer-road" aria-hidden="true"></div>' +
      '<div class="container footer-in">' +
      '<div class="footer-brand">' + logo(s, 'index.html') + '<p class="muted">' + esc(tr(s, 'footer_text')) + '</p></div>' +
      '<div class="footer-contacts">' + items.join('') + '</div></div>' +
      '<div class="container footer-bottom muted">© ' + new Date().getFullYear() + ' ' + esc(s.agency_name || '') + '. ' + esc(ui('footer_rights')) + '</div>';

    // Плавающая кнопка Telegram (видна только на мобильных — см. CSS)
    if (s.telegram && !document.querySelector('.tg-float')) {
      const a = document.createElement('a');
      a.className = 'tg-float'; a.href = tgLink(s.telegram); a.target = '_blank'; a.rel = 'noopener';
      a.setAttribute('aria-label', ui('tg_float')); a.innerHTML = ICON_TG;
      document.body.appendChild(a);
    }
  }

  function notice(el, text) {
    el.innerHTML = '<div class="container notice">' + esc(text) + '</div>';
  }

  /* Появление блоков при прокрутке */
  function reveal(root) {
    const els = (root || document).querySelectorAll('.rv');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((e) => io.observe(e));
  }

  function caseCard(c) {
    const cover = safeImg(c.cover_url)
      ? '<img src="' + esc(c.cover_url) + '" alt="" loading="lazy">'
      : '<div class="cover-ph" aria-hidden="true">' + SIGN_U + '</div>';
    return '<a class="card case-card rv" href="case.html?slug=' + encodeURIComponent(c.slug) + '">' +
      '<div class="case-cover">' + cover + '</div>' +
      '<div class="case-body"><span class="case-school">' + esc(c.school) + (tr(c, 'city') ? ' · ' + esc(tr(c, 'city')) : '') + '</span>' +
      '<h3 class="h-sm">' + esc(tr(c, 'title')) + '</h3>' +
      (c.main_value ? '<div class="case-main"><b>' + esc(c.main_value) + '</b><span>' + esc(tr(c, 'main_label')) + '</span></div>' : '') +
      '<span class="case-more">' + esc(ui('case_more')) + ' →</span></div></a>';
  }

  window.App = {
    sb, configured, lang, ui, tr, esc, hl, rich, safeUrl, safeImg, q, loadCommon,
    tgUser, waDigits, tgLink, waLink, igLink, ICONS, ICON_TG, ICON_WA, ICON_IG, SIGN_U,
    renderHeader, renderFooter, notice, reveal, caseCard,
  };
})();

/* Админ-панель. Все изменения сразу пишутся в Supabase. */
(function () {
  'use strict';
  const sb = App.sb, esc = App.esc;
  const BUCKET = (window.APP_CONFIG || {}).STORAGE_BUCKET || 'media';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const view = () => $('#view');

  /* ================= мелкие помощники ================= */
  function toast(msg, isErr) {
    let box = $('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast' + (isErr ? ' err' : ''); t.textContent = msg;
    box.appendChild(t); setTimeout(() => t.remove(), isErr ? 6000 : 2600);
  }
  function errText(e) {
    const m = (e && (e.message || e.error_description || e.msg)) || String(e);
    if (/row-level security|permission denied|not authorized|Unauthorized/i.test(m)) return 'Нет прав. Проверьте, что ваш аккаунт добавлен в админы (SETUP.md, шаг 5).';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Нет связи с сервером. Проверьте интернет.';
    if (/duplicate key.*slug/i.test(m)) return 'Кейс с такой ссылкой уже существует.';
    return 'Ошибка: ' + m;
  }
  async function run(promise) {
    const r = await promise;
    if (r && r.error) throw r.error;
    return r ? r.data : null;
  }
  const uid = () => Math.random().toString(36).slice(2, 10);
  const val = (o, k) => (o && o[k] != null ? o[k] : '');

  function field(label, name, value, opts) {
    opts = opts || {};
    const id = 'f_' + uid();
    const ctrl = opts.area
      ? '<textarea id="' + id + '" name="' + name + '" rows="' + (opts.rows || 4) + '" placeholder="' + esc(opts.ph || '') + '">' + esc(value) + '</textarea>'
      : '<input id="' + id + '" type="' + (opts.type || 'text') + '" name="' + name + '" value="' + esc(value) + '" placeholder="' + esc(opts.ph || '') + '"' + (opts.readonly ? ' readonly' : '') + '>';
    return '<label class="f ' + (opts.cls || '') + '" for="' + id + '"' + '><span' + (opts.lang ? ' data-lang="' + opts.lang + '"' : '') + '>' + esc(label) + (opts.sub ? ' <em>' + esc(opts.sub) + '</em>' : '') + '</span>' + ctrl +
      (opts.hint ? '<small class="hint">' + opts.hint + '</small>' : '') + '</label>';
  }
  function pair(label, base, obj, opts) {
    opts = opts || {};
    return '<div class="pair">' +
      field(label, base + '_ru', val(obj, base + '_ru'), Object.assign({}, opts, { lang: 'RU', cls: 'ru', hint: opts.hint })) +
      field(label, base + '_uz', val(obj, base + '_uz'), Object.assign({}, opts, { lang: 'UZ', cls: 'uz', hint: '' })) + '</div>';
  }
  function collect(root) {
    const out = {};
    $$('[name]', root).forEach((el) => {
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
      else out[el.name] = el.value.trim();
    });
    return out;
  }
  function switchHtml(name, checked, label) {
    return '<label class="switch"><input type="checkbox" ' + (name ? 'name="' + name + '" ' : '') + (checked ? 'checked' : '') + '><i></i>' + (label ? '<span>' + esc(label) + '</span>' : '') + '</label>';
  }

  /* Модальное окно с формой */
  function modal(title, bodyHtml, onSave) {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = '<form class="modal-box" novalidate><div class="modal-head"><h2>' + esc(title) + '</h2><button type="button" class="icon-btn" data-close aria-label="Закрыть">✕</button></div>' +
      bodyHtml + '<div class="modal-foot"><button type="button" class="btn btn-ghost" data-close>Отмена</button><button type="submit" class="btn btn-primary">Сохранить</button></div></form>';
    const close = () => { m.remove(); document.removeEventListener('keydown', esc_); };
    const esc_ = (e) => { if (e.key === 'Escape') close(); };
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', esc_);
    const form = $('form', m);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('[type=submit]', form); btn.disabled = true;
      try { await onSave(form); close(); toast('Сохранено'); } catch (err) { console.error(err); toast(errText(err), true); } finally { btn.disabled = false; }
    });
    document.body.appendChild(m);
    const first = $('input, textarea, select', m); if (first) first.focus();
    return m;
  }

  /* ================= картинки: сжатие и загрузка ================= */
  function compressImage(file, max, quality) {
    max = max || 1600; quality = quality || 0.82;
    return new Promise((resolve, reject) => {
      if (!/^image\//.test(file.type)) { reject(new Error('Это не картинка')); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob((b) => {
          if (b && b.type === 'image/webp') return resolve(b);
          c.toBlob((j) => (j ? resolve(j) : reject(new Error('Не удалось сжать картинку'))), 'image/jpeg', quality); // старый Safari
        }, 'image/webp', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Не удалось открыть картинку')); };
      img.src = url;
    });
  }
  async function uploadImage(file, folder) {
    const blob = await compressImage(file);
    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const path = folder + '/' + Date.now() + '-' + uid() + '.' + ext;
    await run(sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false }));
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  /* Поле «одна картинка» */
  function imageField(label, name, url, folder, square) {
    const id = 'img_' + uid();
    return '<div class="f" data-img="' + id + '" data-folder="' + folder + '"><span>' + esc(label) + '</span><div class="img-field">' +
      '<div class="img-prev' + (square ? ' sq' : '') + (url ? ' has' : '') + '" style="' + (url ? 'background-image:url(&quot;' + esc(url) + '&quot;)' : '') + '">нет фото</div>' +
      '<div style="display:grid;gap:8px"><span class="btn btn-ghost btn-sm upl">📷 Загрузить фото<input type="file" accept="image/*"></span>' +
      '<button type="button" class="btn btn-danger btn-sm" data-remove' + (url ? '' : ' hidden') + '>Убрать</button><span class="progress" hidden>Загрузка…</span></div></div>' +
      '<input type="hidden" name="' + name + '" value="' + esc(url) + '"></div>';
  }
  function bindImageFields(root) {
    $$('[data-img]', root).forEach((box) => {
      const input = $('input[type=hidden]', box), prev = $('.img-prev', box), rm = $('[data-remove]', box), prog = $('.progress', box);
      const set = (u) => { input.value = u; prev.style.backgroundImage = u ? 'url("' + u + '")' : ''; prev.classList.toggle('has', !!u); rm.hidden = !u; };
      $('input[type=file]', box).addEventListener('change', async (e) => {
        const file = e.target.files[0]; if (!file) return;
        prog.hidden = false;
        try { set(await uploadImage(file, box.dataset.folder)); toast('Фото загружено'); } catch (err) { toast(errText(err), true); }
        prog.hidden = true; e.target.value = '';
      });
      rm.addEventListener('click', () => set(''));
    });
  }

  /* Сортировка перетаскиванием (+ запасной вариант кнопками ↑↓) */
  function makeSortable(list, onChange) {
    if (window.Sortable) window.Sortable.create(list, { handle: '.drag', animation: 150, onEnd: onChange, delay: 0, fallbackTolerance: 3 });
    list.addEventListener('click', (e) => {
      const b = e.target.closest('[data-move]'); if (!b) return;
      const li = b.closest('li'); const dir = b.dataset.move;
      if (dir === 'up' && li.previousElementSibling) li.parentNode.insertBefore(li, li.previousElementSibling);
      else if (dir === 'down' && li.nextElementSibling) li.parentNode.insertBefore(li.nextElementSibling, li);
      else return;
      onChange();
    });
  }
  async function saveOrder(table, keyCol, list) {
    const ids = $$('li[data-id]', list).map((li) => li.dataset.id);
    try {
      await Promise.all(ids.map((id, i) => run(sb.from(table).update({ sort: i + 1 }).eq(keyCol, id))));
      toast('Порядок сохранён');
    } catch (err) { toast(errText(err), true); }
  }
  const moveBtns = '<button type="button" class="icon-btn" data-move="up" title="Выше">↑</button><button type="button" class="icon-btn" data-move="down" title="Ниже">↓</button>';

  /* Транслитерация для адреса кейса */
  const TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', қ: 'q', ғ: 'g', ҳ: 'h', ў: 'o' };
  function slugify(s) {
    return String(s || '').toLowerCase().replace(/\[.*?\]/g, ' ').split('').map((ch) => (TR[ch] != null ? TR[ch] : ch)).join('')
      .replace(/[ʻʼ'’`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'case';
  }
  async function uniqueSlug(base, exceptId) {
    const rows = await run(sb.from('cases').select('id, slug').like('slug', base + '%'));
    const taken = new Set((rows || []).filter((r) => r.id !== exceptId).map((r) => r.slug));
    if (!taken.has(base)) return base;
    let i = 2; while (taken.has(base + '-' + i)) i++;
    return base + '-' + i;
  }

  /* ================= ЗАЯВКИ ================= */
  const STATUSES = [['new', 'Новая'], ['in_progress', 'В работе'], ['client', 'Клиент'], ['rejected', 'Отказ']];
  const CITIES = ['Ташкент', 'Другой'];
  const BUDGETS = ['до $300', '$300–700', '$700+', 'не знаю'];
  let leadsCache = [];

  async function viewLeads() {
    view().innerHTML = '<div class="page-head"><div><h1>Заявки</h1><p class="muted">Все заявки с сайта. Меняйте статус прямо в таблице.</p></div>' +
      '<button class="btn btn-primary" id="csvBtn">⬇ Экспорт в CSV</button></div>' +
      '<div class="filters"><input type="search" class="search" id="fSearch" placeholder="Поиск: имя, телефон, автошкола">' +
      '<select id="fCity"><option value="">Все города</option>' + CITIES.map((c) => '<option>' + c + '</option>').join('') + '</select>' +
      '<select id="fBudget"><option value="">Любой бюджет</option>' + BUDGETS.map((c) => '<option>' + c + '</option>').join('') + '</select>' +
      '<select id="fStatus"><option value="">Все статусы</option>' + STATUSES.map((s) => '<option value="' + s[0] + '">' + s[1] + '</option>').join('') + '</select></div>' +
      '<div class="stats" id="stats"></div><div id="leadsBox"><div class="empty">Загрузка…</div></div>';
    try {
      leadsCache = await run(sb.from('leads').select('*').order('created_at', { ascending: false }).limit(2000)) || [];
    } catch (err) { $('#leadsBox').innerHTML = '<div class="empty">' + esc(errText(err)) + '</div>'; return; }
    ['fSearch', 'fCity', 'fBudget', 'fStatus'].forEach((id) => $('#' + id).addEventListener('input', drawLeads));
    $('#csvBtn').addEventListener('click', () => exportCsv(filteredLeads()));
    drawLeads();
  }
  function filteredLeads() {
    const s = $('#fSearch').value.trim().toLowerCase(), c = $('#fCity').value, b = $('#fBudget').value, st = $('#fStatus').value;
    return leadsCache.filter((l) => (!c || l.city === c) && (!b || l.budget === b) && (!st || l.status === st) &&
      (!s || [l.name, l.contact, l.school, l.problem, l.note].join(' ').toLowerCase().includes(s)));
  }
  const fmtDate = (d) => new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  function contactLink(c) {
    c = String(c || '');
    if (c[0] === '@') return '<a href="https://t.me/' + encodeURIComponent(c.slice(1)) + '" target="_blank" rel="noopener">' + esc(c) + '</a>';
    const d = c.replace(/\D/g, '');
    return d ? '<a href="tel:+' + d + '">' + esc(c) + '</a>' : esc(c);
  }
  function statusSelect(l) {
    return '<select data-status="' + l.id + '" class="st-' + l.status + '">' + STATUSES.map((s) => '<option value="' + s[0] + '"' + (s[0] === l.status ? ' selected' : '') + '>' + s[1] + '</option>').join('') + '</select>';
  }
  function drawLeads() {
    const rows = filteredLeads();
    const cnt = (st) => leadsCache.filter((l) => l.status === st).length;
    $('#stats').innerHTML = '<span class="stat"><b>' + rows.length + '</b>показано</span>' + STATUSES.map((s) => '<span class="stat"><b>' + cnt(s[0]) + '</b>' + s[1] + '</span>').join('');
    if (!rows.length) { $('#leadsBox').innerHTML = '<div class="empty">Заявок пока нет' + (leadsCache.length ? ' по этому фильтру' : '') + '</div>'; return; }
    const table = '<div class="table-wrap"><table class="leads"><thead><tr><th>Дата</th><th>Имя</th><th>Контакт</th><th>Автошкола</th><th>Город</th><th>Филиалов</th><th>Учеников</th><th>Бюджет</th><th>Проблема</th><th>Статус</th><th>Заметка</th><th></th></tr></thead><tbody>' +
      rows.map((l) => '<tr><td>' + fmtDate(l.created_at) + '</td><td><b>' + esc(l.name) + '</b></td><td>' + contactLink(l.contact) + (l.channel ? '<br><small class="muted">' + esc(l.channel) + '</small>' : '') + '</td><td>' + esc(l.school) + '</td><td>' + esc(l.city) + '</td><td>' + esc(l.branches) + '</td><td>' + esc(l.students) + '</td><td>' + esc(l.budget) + '</td><td class="prob">' + esc(l.problem) + '</td><td>' + statusSelect(l) + '</td>' +
        '<td><input class="note" data-note="' + l.id + '" value="' + esc(l.note) + '" placeholder="—"></td><td><button class="icon-btn danger" data-del="' + l.id + '" title="Удалить">🗑</button></td></tr>').join('') + '</tbody></table></div>';
    const cards = '<div class="lead-cards">' + rows.map((l) => '<div class="lead-card"><div class="lc-top"><b>' + esc(l.name) + '</b><small class="muted">' + fmtDate(l.created_at) + '</small></div>' +
      '<div>' + contactLink(l.contact) + '</div><dl><dt>Автошкола</dt><dd>' + esc(l.school) + '</dd><dt>Город</dt><dd>' + esc(l.city) + '</dd><dt>Филиалов</dt><dd>' + esc(l.branches) + '</dd><dt>Учеников</dt><dd>' + esc(l.students) + '</dd><dt>Бюджет</dt><dd>' + esc(l.budget) + '</dd>' +
      (l.problem ? '<dt>Проблема</dt><dd>' + esc(l.problem) + '</dd>' : '') + '</dl><input class="note" data-note="' + l.id + '" value="' + esc(l.note) + '" placeholder="Заметка">' +
      '<div class="lc-acts">' + statusSelect(l) + '<button class="icon-btn danger" data-del="' + l.id + '" title="Удалить">🗑</button></div></div>').join('') + '</div>';
    const box = $('#leadsBox'); box.innerHTML = table + cards;
    $$('[data-status]', box).forEach((s) => s.addEventListener('change', async () => {
      const id = s.dataset.status;
      try { await run(sb.from('leads').update({ status: s.value }).eq('id', id)); leadsCache.find((l) => l.id === id).status = s.value; toast('Статус обновлён'); drawLeads(); updateNewCount(); } catch (err) { toast(errText(err), true); }
    }));
    $$('[data-note]', box).forEach((inp) => inp.addEventListener('change', async () => {
      const id = inp.dataset.note;
      try { await run(sb.from('leads').update({ note: inp.value.trim() }).eq('id', id)); leadsCache.find((l) => l.id === id).note = inp.value.trim(); toast('Заметка сохранена'); } catch (err) { toast(errText(err), true); }
    }));
    $$('[data-del]', box).forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('Удалить заявку безвозвратно?')) return;
      try { await run(sb.from('leads').delete().eq('id', b.dataset.del)); leadsCache = leadsCache.filter((l) => l.id !== b.dataset.del); drawLeads(); updateNewCount(); toast('Удалено'); } catch (err) { toast(errText(err), true); }
    }));
  }
  function exportCsv(rows) {
    const cols = [['created_at', 'Дата'], ['name', 'Имя'], ['contact', 'Контакт'], ['school', 'Автошкола'], ['city', 'Город'], ['branches', 'Филиалов'], ['students', 'Учеников в месяц'], ['budget', 'Бюджет'], ['problem', 'Проблема'], ['status', 'Статус'], ['note', 'Заметка'], ['channel', 'Мессенджер'], ['lang', 'Язык'], ['page', 'Страница/UTM']];
    const st = Object.fromEntries(STATUSES);
    const cell = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const lines = [cols.map((c) => cell(c[1])).join(';')].concat(rows.map((l) => cols.map(([k]) =>
      cell(k === 'created_at' ? fmtDate(l[k]) : k === 'status' ? st[l[k]] : l[k])).join(';')));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'zayavki-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function updateNewCount() {
    try {
      const { count } = await sb.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new');
      const b = $('#newCnt'); b.hidden = !count; b.textContent = count || '';
    } catch (e) { /* не критично */ }
  }

  /* ================= КЕЙСЫ ================= */
  async function viewCases() {
    view().innerHTML = '<div class="page-head"><div><h1>Кейсы</h1><p class="muted">Перетаскивайте ⠿ чтобы поменять порядок на сайте.</p></div><a class="btn btn-primary" href="#case/new">+ Добавить кейс</a></div><div id="casesBox"><div class="empty">Загрузка…</div></div>';
    let rows;
    try { rows = await run(sb.from('cases').select('id, slug, status, sort, title_ru, school, cover_url, main_value').order('sort')); } catch (err) { $('#casesBox').innerHTML = '<div class="empty">' + esc(errText(err)) + '</div>'; return; }
    if (!rows.length) { $('#casesBox').innerHTML = '<div class="empty">Кейсов пока нет. Нажмите «Добавить кейс».</div>'; return; }
    $('#casesBox').innerHTML = '<ul class="rows" id="caseList">' + rows.map((c) =>
      '<li class="row" data-id="' + c.id + '"><span class="drag" title="Перетащить">⠿</span>' +
      (c.cover_url ? '<img class="thumb" src="' + esc(c.cover_url) + '" alt="">' : '<span class="thumb"></span>') +
      '<div class="grow"><b>' + esc(c.title_ru || '(без названия)') + '</b><small>' + esc(c.school) + (c.main_value ? ' · ' + esc(c.main_value) : '') + '</small></div>' +
      '<div class="acts"><span class="tag ' + (c.status === 'published' ? 'pub">Опубликован' : 'draft">Черновик') + '</span>' + moveBtns +
      '<a class="icon-btn" href="case.html?slug=' + encodeURIComponent(c.slug) + '" target="_blank" rel="noopener" title="Открыть на сайте">↗</a>' +
      '<button class="icon-btn" data-dup="' + c.id + '" title="Дублировать">⧉</button>' +
      '<a class="btn btn-ghost btn-sm" href="#case/' + c.id + '">✏️ Изменить</a>' +
      '<button class="icon-btn danger" data-del="' + c.id + '" title="Удалить">🗑</button></div></li>').join('') + '</ul>';
    const list = $('#caseList');
    makeSortable(list, () => saveOrder('cases', 'id', list));
    $$('[data-del]', list).forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('Удалить кейс безвозвратно?')) return;
      try { await run(sb.from('cases').delete().eq('id', b.dataset.del)); toast('Кейс удалён'); viewCases(); } catch (err) { toast(errText(err), true); }
    }));
    $$('[data-dup]', list).forEach((b) => b.addEventListener('click', async () => {
      try {
        const src = (await run(sb.from('cases').select('*').eq('id', b.dataset.dup)))[0];
        const copy = Object.assign({}, src); delete copy.id; delete copy.created_at; delete copy.updated_at;
        copy.title_ru = (src.title_ru || '') + ' (копия)'; copy.status = 'draft';
        copy.slug = await uniqueSlug(src.slug.replace(/-\d+$/, '') + '-copy');
        copy.sort = rows.length + 1;
        await run(sb.from('cases').insert(copy));
        toast('Копия создана (черновик)'); viewCases();
      } catch (err) { toast(errText(err), true); }
    }));
  }

  const DEFAULT_METRICS = [
    { label_ru: 'Заявки в месяц', label_uz: 'Oylik arizalar', before: '', after: '' },
    { label_ru: 'Цена заявки', label_uz: 'Ariza narxi', before: '', after: '' },
    { label_ru: 'Записи на пробное', label_uz: 'Sinov darsiga yozilish', before: '', after: '' },
    { label_ru: 'Новые ученики', label_uz: 'Yangi oʻquvchilar', before: '', after: '' },
  ];
  function metricRow(m) {
    return '<div class="metric-row">' +
      field('Показатель RU', 'm_label_ru', val(m, 'label_ru'), { ph: 'Заявки в месяц' }) +
      field('Показатель UZ', 'm_label_uz', val(m, 'label_uz'), { ph: 'Oylik arizalar' }) +
      field('Было', 'm_before', val(m, 'before'), { ph: '35' }) +
      field('Стало', 'm_after', val(m, 'after'), { ph: '120' }) +
      '<button type="button" class="icon-btn danger" data-mdel title="Удалить строку">✕</button></div>';
  }
  function galItem(u) { return '<div class="gal-item" data-url="' + esc(u) + '"><img src="' + esc(u) + '" alt=""><button type="button" data-gdel title="Убрать">✕</button></div>'; }

  async function viewCaseEdit(id) {
    const isNew = id === 'new';
    let c = { status: 'draft', metrics: DEFAULT_METRICS, gallery: [], city_ru: 'Ташкент', city_uz: 'Toshkent' };
    if (!isNew) {
      try { c = (await run(sb.from('cases').select('*').eq('id', id)))[0]; } catch (err) { toast(errText(err), true); }
      if (!c) { view().innerHTML = '<div class="empty">Кейс не найден</div>'; return; }
    }
    const link = c.slug ? new URL('case.html?slug=' + encodeURIComponent(c.slug), location.href).toString() : '';
    view().innerHTML =
      '<div class="page-head"><div><a href="#cases" class="muted">← Все кейсы</a><h1 style="margin-top:6px">' + (isNew ? 'Новый кейс' : 'Редактирование кейса') + '</h1></div></div>' +
      '<form id="caseForm" novalidate>' +
      '<div class="panel"><h2>Основное</h2>' +
        pair('Название кейса', 'title', c, { ph: 'Как автошкола получила 120 записей за месяц' }) +
        '<div class="grid2">' + field('Автошкола', 'school', val(c, 'school'), { ph: 'Автошкола «Пример»' }) +
        '<label class="f"><span>Статус</span><select name="status"><option value="draft"' + (c.status !== 'published' ? ' selected' : '') + '>Черновик — не виден на сайте</option><option value="published"' + (c.status === 'published' ? ' selected' : '') + '>Опубликован</option></select></label></div>' +
        pair('Город', 'city', c) + pair('Срок работы', 'duration', c, { ph: '3 месяца' }) +
        (link ? '<div class="f"><span>Ссылка на кейс (создаётся автоматически)</span><div class="slug">' + esc(link) + '</div><div><button type="button" class="btn btn-ghost btn-sm" id="copyLink">Скопировать ссылку</button></div></div>'
              : '<p class="hint">Ссылка на страницу кейса создастся автоматически при сохранении.</p>') +
      '</div>' +
      '<div class="panel"><h2>Главная цифра на карточке</h2><div class="grid3">' + field('Цифра', 'main_value', val(c, 'main_value'), { ph: '×3' }) + '</div>' +
        pair('Подпись к цифре', 'main_label', c, { ph: 'записей на пробное' }) + '</div>' +
      '<div class="panel"><h2>Обложка</h2>' + imageField('Фото обложки (горизонтальное)', 'cover_url', val(c, 'cover_url'), 'cases') + '</div>' +
      '<div class="panel"><h2>Цифры «было → стало»</h2><p class="hint">Можно добавлять свои строки. Пустые строки на сайте не показываются.</p><div id="metrics">' +
        (Array.isArray(c.metrics) ? c.metrics : []).map(metricRow).join('') + '</div><button type="button" class="btn btn-ghost btn-sm" id="addMetric" style="margin-top:12px">+ Добавить строку</button></div>' +
      '<div class="panel"><h2>Тексты</h2><div class="tip">Строка, начинающаяся с <code>- </code>, станет пунктом списка с красным ▲. Слово в <code>*звёздочках*</code> выделится красным.</div>' +
        pair('Задача', 'task', c, { area: true }) + pair('Что сделали', 'done', c, { area: true, rows: 6 }) + pair('Результат', 'result', c, { area: true }) + '</div>' +
      '<div class="panel"><h2>Галерея: скриншоты и креативы</h2><p class="hint">Можно выбрать сразу несколько фото. Перетаскивайте, чтобы поменять порядок.</p><div class="gal" id="gal">' +
        (Array.isArray(c.gallery) ? c.gallery : []).map(galItem).join('') + '</div>' +
        '<span class="btn btn-ghost upl">📷 Добавить фото<input type="file" accept="image/*" multiple id="galInput"></span> <span class="progress" id="galProg" hidden></span></div>' +
      '<div class="panel"><h2>Видео</h2>' + field('Ссылка на Reels / YouTube', 'video_url', val(c, 'video_url'), { type: 'url', ph: 'https://www.instagram.com/reel/...' }) + '</div>' +
      '<div class="savebar"><a class="btn btn-ghost" href="#cases">Отмена</a><span class="sp"></span><button class="btn btn-primary" type="submit" id="saveCase">💾 Сохранить кейс</button></div>' +
      '</form>';

    const form = $('#caseForm');
    bindImageFields(form);
    const mBox = $('#metrics');
    $('#addMetric').addEventListener('click', () => mBox.insertAdjacentHTML('beforeend', metricRow({})));
    mBox.addEventListener('click', (e) => { if (e.target.closest('[data-mdel]')) e.target.closest('.metric-row').remove(); });
    const gal = $('#gal');
    if (window.Sortable) window.Sortable.create(gal, { animation: 150 });
    gal.addEventListener('click', (e) => { if (e.target.closest('[data-gdel]')) e.target.closest('.gal-item').remove(); });
    $('#galInput').addEventListener('change', async (e) => {
      const files = Array.from(e.target.files); const prog = $('#galProg'); prog.hidden = false;
      for (let i = 0; i < files.length; i++) {
        prog.textContent = 'Загрузка ' + (i + 1) + ' из ' + files.length + '…';
        try { gal.insertAdjacentHTML('beforeend', galItem(await uploadImage(files[i], 'cases'))); } catch (err) { toast(errText(err), true); }
      }
      prog.hidden = true; e.target.value = ''; toast('Фото добавлены — не забудьте сохранить кейс');
    });
    const cl = $('#copyLink'); if (cl) cl.addEventListener('click', () => navigator.clipboard.writeText(link).then(() => toast('Ссылка скопирована')));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#saveCase'); btn.disabled = true;
      try {
        const v = collect(form);
        const data = {};
        ['title_ru', 'title_uz', 'school', 'status', 'city_ru', 'city_uz', 'duration_ru', 'duration_uz', 'main_value', 'main_label_ru', 'main_label_uz',
          'cover_url', 'video_url', 'task_ru', 'task_uz', 'done_ru', 'done_uz', 'result_ru', 'result_uz'].forEach((k) => { data[k] = v[k] || ''; });
        if (!data.title_ru && !data.school) throw new Error('Заполните хотя бы название кейса или автошколу');
        if (data.video_url && !/^https?:\/\//i.test(data.video_url)) throw new Error('Ссылка на видео должна начинаться с https://');
        data.metrics = $$('.metric-row', mBox).map((r) => ({
          label_ru: $('[name=m_label_ru]', r).value.trim(), label_uz: $('[name=m_label_uz]', r).value.trim(),
          before: $('[name=m_before]', r).value.trim(), after: $('[name=m_after]', r).value.trim(),
        })).filter((m) => m.label_ru || m.label_uz || m.before || m.after);
        data.gallery = $$('.gal-item', gal).map((g) => g.dataset.url);
        data.updated_at = new Date().toISOString();
        if (isNew) {
          data.slug = await uniqueSlug(slugify(data.school || data.title_ru));
          const max = await run(sb.from('cases').select('sort').order('sort', { ascending: false }).limit(1));
          data.sort = ((max && max[0] && max[0].sort) || 0) + 1;
          const ins = await run(sb.from('cases').insert(data).select('id'));
          toast('Кейс создан');
          location.hash = '#case/' + ins[0].id;
        } else {
          await run(sb.from('cases').update(data).eq('id', id));
          toast('Кейс сохранён');
        }
      } catch (err) { toast(errText(err), true); } finally { btn.disabled = false; }
    });
  }

  /* ================= НАСТРОЙКИ ================= */
  const SETTINGS_FORM = [
    ['Общее', [['agency_name', 'Название агентства (в логотипе)']]],
    ['Первый экран', [['hero_badge', 'Плашка над заголовком', 'i18n'], ['hero_button', 'Текст главной кнопки', 'i18n'], ['hero_button2', 'Текст второй кнопки (к кейсам)', 'i18n']],
      'Сам заголовок и подзаголовок меняются в разделе «Секции» → «Первый экран».'],
    ['Цифры-счётчики', 'counters'],
    ['Оффер', [['offer_badge', 'Плашка', 'i18n'], ['offer_currency', 'Валюта (символ)'], ['offer_price_old', 'Старая цена (зачёркнутая)', '', 'Только число, например 1000'],
      ['offer_price_new', 'Новая цена', '', 'Только число, например 500'], ['offer_period', 'Подпись под ценой', 'i18n'], ['offer_points', 'Пункты оффера (каждый с новой строки)', 'i18n-area'],
      ['offer_guarantee_title', 'Заголовок гарантии', 'i18n'], ['offer_guarantee', 'Текст гарантии', 'i18n-area'], ['offer_note', 'Примечание под гарантией', 'i18n'], ['offer_button', 'Текст кнопки', 'i18n']]],
    ['Контакты', [['telegram', 'Telegram', '', 'Username без @ (например <code>myagency</code>) или ссылка t.me/... Сюда приходят заявки.'],
      ['whatsapp', 'WhatsApp', '', 'Номер с кодом страны, например <code>998901234567</code>. Если пусто — кнопки WhatsApp не будет.'],
      ['phone', 'Телефон (для подвала)', '', 'Например +998 90 123-45-67'], ['instagram', 'Instagram', '', 'Username или ссылка на профиль']]],
    ['Форма заявки', [['form_success', 'Текст после отправки', 'i18n-area']]],
    ['Подвал', [['footer_text', 'Текст в подвале', 'i18n-area']]],
  ];
  function counterRow(c) {
    return '<div class="panel" style="background:#101013;margin-bottom:10px" data-counter><div class="grid3">' + field('Цифра', 'c_value', val(c, 'value'), { ph: '40' }) + '</div>' +
      '<div class="pair">' + field('Подпись', 'c_label_ru', val(c, 'label_ru'), { lang: 'RU', cls: 'ru' }) + field('Подпись', 'c_label_uz', val(c, 'label_uz'), { lang: 'UZ', cls: 'uz' }) + '</div>' +
      '<button type="button" class="btn btn-danger btn-sm" data-cdel>Удалить счётчик</button></div>';
  }
  async function viewSettings() {
    view().innerHTML = '<div class="empty">Загрузка…</div>';
    let data = {};
    try { const r = await run(sb.from('settings').select('*').eq('id', 1)); data = (r[0] && r[0].data) || {}; } catch (err) { toast(errText(err), true); }
    view().innerHTML = '<div class="page-head"><div><h1>Настройки</h1><p class="muted">Цены, гарантия, счётчики и контакты. Слово в <code>*звёздочках*</code> выделится красным.</p></div></div>' +
      '<form id="setForm" novalidate>' + SETTINGS_FORM.map(([title, fields, note]) => {
        if (fields === 'counters') {
          return '<div class="panel"><h2>' + title + '</h2><p class="hint" style="margin-bottom:12px">Крупные цифры на первом экране (лучше 3). Цифры анимируются.</p><div id="counters">' +
            (data.counters || []).map(counterRow).join('') + '</div><button type="button" class="btn btn-ghost btn-sm" id="addCounter">+ Добавить счётчик</button></div>';
        }
        return '<div class="panel"><h2>' + title + '</h2>' + (note ? '<div class="tip">' + note + '</div>' : '') + fields.map(([k, label, type, hint]) =>
          type === 'i18n' ? pair(label, k, data, { hint: hint }) : type === 'i18n-area' ? pair(label, k, data, { area: true, rows: 4 }) : field(label, k, val(data, k), { hint: hint })).join('') + '</div>';
      }).join('') +
      '<div class="savebar"><span class="sp"></span><button class="btn btn-primary" type="submit">💾 Сохранить настройки</button></div></form>';
    const box = $('#counters');
    $('#addCounter').addEventListener('click', () => box.insertAdjacentHTML('beforeend', counterRow({})));
    box.addEventListener('click', (e) => { if (e.target.closest('[data-cdel]')) e.target.closest('[data-counter]').remove(); });
    $('#setForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('[type=submit]', e.target); btn.disabled = true;
      const v = collect(e.target);
      const next = Object.assign({}, data);
      Object.keys(v).forEach((k) => { if (!/^c_/.test(k)) next[k] = v[k]; });
      next.offer_price_old = String(next.offer_price_old || '').replace(/[^\d.,\s]/g, '').trim();
      next.offer_price_new = String(next.offer_price_new || '').replace(/[^\d.,\s]/g, '').trim();
      next.counters = $$('[data-counter]', box).map((r) => ({
        value: $('[name=c_value]', r).value.trim(), label_ru: $('[name=c_label_ru]', r).value.trim(), label_uz: $('[name=c_label_uz]', r).value.trim(),
      })).filter((c) => c.value);
      try { await run(sb.from('settings').upsert({ id: 1, data: next, updated_at: new Date().toISOString() })); data = next; toast('Настройки сохранены'); } catch (err) { toast(errText(err), true); }
      btn.disabled = false;
    });
  }

  /* ================= СЕКЦИИ ================= */
  async function viewSections() {
    view().innerHTML = '<div class="empty">Загрузка…</div>';
    let rows = [];
    try { rows = await run(sb.from('sections').select('*').order('sort')); } catch (err) { toast(errText(err), true); }
    view().innerHTML = '<div class="page-head"><div><h1>Секции сайта</h1><p class="muted">Включайте/выключайте блоки, меняйте порядок (⠿) и заголовки.</p></div></div>' +
      '<div class="tip">«Пункт меню» — как секция называется в верхнем меню. Оставьте пустым, чтобы не показывать её в меню.</div>' +
      '<ul class="rows" id="secList">' + rows.map((s) => '<li class="row' + (s.enabled ? '' : ' off') + '" data-id="' + esc(s.key) + '"><span class="drag">⠿</span>' +
        '<div class="grow"><b>' + esc(s.admin_name || s.key) + '</b><small>' + esc(String(s.title_ru).replace(/\*/g, '')) + '</small></div>' +
        '<div class="acts">' + switchHtml('', s.enabled, s.enabled ? 'Вкл' : 'Выкл') + moveBtns + '<button class="btn btn-ghost btn-sm" data-edit="' + esc(s.key) + '">✏️ Тексты</button></div></li>').join('') + '</ul>';
    const list = $('#secList');
    makeSortable(list, () => saveOrder('sections', 'key', list));
    $$('.switch input', list).forEach((inp) => inp.addEventListener('change', async () => {
      const li = inp.closest('li');
      try {
        await run(sb.from('sections').update({ enabled: inp.checked }).eq('key', li.dataset.id));
        li.classList.toggle('off', !inp.checked); inp.parentNode.querySelector('span').textContent = inp.checked ? 'Вкл' : 'Выкл';
        toast(inp.checked ? 'Секция включена' : 'Секция скрыта');
      } catch (err) { inp.checked = !inp.checked; toast(errText(err), true); }
    }));
    $$('[data-edit]', list).forEach((b) => b.addEventListener('click', () => {
      const s = rows.find((r) => r.key === b.dataset.edit);
      modal('Тексты: ' + (s.admin_name || s.key),
        '<div class="tip">Слово в <code>*звёздочках*</code> будет красным: <code>МАРКЕТИНГ ДЛЯ *АВТОШКОЛ*</code></div>' +
        pair('Заголовок', 'title', s) + pair('Подзаголовок', 'subtitle', s, { area: true, rows: 2 }) + (s.key === 'hero' ? '' : pair('Пункт меню', 'menu', s)),
        async (form) => {
          const v = collect(form);
          await run(sb.from('sections').update(v).eq('key', s.key));
          Object.assign(s, v); b.closest('li').querySelector('small').textContent = String(s.title_ru).replace(/\*/g, '');
        });
    }));
  }

  /* ================= СПИСКИ: боли, услуги, шаги, FAQ, команда ================= */
  const ICON_NAMES = { target: '🎯 Таргет', video: '🎬 Видео', account: '👤 Аккаунт', creative: '🎨 Креатив', filter: '🔻 Фильтр', chart: '📊 Отчёт', star: '⭐ Звезда', chat: '💬 Чат', phone: '📞 Телефон', road: '🛣 Дорога' };
  const LISTS = {
    pains: { title: 'Боли владельца', hint: 'Карточки в блоке «Знакомо?».', fields: [['title', 'Заголовок', 'i18n'], ['text', 'Текст', 'i18n-area']], label: 'title_ru', sub: 'text_ru' },
    services: { title: 'Что входит', hint: 'Карточки услуг.', fields: [['icon', 'Иконка', 'icon'], ['title', 'Заголовок', 'i18n'], ['text', 'Текст', 'i18n-area']], label: 'title_ru', sub: 'text_ru' },
    steps: { title: 'Как работаем', hint: 'Шаги работы — номера ставятся автоматически по порядку.', fields: [['title', 'Заголовок', 'i18n'], ['text', 'Текст', 'i18n-area']], label: 'title_ru', sub: 'text_ru' },
    faq: { title: 'FAQ', hint: 'Вопросы и ответы. В ответе строка с «- » станет пунктом списка.', fields: [['question', 'Вопрос', 'i18n'], ['answer', 'Ответ', 'i18n-area']], label: 'question_ru', sub: 'answer_ru' },
    team: { title: 'Команда', hint: 'Если фото нет — покажутся инициалы.', fields: [['photo_url', 'Фото (квадратное)', 'image'], ['name', 'Имя', 'i18n'], ['role', 'Должность', 'i18n'], ['bio', 'Пара слов', 'i18n-area']], label: 'name_ru', sub: 'role_ru', thumb: 'photo_url' },
  };
  function listForm(cfg, r) {
    return cfg.fields.map(([k, label, type]) => {
      if (type === 'i18n') return pair(label, k, r);
      if (type === 'i18n-area') return pair(label, k, r, { area: true, rows: 4 });
      if (type === 'image') return imageField(label, k, val(r, k), 'team', true);
      if (type === 'icon') return '<label class="f"><span>' + label + '</span><select name="' + k + '">' + Object.keys(ICON_NAMES).map((n) => '<option value="' + n + '"' + (r[k] === n ? ' selected' : '') + '>' + ICON_NAMES[n] + '</option>').join('') + '</select></label>';
      return field(label, k, val(r, k));
    }).join('') + '<div style="margin:6px 0 10px">' + switchHtml('visible', r.visible !== false, 'Показывать на сайте') + '</div>';
  }
  async function viewList(table) {
    const cfg = LISTS[table];
    if (!cfg) { location.hash = '#leads'; return; }
    view().innerHTML = '<div class="page-head"><div><h1>' + cfg.title + '</h1><p class="muted">' + cfg.hint + ' Порядок — перетаскиванием ⠿.</p></div><button class="btn btn-primary" id="addItem">+ Добавить</button></div><div id="listBox"><div class="empty">Загрузка…</div></div>';
    let rows = [];
    const draw = async () => {
      try { rows = await run(sb.from(table).select('*').order('sort')); } catch (err) { $('#listBox').innerHTML = '<div class="empty">' + esc(errText(err)) + '</div>'; return; }
      if (!rows.length) { $('#listBox').innerHTML = '<div class="empty">Пока пусто. Нажмите «Добавить».</div>'; return; }
      $('#listBox').innerHTML = '<ul class="rows" id="itemList">' + rows.map((r) => '<li class="row' + (r.visible ? '' : ' off') + '" data-id="' + r.id + '"><span class="drag">⠿</span>' +
        (cfg.thumb ? (r[cfg.thumb] ? '<img class="thumb" style="width:44px" src="' + esc(r[cfg.thumb]) + '" alt="">' : '<span class="thumb" style="width:44px"></span>') : '') +
        '<div class="grow"><b>' + esc(r[cfg.label] || '(пусто)') + '</b><small>' + esc(r[cfg.sub] || '') + '</small></div>' +
        '<div class="acts">' + (r.visible ? '' : '<span class="tag draft">Скрыто</span>') + moveBtns + '<button class="btn btn-ghost btn-sm" data-edit="' + r.id + '">✏️ Изменить</button><button class="icon-btn danger" data-del="' + r.id + '" title="Удалить">🗑</button></div></li>').join('') + '</ul>';
      const list = $('#itemList');
      makeSortable(list, () => saveOrder(table, 'id', list));
      $$('[data-edit]', list).forEach((b) => b.addEventListener('click', () => edit(rows.find((r) => r.id === b.dataset.edit))));
      $$('[data-del]', list).forEach((b) => b.addEventListener('click', async () => {
        if (!confirm('Удалить безвозвратно?')) return;
        try { await run(sb.from(table).delete().eq('id', b.dataset.del)); toast('Удалено'); draw(); } catch (err) { toast(errText(err), true); }
      }));
    };
    const edit = (r) => {
      const isNew = !r;
      r = r || { visible: true };
      const m = modal(isNew ? 'Добавить' : 'Изменить', listForm(cfg, r), async (form) => {
        const v = collect(form);
        if (isNew) { v.sort = (rows.reduce((mx, x) => Math.max(mx, x.sort || 0), 0)) + 1; await run(sb.from(table).insert(v)); }
        else await run(sb.from(table).update(v).eq('id', r.id));
        draw();
      });
      bindImageFields(m);
    };
    $('#addItem').addEventListener('click', () => edit(null));
    draw();
  }

  /* ================= маршруты и вход ================= */
  const ROUTES = { leads: viewLeads, cases: viewCases, settings: viewSettings, sections: viewSections };
  function route() {
    const h = (location.hash || '#leads').slice(1);
    document.body.classList.remove('nav-open');
    $$('.side a').forEach((a) => {
      const r = a.dataset.route;
      a.classList.toggle('on', h === r || (r === 'cases' && h.indexOf('case/') === 0));
    });
    window.scrollTo(0, 0);
    if (h.indexOf('case/') === 0) return viewCaseEdit(h.slice(5));
    if (h.indexOf('list/') === 0) return viewList(h.slice(5));
    (ROUTES[h] || viewLeads)();
  }

  async function enter(session) {
    const ok = await sb.rpc('is_admin');
    if (ok.error || ok.data !== true) {
      await sb.auth.signOut();
      showLogin('Вход выполнен, но этот аккаунт не добавлен в админы. Выполните SQL из SETUP.md, шаг 5.');
      return;
    }
    $('#login').hidden = true; $('#shell').hidden = false;
    $('#whoami').textContent = session.user.email || '';
    route(); updateNewCount();
  }
  function showLogin(msg) {
    $('#shell').hidden = true; $('#login').hidden = false;
    $('#loginErr').textContent = msg || '';
  }

  async function init() {
    $('#boot').remove();
    if (!sb) { showLogin('Сайт не подключён к Supabase: заполните config.js (SETUP.md, шаг 3).'); $('#loginForm button').disabled = true; return; }
    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target, btn = $('button', f); btn.disabled = true; $('#loginErr').textContent = '';
      const { data, error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
      btn.disabled = false;
      if (error) { $('#loginErr').textContent = /Invalid login/i.test(error.message) ? 'Неверный email или пароль' : errText(error); return; }
      enter(data.session);
    });
    $('#logoutBtn').addEventListener('click', async () => { await sb.auth.signOut(); showLogin(); });
    $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    window.addEventListener('hashchange', () => { if (!$('#shell').hidden) route(); });
    const { data } = await sb.auth.getSession();
    if (data.session) enter(data.session); else showLogin();
  }

  window.Admin = { slugify, compressImage };
  init();
})();

/* Страница кейса: case.html?slug=... */
(function () {
  'use strict';
  const { sb, ui, tr, esc, hl, rich, safeUrl, safeImg, q, SIGN_U } = App;
  const app = document.getElementById('app');
  const slug = new URLSearchParams(location.search).get('slug') || '';

  function render(c, others, d) {
    const meta = [
      ['case_school', c.school], ['case_city', tr(c, 'city')], ['case_duration', tr(c, 'duration')],
    ].filter((m) => m[1]).map((m) => '<div class="meta-chip"><small>' + esc(ui(m[0])) + '</small><b>' + esc(m[1]) + '</b></div>').join('');

    const metrics = (Array.isArray(c.metrics) ? c.metrics : []).filter((m) => m && (tr(m, 'label') || m.before || m.after)).map((m) =>
      '<div class="metric rv"><div class="metric-l">' + esc(tr(m, 'label')) + '</div><div class="metric-v">' +
      '<span class="was"><small>' + esc(ui('case_before')) + '</small>' + esc(m.before || '—') + '</span><span class="to" aria-hidden="true">→</span>' +
      '<span class="now"><small>' + esc(ui('case_after')) + '</small>' + esc(m.after || '—') + '</span></div></div>').join('');

    const texts = [['case_task', 'task'], ['case_done', 'done'], ['case_result', 'result']]
      .filter((x) => tr(c, x[1])).map((x) => '<article class="card rv"><h3 class="h-sm">' + esc(ui(x[0])) + '</h3>' + rich(tr(c, x[1])) + '</article>').join('');

    const gallery = (Array.isArray(c.gallery) ? c.gallery : []).filter(safeImg);
    const video = safeUrl(c.video_url);
    const formOn = d.sections.some((s) => s.key === 'form' && s.enabled);

    app.innerHTML =
      '<section class="case-hero"><div class="container">' +
        '<a class="crumbs" href="index.html#cases">← ' + esc(ui('case_back')) + '</a>' +
        '<h1 class="h-lg rv">' + hl(tr(c, 'title')) + '</h1>' +
        (c.main_value ? '<div class="case-main rv" style="border:0;padding:0;margin-top:20px"><b style="font-size:clamp(48px,8vw,80px)">' + esc(c.main_value) + '</b><span style="font-size:17px">' + esc(tr(c, 'main_label')) + '</span></div>' : '') +
        '<div class="case-meta rv">' + meta + '</div>' +
        '<div class="case-actions rv">' +
          (video ? '<a class="btn btn-ghost" href="' + esc(video) + '" target="_blank" rel="noopener">▶ ' + esc(ui('case_video')) + '</a>' : '') +
          '<button class="btn btn-ghost" type="button" id="shareBtn">' + esc(ui('case_share')) + '</button>' +
        '</div>' +
        '<div class="case-cover-big rv">' + (safeImg(c.cover_url) ? '<img src="' + esc(c.cover_url) + '" alt="' + esc(tr(c, 'title')) + '">' : '<div class="cover-ph">' + SIGN_U + '</div>') + '</div>' +
      '</div></section>' +
      (metrics ? '<section class="sec glow-tl" style="padding-top:40px"><div class="container"><div class="sec-head rv"><h2 class="h-md">' + esc(ui('case_numbers')) + '</h2></div><div class="metrics">' + metrics + '</div></div></section>' : '') +
      (texts ? '<section class="sec" style="padding-top:0"><div class="container"><div class="case-text">' + texts + '</div></div></section>' : '') +
      (gallery.length ? '<section class="sec" style="padding-top:0"><div class="container"><div class="sec-head rv"><h2 class="h-md">' + esc(ui('case_gallery')) + '</h2></div><div class="gallery">' +
        gallery.map((u, i) => '<button type="button" class="rv" data-i="' + i + '" aria-label="' + (i + 1) + '"><img src="' + esc(u) + '" alt="" loading="lazy"></button>').join('') + '</div></div></section>' : '') +
      '<section class="sec" style="padding-top:0"><div class="container"><div class="case-cta rv"><div><h2 class="h-md">' + esc(ui('case_cta_title')) + '</h2><p>' + esc(ui('case_cta_text')) + '</p></div>' +
        '<a class="btn btn-light btn-lg" href="' + (formOn ? 'index.html#form' : esc(App.tgLink(d.settings.telegram) || 'index.html')) + '">' + esc(ui('case_cta')) + ' <span class="arr">→</span></a></div></div></section>' +
      (others.length ? '<section class="sec sec-alt glow-bl"><div class="container"><div class="sec-head rv"><h2 class="h-lg">' + esc(ui('case_other')) + '</h2></div><div class="grid g3">' + others.map(App.caseCard).join('') + '</div></div></section>' : '');

    document.title = tr(c, 'title') + ' — ' + (c.school || d.settings.agency_name || '');
    const desc = document.createElement('meta'); desc.name = 'description';
    desc.content = (c.main_value ? c.main_value + ' ' + tr(c, 'main_label') + '. ' : '') + String(tr(c, 'task')).slice(0, 150);
    document.head.appendChild(desc);

    document.getElementById('shareBtn').addEventListener('click', async () => {
      const url = location.href;
      try {
        if (navigator.share && matchMedia('(max-width: 900px)').matches) { await navigator.share({ title: document.title, url }); return; }
        await navigator.clipboard.writeText(url); toast(ui('copied'));
      } catch (e) { /* пользователь отменил */ }
    });
    initLightbox(gallery);
    App.reveal(app);
  }

  function toast(t) {
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = t;
    document.body.appendChild(el); setTimeout(() => el.remove(), 2000);
  }

  function initLightbox(list) {
    let i = 0, box = null;
    const show = () => { box.querySelector('img').src = list[i]; };
    const close = () => { if (box) { box.remove(); box = null; document.removeEventListener('keydown', key); } };
    const key = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') { i = (i + 1) % list.length; show(); } if (e.key === 'ArrowLeft') { i = (i - 1 + list.length) % list.length; show(); } };
    app.querySelectorAll('.gallery [data-i]').forEach((b) => b.addEventListener('click', () => {
      i = +b.dataset.i;
      box = document.createElement('div'); box.className = 'lightbox'; box.setAttribute('role', 'dialog');
      box.innerHTML = '<img alt=""><button class="lb-close" aria-label="' + esc(ui('close')) + '">✕</button>' +
        (list.length > 1 ? '<button class="lb-prev" aria-label="←">‹</button><button class="lb-next" aria-label="→">›</button>' : '');
      box.addEventListener('click', (e) => {
        if (e.target === box || e.target.classList.contains('lb-close')) close();
        else if (e.target.classList.contains('lb-prev')) { i = (i - 1 + list.length) % list.length; show(); }
        else if (e.target.classList.contains('lb-next')) { i = (i + 1) % list.length; show(); }
      });
      document.body.appendChild(box); show(); document.addEventListener('keydown', key);
    }));
  }

  async function init() {
    const hdr = document.getElementById('hdr'), ftr = document.getElementById('ftr');
    if (!sb) { App.notice(app, ui('not_configured')); return; }
    try {
      const [d, rows] = await Promise.all([
        App.loadCommon(),
        slug ? q('cases', (x) => x.eq('slug', slug).limit(1)) : Promise.resolve([]),
      ]);
      App.renderHeader(hdr, d, { home: false });
      App.renderFooter(ftr, d);
      const c = rows[0];
      if (!c) { App.notice(app, ui('case_notfound')); return; }
      const others = (await q('cases', (x) => x.eq('status', 'published').neq('id', c.id).order('sort').limit(3)));
      render(c, others, d);
    } catch (err) {
      console.error(err);
      App.notice(app, ui('load_error'));
    }
  }
  init();
})();

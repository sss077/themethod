/* =====================================================================
   SWARM — рой частиц (WebGL / three.js), «главный герой» сайта.
   Рой меняет форму под каждую сцену: знак «У», дождь, воронка,
   цифры оффера, ночная трасса, кольцо у формы, галочка ✓.
   Если WebGL недоступен — сайт работает и без него.
   ===================================================================== */
(function () {
  'use strict';
  const S = { ready: false, init: () => false, go() {}, burst() {}, set() {}, define() {} };
  window.Swarm = S;
  const THREE = window.THREE; // может отсутствовать — тогда рисуем через Canvas 2D

  const COL = {
    red: [0.88, 0.21, 0.17], white: [1, 1, 1], grey: [0.58, 0.58, 0.63], dim: [0.2, 0.2, 0.23], warm: [1, 0.86, 0.62],
  };
  const FOV = 35, CAMZ = 10;
  const VIEWH = 2 * CAMZ * Math.tan((FOV / 2) * Math.PI / 180); // высота кадра на z=0

  let renderer, scene, camera, group, geo, mat, N = 0, mobile = false;
  let P, V, T, C, CT, A, AT, SZ, R; // позиции, скорости, цели, цвета, альфы, размеры, случайные
  let perm; // перемешанный порядок частиц
  const states = {};
  let cur = null, curName = '';
  const g = { x: 0, y: 0, tx: 0, ty: 0, rot: 0, rotV: 0, tilt: 0, scale: 1, ts: 1 };
  const mouse = { x: 1e4, y: 1e4, nx: 0, ny: 0, active: false };
  const params = { speed: 0, progress: 0 };
  let viewW = VIEWH, last = 0, t = 0, visible = true;

  /* ---------------- шейдеры ---------------- */
  const VS = [
    'attribute vec3 aColor; attribute float aAlpha; attribute float aSize;',
    'uniform float uScale; varying vec3 vC; varying float vA;',
    'void main(){',
    '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
    '  gl_Position = projectionMatrix * mv;',
    '  gl_PointSize = max(1.0, aSize * uScale / -mv.z);',
    '  vC = aColor; vA = aAlpha;',
    '}'].join('\n');
  const FS = [
    'varying vec3 vC; varying float vA;',
    'void main(){',
    '  vec2 c = gl_PointCoord - 0.5; float d = length(c);',
    '  float a = smoothstep(0.5, 0.0, d); a = a * a * 1.35;',
    '  gl_FragColor = vec4(vC * a * vA, a * vA);',
    '}'].join('\n');

  /* ---------------- построители фигур (нормированы: высота ≈ 1) ---------------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* Текст → точки (рисуем на холсте и собираем закрашенные пиксели) */
  function textPoints(str, opts) {
    opts = opts || {};
    const cv = document.createElement('canvas');
    const fs = 260;
    const ctx = cv.getContext('2d');
    const font = (opts.weight || 700) + ' ' + fs + 'px ' + (opts.font || 'Oswald, "Arial Narrow", sans-serif');
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(str).width) + 40;
    cv.width = w; cv.height = fs * 1.3;
    ctx.font = font; ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.fillText(str, w / 2, cv.height / 2);
    const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const pts = [];
    const step = 3;
    for (let y = 0; y < cv.height; y += step) {
      for (let x = 0; x < cv.width; x += step) {
        if (data[(y * cv.width + x) * 4 + 3] > 140) pts.push([x, y]);
      }
    }
    // нормируем по высоте букв
    let minY = 1e9, maxY = -1e9, minX = 1e9, maxX = -1e9;
    pts.forEach(([x, y]) => { minY = Math.min(minY, y); maxY = Math.max(maxY, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x); });
    const h = Math.max(1, maxY - minY), cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    return pts.map(([x, y]) => ({ x: (x - cx) / h + rnd(-0.004, 0.004), y: -(y - cy) / h + rnd(-0.004, 0.004), z: rnd(-0.03, 0.03) }));
  }

  function sample(arr, n) {
    if (arr.length <= n) return arr.slice();
    const out = [], step = arr.length / n;
    for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step + Math.random() * step * 0.9)]);
    return out;
  }

  /* Знак «У»: красный треугольник + белая буква */
  function signShape(n) {
    const out = [];
    const tri = [[0, 0.62], [0.62, -0.46], [-0.62, -0.46]];
    const nEdge = Math.floor(n * 0.6);
    for (let i = 0; i < nEdge; i++) {
      const e = i % 3, a = tri[e], b = tri[(e + 1) % 3], k = Math.random();
      const th = 0.06;
      // толщина обводки — смещение к центру
      const ix = a[0] + (b[0] - a[0]) * k, iy = a[1] + (b[1] - a[1]) * k;
      const inward = Math.random() * th;
      const dx = -ix, dy = (-0.1) - iy, dl = Math.hypot(dx, dy) || 1;
      out.push({ x: ix + dx / dl * inward, y: iy + dy / dl * inward, z: rnd(-0.06, 0.06), c: 'red' });
    }
    const letter = sample(textPoints('У'), n - nEdge);
    letter.forEach((p) => out.push({ x: p.x * 0.5, y: p.y * 0.5 - 0.12, z: p.z + rnd(-0.03, 0.03), c: 'white' }));
    return out;
  }

  function sphere(n, r, c) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, rr = r * Math.cbrt(Math.random());
      const s = Math.sqrt(1 - u * u);
      out.push({ x: rr * s * Math.cos(th), y: rr * u, z: rr * s * Math.sin(th), c: typeof c === 'function' ? c(i) : c });
    }
    return out;
  }

  function ring(n, r, thick, c) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = r + gauss() * thick;
      out.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, z: gauss() * thick * 0.6, c: typeof c === 'function' ? c(i) : c });
    }
    return out;
  }

  function checkShape(n) {
    const pts = [[-0.45, 0.02], [-0.12, -0.32], [0.5, 0.36]];
    const out = [];
    const l1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), l2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
    for (let i = 0; i < n; i++) {
      const s = Math.random() * (l1 + l2);
      const [a, b, k] = s < l1 ? [pts[0], pts[1], s / l1] : [pts[1], pts[2], (s - l1) / l2];
      out.push({ x: a[0] + (b[0] - a[0]) * k + gauss() * 0.022, y: a[1] + (b[1] - a[1]) * k + gauss() * 0.022, z: gauss() * 0.03, c: i % 5 ? 'red' : 'white' });
    }
    return out;
  }

  /* ---------------- состояния ----------------
     def: { build(n) → точки, n: доля частиц, fx/fy — центр (доля полуширины/полувысоты),
            h — высота фигуры (доля кадра), w — макс. ширина (доля кадра), spin, tilt,
            dust: 'scatter' | 'fall' | 'hide', dustAlpha, k, damp, dyn(t) — живые фигуры } */
  S.define = function (name, def) { states[name] = def; if (curName === name) apply(name, true); };

  function layoutFor(def) {
    const m = mobile && def.mobile ? Object.assign({}, def, def.mobile) : def;
    return m;
  }

  function apply(name, force) {
    const def0 = states[name];
    if (!def0 || (!force && name === curName)) return;
    const def = layoutFor(def0);
    curName = name; cur = def;
    const nShape = Math.floor(N * (def.n == null ? 1 : def.n));
    let pts = def.build ? def.build(nShape) : [];
    if (def.cache !== false) { def0._pts = def0._pts && !force ? def0._pts : pts; pts = def0._pts; }
    // масштаб под кадр
    let minX = 1e9, maxX = -1e9;
    pts.forEach((p) => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); });
    const shapeW = Math.max(0.001, maxX - minX);
    let sc = (def.h || 0.5) * VIEWH;
    if (def.w) sc = Math.min(sc, def.w * viewW / shapeW);
    g.ts = 1;
    g.tx = (def.fx || 0) * viewW / 2;
    g.ty = (def.fy || 0) * VIEWH / 2;
    g.rotV = def.spin || 0;
    if (def.resetRot) g.rot = 0;
    for (let j = 0; j < N; j++) {
      const i = perm[j];
      if (j < pts.length) {
        const p = pts[j];
        T[i * 3] = p.x * sc; T[i * 3 + 1] = p.y * sc; T[i * 3 + 2] = p.z * sc;
        const col = COL[p.c] || COL.white;
        CT[i * 3] = col[0]; CT[i * 3 + 1] = col[1]; CT[i * 3 + 2] = col[2];
        AT[i] = (p.c === 'grey' ? 0.75 : p.c === 'dim' ? 0.35 : 1) * (def.alpha == null ? 1 : def.alpha);
      } else {
        // «пыль» — лишние частицы
        if (def.dust === 'fall') {
          T[i * 3] = P[i * 3] + rnd(-1, 1); T[i * 3 + 1] = -VIEWH * rnd(0.7, 1.4); T[i * 3 + 2] = P[i * 3 + 2];
          AT[i] = 0;
        } else if (def.dust === 'hide') {
          T[i * 3] = P[i * 3] * 1.5; T[i * 3 + 1] = P[i * 3 + 1] * 1.5; T[i * 3 + 2] = rnd(-8, -4); AT[i] = 0;
        } else {
          const r = rnd(0.6, 1.25), a = Math.random() * Math.PI * 2;
          T[i * 3] = Math.cos(a) * viewW * 0.55 * r - g.tx; T[i * 3 + 1] = rnd(-0.6, 0.6) * VIEWH - g.ty; T[i * 3 + 2] = rnd(-6, 1);
          AT[i] = def.dustAlpha == null ? 0.22 : def.dustAlpha;
        }
        CT[i * 3] = COL.dim[0]; CT[i * 3 + 1] = COL.dim[1]; CT[i * 3 + 2] = COL.dim[2];
      }
    }
    S.state = name;
  }
  S.go = function (name) { if (S.ready) apply(name); else S._pending = name; };
  S.set = function (k, v) { params[k] = v; };
  S.burst = function (power) {
    if (!S.ready) return;
    power = power || 0.35;
    for (let i = 0; i < N; i++) {
      const x = P[i * 3], y = P[i * 3 + 1], d = Math.hypot(x, y) || 1;
      V[i * 3] += x / d * power * rnd(0.3, 1.2); V[i * 3 + 1] += y / d * power * rnd(0.3, 1.2); V[i * 3 + 2] += rnd(-0.3, 0.3) * power;
    }
  };

  /* ---------------- запуск ----------------
     Сначала пробуем WebGL (three.js). Если видеокарта/браузер его не дают —
     рисуем те же частицы через обычный Canvas 2D (чуть меньше частиц). */
  let mode = '', ctx2d = null, sprites = null, dpr = 1, cvs = null;
  S.why = '';

  function tryWebGL(canvas) {
    if (!THREE) { S.why = 'three.js не загрузился'; return false; }
    try {
      const test = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!test) { S.why = 'браузер не дал WebGL'; return false; }
      renderer = new THREE.WebGLRenderer({ canvas, context: test, antialias: false, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { S.why = 'ошибка WebGL: ' + (e && e.message); return false; }
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.z = CAMZ;
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aColor', new THREE.BufferAttribute(C, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(A, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aSize', new THREE.BufferAttribute(SZ, 1));
    mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 1 } }, vertexShader: VS, fragmentShader: FS,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    group = new THREE.Group(); group.add(pts); scene.add(group);
    return true;
  }

  function makeSprite(rgb) {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(0.35, 'rgba(' + rgb + ',.55)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
    return c;
  }

  function alloc(n) {
    N = n;
    P = new Float32Array(N * 3); V = new Float32Array(N * 3); T = new Float32Array(N * 3);
    C = new Float32Array(N * 3); CT = new Float32Array(N * 3); A = new Float32Array(N); AT = new Float32Array(N);
    SZ = new Float32Array(N); R = new Float32Array(N); perm = new Uint32Array(N);
    for (let i = 0; i < N; i++) {
      perm[i] = i;
      const a = Math.random() * Math.PI * 2, r = rnd(6, 14);
      P[i * 3] = Math.cos(a) * r; P[i * 3 + 1] = Math.sin(a) * r; P[i * 3 + 2] = rnd(-10, 4);
      T[i * 3] = P[i * 3]; T[i * 3 + 1] = P[i * 3 + 1]; T[i * 3 + 2] = P[i * 3 + 2];
      C[i * 3] = C[i * 3 + 1] = C[i * 3 + 2] = 0.3;
      SZ[i] = (mobile ? 0.062 : 0.05) * rnd(0.55, 1.45);
      R[i] = Math.random();
    }
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp; }
  }

  S.init = function (canvas) {
    if (S.ready) return true;
    mobile = Math.min(window.innerWidth, window.innerHeight) < 600 || window.innerWidth < 768;
    S.calm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    alloc(mobile ? 4200 : 9000);
    cvs = canvas;
    if (tryWebGL(canvas)) mode = 'webgl';
    else {
      // холст, на котором пытались включить WebGL, для 2D уже не годится — меняем на новый
      const fresh = canvas.cloneNode(false);
      canvas.parentNode.replaceChild(fresh, canvas);
      cvs = fresh;
      ctx2d = fresh.getContext('2d');
      if (!ctx2d) { S.why += '; Canvas 2D недоступен'; return false; }
      alloc(mobile ? 2200 : 3800);
      sprites = { red: makeSprite('224,53,43'), white: makeSprite('255,255,255'), warm: makeSprite('255,225,170') };
      mode = '2d';
    }
    S.mode = mode;
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      mouse.nx = e.clientX / window.innerWidth * 2 - 1; mouse.ny = -(e.clientY / window.innerHeight * 2 - 1);
      mouse.x = mouse.nx * viewW / 2; mouse.y = mouse.ny * VIEWH / 2; mouse.active = true;
    }, { passive: true });
    document.addEventListener('pointerleave', () => { mouse.active = false; mouse.x = mouse.y = 1e4; });
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) { last = performance.now(); requestAnimationFrame(loop); } });
    S.ready = true;
    if (S._pending) apply(S._pending);
    last = performance.now();
    requestAnimationFrame(loop);
    return true;
  };

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    if (mode === 'webgl') {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      mat.uniforms.uScale.value = renderer.getPixelRatio() * h / (2 * Math.tan((FOV / 2) * Math.PI / 180));
    } else {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cvs.width = Math.round(w * dpr); cvs.height = Math.round(h * dpr);
    }
    viewW = VIEWH * (w / h);
    if (curName) { Object.values(states).forEach((st) => { st._pts = null; }); apply(curName, true); }
  }

  /* отрисовка через Canvas 2D (запасной вариант) */
  function draw2d(rotY, rotX) {
    const w = window.innerWidth, h = window.innerHeight;
    const ctx = ctx2d;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    const F = (h / 2) / Math.tan((FOV / 2) * Math.PI / 180);
    const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
    for (let i = 0; i < N; i++) {
      const a = A[i];
      if (a < 0.02) continue;
      const i3 = i * 3, x = P[i3], y = P[i3 + 1], z = P[i3 + 2];
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      const y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      const d = CAMZ - z2;
      if (d < 0.4) continue;
      const k = F / d, px = w / 2 + (x1 + g.x) * k, py = h / 2 - (y1 + g.y) * k;
      if (px < -20 || px > w + 20 || py < -20 || py > h + 20) continue;
      const r = Math.max(1.2, SZ[i] * k * 1.6);
      const cr = C[i3], cg = C[i3 + 1];
      const spr = cr - cg > 0.25 ? sprites.red : (cr > 0.9 && cg > 0.75 && C[i3 + 2] < 0.8 ? sprites.warm : sprites.white);
      ctx.globalAlpha = Math.min(1, a * (spr === sprites.white ? Math.max(0.25, cg) : 1));
      ctx.drawImage(spr, px - r, py - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; t += dt;
    const f = dt * 60;
    const def = cur || {};
    // положение и поворот всей фигуры
    g.x += (g.tx - g.x) * 0.06 * f; g.y += (g.ty - g.y) * 0.06 * f;
    if (def.face) { const tgt = Math.round(g.rot / (Math.PI * 2)) * Math.PI * 2; g.rot += (tgt - g.rot) * 0.07 * f; }
    else if (def.sway) { const tgt = Math.round(g.rot / (Math.PI * 2)) * Math.PI * 2 + Math.sin(t * 0.55) * def.sway; g.rot += (tgt - g.rot) * 0.05 * f; }
    else g.rot += g.rotV * dt + (def.scrollSpin || 0) * params.speed * dt;
    const tiltT = mouse.active && def.follow !== false ? mouse.nx * 0.25 : 0;
    g.tilt += (tiltT - g.tilt) * 0.05 * f;
    const rotY = g.rot + g.tilt, rotX = mouse.active && def.follow !== false ? -mouse.ny * 0.12 : 0;
    if (group) { group.position.set(g.x, g.y, 0); group.rotation.y = rotY; group.rotation.x = rotX; }
    if (def.dyn) def.dyn(t, dt, { T, CT, AT, P, V, N, perm, R, viewW, viewH: VIEWH, params, COL, g });

    const k = (def.k || 0.022) * f * (S.calm ? 0.6 : 1), damp = Math.pow(def.damp || 0.86, f);
    const mx = mouse.x - g.x, my = mouse.y - g.y, rep = def.repel == null ? 1 : def.repel;
    const rr = (mobile ? 0.5 : 0.75), rr2 = rr * rr;
    const cb = Math.cos(rotY), sb = Math.sin(rotY);
    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      let vx = V[i3] + (T[i3] - P[i3]) * k * (0.7 + R[i] * 0.6);
      let vy = V[i3 + 1] + (T[i3 + 1] - P[i3 + 1]) * k * (0.7 + R[i] * 0.6);
      let vz = V[i3 + 2] + (T[i3 + 2] - P[i3 + 2]) * k * (0.7 + R[i] * 0.6);
      // курсор расталкивает частицы
      if (rep && mouse.active) {
        const wx = P[i3] * cb + P[i3 + 2] * sb; // приближённо в экранных осях
        const dx = wx - mx, dy = P[i3 + 1] - my, d2 = dx * dx + dy * dy;
        if (d2 < rr2) { const s = (1 - d2 / rr2) * 0.03 * rep * f; vx += dx * s * cb; vy += dy * s; vz += dx * s * sb; }
      }
      vx *= damp; vy *= damp; vz *= damp;
      V[i3] = vx; V[i3 + 1] = vy; V[i3 + 2] = vz;
      const w = 0.0016 * f;
      P[i3] += vx + Math.sin(t * 1.1 + R[i] * 40) * w;
      P[i3 + 1] += vy + Math.cos(t * 0.9 + R[i] * 31) * w;
      P[i3 + 2] += vz;
      const cl = 0.05 * f;
      C[i3] += (CT[i3] - C[i3]) * cl; C[i3 + 1] += (CT[i3 + 1] - C[i3 + 1]) * cl; C[i3 + 2] += (CT[i3 + 2] - C[i3 + 2]) * cl;
      A[i] += (AT[i] - A[i]) * 0.045 * f;
    }
    if (mode === 'webgl') {
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aColor.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
      renderer.render(scene, camera);
    } else draw2d(rotY, rotX);
    requestAnimationFrame(loop);
  }

  /* ---------------- готовые сцены ---------------- */
  S.shapes = { textPoints, sample, signShape, sphere, ring, checkShape, rnd, gauss };
  S.isMobile = () => mobile;
})();

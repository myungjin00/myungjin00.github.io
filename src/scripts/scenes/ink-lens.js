// Scene: drugs drawn in ink drift on the paper; a lens shows them the way a model sees them, as indexed graphs.
import DRUGS from '../../data/drugs.json'

export function inkLens(cv, quietEl) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = cv.parentElement;
  const ctx = cv.getContext("2d");
  const css = getComputedStyle(document.documentElement);
  const v = n => css.getPropertyValue(n).trim();
  const INK = v("--ink"), GREEN = v("--green"), BLUE = v("--blue"), MUTED = v("--muted"), PAPER = v("--paper");
  const INK_RGB = "28,36,33", GREEN_RGB = "31,77,58", BLUE_RGB = "47,93,138", PAPER_RGB = "245,245,239";

  const rand = (a, b) => a + Math.random() * (b - a);
  const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

  let W = 0, H = 0, dpr = 1, quiet = { x0: 0, y0: 0, x1: 0, y1: 0 };
  function resize() {
    const r = hero.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1; W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (quietEl) {
      const t = quietEl.getBoundingClientRect();
      quiet = { x0: t.left - r.left, y0: t.top - r.top, x1: t.right - r.left, y1: t.bottom - r.top };
    } else quiet = { x0: -1e4, y0: -1e4, x1: -1e4, y1: -1e4 };
  }
  new ResizeObserver(resize).observe(hero); resize();
  // ink thins out behind the text so it stays readable
  const calm = (x, y) => {
    const dx = Math.max(quiet.x0 - x, 0, x - quiet.x1), dy = Math.max(quiet.y0 - y, 0, y - quiet.y1);
    return .1 + .9 * smooth(0, 80, Math.hypot(dx, dy));
  };

  // ---------- ink sprites: each drug is painted once, then moved around ----------
  function paint(tpl, s) {
    const rad = Math.max(...tpl.a.map(([, x, y]) => Math.hypot(x, y)));
    const pad = 14, half = rad * s + pad, size = Math.ceil(half * 2);
    const c = document.createElement("canvas");
    c.width = Math.ceil(size * dpr); c.height = Math.ceil(size * dpr);
    const g = c.getContext("2d");
    g.scale(dpr, dpr); g.translate(half, half); g.lineCap = "round"; g.lineJoin = "round";
    const P = tpl.a.map(([, x, y]) => ({ x: x * s, y: y * s }));
    const het = i => tpl.a[i][0] !== "C";
    const stroke = (a, b, passes) => {
      for (let p = 0; p < passes; p++) {
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
        const j1 = rand(-.5, .5), j2 = rand(-.5, .5), bow = rand(-1, 1);
        // first pass: a wide, faint bleed; then crisper strokes of varying weight
        g.globalAlpha = p === 0 ? .1 : rand(.42, .7);
        g.strokeStyle = `rgb(${INK_RGB})`;
        g.lineWidth = p === 0 ? 4 : rand(1, 2.1);
        g.filter = p === 0 ? "blur(1.4px)" : "none";
        g.beginPath();
        g.moveTo(a.x + nx * j1, a.y + ny * j1);
        g.quadraticCurveTo((a.x + b.x) / 2 + nx * bow, (a.y + b.y) / 2 + ny * bow, b.x + nx * j2, b.y + ny * j2);
        g.stroke();
      }
      g.filter = "none";
    };
    for (const [i, j, o] of tpl.b) {
      let a = P[i], b = P[j];
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, gap = 6.5;
      if (het(i)) a = { x: a.x + ux * gap, y: a.y + uy * gap };
      if (het(j)) b = { x: b.x - ux * gap, y: b.y - uy * gap };
      if (o === 2) {
        const nx = -uy * 2.2, ny = ux * 2.2;
        stroke({ x: a.x + nx, y: a.y + ny }, { x: b.x + nx, y: b.y + ny }, 3);
        stroke({ x: a.x - nx, y: a.y - ny }, { x: b.x - nx, y: b.y - ny }, 2);
      } else stroke(a, b, 3);
    }
    // heteroatoms: a wash of coloured ink under a small letter
    g.textAlign = "center"; g.textBaseline = "middle";
    tpl.a.forEach(([el], i) => {
      if (!het(i)) return;
      const p = P[i], r = rand(5.5, 7.5), rgb = el === "O" ? BLUE_RGB : el === "N" ? GREEN_RGB : INK_RGB;
      const wash = g.createRadialGradient(p.x + rand(-1, 1), p.y + rand(-1, 1), 0, p.x, p.y, r);
      wash.addColorStop(0, `rgba(${rgb},.24)`); wash.addColorStop(.6, `rgba(${rgb},.1)`); wash.addColorStop(1, `rgba(${rgb},0)`);
      g.globalAlpha = 1; g.fillStyle = wash;
      g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI * 2); g.fill();
      g.globalAlpha = .8; g.fillStyle = `rgb(${INK_RGB})`;
      g.font = `italic 500 ${el.length > 1 ? 12 : 14}px "Newsreader", Georgia, serif`;
      g.fillText(el, p.x, p.y + .5);
    });
    return { img: c, half };
  }

  // ---------- molecules ----------
  const mols = [];
  function add(tpl, x, y, born) {
    const s = rand(14, 18);
    mols.push({ tpl, x, y, s, born, a: rand(0, 6.28), va: rand(-.025, .025), vx: rand(-3.5, 3.5), vy: rand(-2.5, 2.5),
                rad: Math.max(...tpl.a.map(([, ax, ay]) => Math.hypot(ax, ay))), sprite: null });
  }
  {
    const n = Math.round(Math.max(8, Math.min(16, W * H / 58000)));
    const cols = Math.ceil(Math.sqrt(n * W / H)), rows = Math.ceil(n / cols);
    for (let k = 0; k < n; k++) {
      const c = k % cols, r = Math.floor(k / cols);
      add(DRUGS[k % DRUGS.length], (c + rand(.2, .8)) / cols * W, (r + rand(.2, .8)) / rows * H, -1e9);
    }
  }
  // paint once fonts are ready so the letters use the serif
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => mols.forEach(m => { m.sprite = paint(m.tpl, m.s); }));

  // ---------- lens ----------
  const LR = () => Math.max(62, Math.min(96, W * .066));
  const lens = { x: W * .72, y: H * .5, tx: W * .72, ty: H * .5, r: LR(), on: false, last: 0 };
  hero.addEventListener("pointermove", e => {
    const b = hero.getBoundingClientRect();
    lens.tx = e.clientX - b.left; lens.ty = e.clientY - b.top; lens.on = true; lens.last = performance.now();
  });
  hero.addEventListener("pointerleave", () => { lens.on = false; });
  hero.addEventListener("pointerdown", e => {
    if (e.target.closest("a")) return;
    const b = hero.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
    lens.tx = x; lens.ty = y; lens.on = true; lens.last = performance.now();
    add(DRUGS[Math.floor(Math.random() * DRUGS.length)], x, y, performance.now());
    const m = mols[mols.length - 1]; m.sprite = paint(m.tpl, m.s);
    if (mols.length > 24) mols.splice(mols.findIndex(o => o.born < 0), 1);
  });

  function step(dt, t) {
    if (!reduce) for (const m of mols) {
      m.x += m.vx * dt; m.y += m.vy * dt; m.a += m.va * dt;
      const pad = m.rad * m.s + 24;
      if (m.x < -pad) m.x = W + pad; else if (m.x > W + pad) m.x = -pad;
      if (m.y < -pad) m.y = H + pad; else if (m.y > H + pad) m.y = -pad;
    }
    if ((!lens.on || t - lens.last > 5000) && !reduce) {
      // idle: the lens settles on whichever molecule is nearest its slow wandering path
      const wx = W * (.66 + .22 * Math.sin(t * .00008)), wy = H * (.5 + .28 * Math.sin(t * .00013 + 1.3));
      let best = null, bd = Infinity;
      for (const m of mols) { const d = Math.hypot(m.x - wx, m.y - wy) + (calm(m.x, m.y) < .5 ? 1e4 : 0); if (d < bd) { bd = d; best = m; } }
      lens.tx = best ? best.x : wx; lens.ty = best ? best.y : wy;
    }
    const k = reduce ? 1 : 1 - Math.pow(lens.on && t - lens.last < 5000 ? .001 : .4, dt);
    lens.x += (lens.tx - lens.x) * k; lens.y += (lens.ty - lens.y) * k; lens.r += (LR() - lens.r) * k;
  }

  // ---------- drawing ----------
  function atomsOnScreen(m) {
    const ca = Math.cos(m.a), sa = Math.sin(m.a);
    return m.tpl.a.map(([, x, y]) => ({ x: m.x + (x * ca - y * sa) * m.s, y: m.y + (x * sa + y * ca) * m.s }));
  }

  function frame(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const L = lens.r;

    // 1. the ink world
    for (const m of mols) {
      if (!m.sprite) continue;
      const fade = (m.born < 0 ? 1 : Math.min(1, (t - m.born) / 800)) * calm(m.x, m.y);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(m.x, m.y); ctx.rotate(m.a);
      ctx.drawImage(m.sprite.img, -m.sprite.half, -m.sprite.half, m.sprite.half * 2, m.sprite.half * 2);
      ctx.restore();
    }

    // 2. the lens wipes the ink away...
    const wipe = ctx.createRadialGradient(lens.x, lens.y, 0, lens.x, lens.y, L);
    wipe.addColorStop(0, `rgba(${PAPER_RGB},.97)`); wipe.addColorStop(.62, `rgba(${PAPER_RGB},.94)`); wipe.addColorStop(1, `rgba(${PAPER_RGB},0)`);
    ctx.globalAlpha = 1; ctx.fillStyle = wipe;
    ctx.beginPath(); ctx.arc(lens.x, lens.y, L, 0, Math.PI * 2); ctx.fill();

    // 3. ...and shows the same molecules as graphs, on a grid
    ctx.save();
    ctx.beginPath(); ctx.arc(lens.x, lens.y, L * .985, 0, Math.PI * 2); ctx.clip();
    const sp = 11, gx0 = Math.floor((lens.x - L) / sp) * sp, gy0 = Math.floor((lens.y - L) / sp) * sp;
    ctx.fillStyle = `rgba(${GREEN_RGB},.16)`;
    for (let x = gx0; x < lens.x + L; x += sp) for (let y = gy0; y < lens.y + L; y += sp) {
      const w = 1 - smooth(L * .6, L, Math.hypot(x - lens.x, y - lens.y));
      if (w > .02) { ctx.globalAlpha = w; ctx.fillRect(x - .6, y - .6, 1.2, 1.2); }
    }
    let focus = null, fd = Infinity;
    for (const m of mols) {
      const d0 = Math.hypot(m.x - lens.x, m.y - lens.y);
      if (d0 > L + m.rad * m.s) continue;
      if (d0 < fd) { fd = d0; focus = m; }
      const fade = m.born < 0 ? 1 : Math.min(1, (t - m.born) / 800);
      const P = atomsOnScreen(m).map(p => {
        const dx = p.x - lens.x, dy = p.y - lens.y, d = Math.hypot(dx, dy), w = 1 - smooth(L * .5, L * .97, d);
        const mag = 1 + .14 * w;
        return { x: lens.x + dx * mag, y: lens.y + dy * mag, w };
      });
      const het = i => m.tpl.a[i][0] !== "C";
      ctx.lineCap = "round"; ctx.strokeStyle = GREEN; ctx.lineWidth = 1.2;
      for (const [i, j] of m.tpl.b) {
        const w = Math.min(P[i].w, P[j].w); if (w < .02) continue;
        ctx.globalAlpha = fade * w * .85;
        ctx.beginPath(); ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(P[j].x, P[j].y); ctx.stroke();
      }
      ctx.font = `9px "IBM Plex Mono", ui-monospace, monospace`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      P.forEach((p, i) => {
        if (p.w < .02) return;
        ctx.globalAlpha = fade * p.w;
        ctx.beginPath(); ctx.arc(p.x, p.y, het(i) ? 4 : 3.2, 0, Math.PI * 2);
        ctx.fillStyle = het(i) ? BLUE : PAPER; ctx.fill();
        ctx.strokeStyle = het(i) ? BLUE : GREEN; ctx.lineWidth = 1.1; ctx.stroke();
        if (p.w > .75) { ctx.globalAlpha = fade * (p.w - .75) * 4 * .7; ctx.fillStyle = MUTED; ctx.fillText(String(i), p.x + 5, p.y - 5); }
      });
    }
    ctx.restore();

    // 4. the rim, and a small readout of the graph in focus
    ctx.globalAlpha = .22; ctx.strokeStyle = GREEN; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(lens.x, lens.y, L * .985, 0, Math.PI * 2); ctx.stroke();
    if (focus && fd < L * .8) {
      const txt = `${focus.tpl.n}  G=(V,E)  |V|=${focus.tpl.a.length}  |E|=${focus.tpl.b.length}`;
      ctx.globalAlpha = .9 * (1 - smooth(L * .45, L * .8, fd));
      ctx.font = `11px "IBM Plex Mono", ui-monospace, monospace`; ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.lineWidth = 4; ctx.strokeStyle = PAPER; ctx.strokeText(txt, lens.x, lens.y + L + 8);
      ctx.fillStyle = MUTED; ctx.fillText(txt, lens.x, lens.y + L + 8);
    }
    ctx.globalAlpha = 1;
  }

  let prev = performance.now();
  function loop(t) {
    const dt = Math.max(0, Math.min(.05, (t - prev) / 1000)); prev = t;
    step(dt, t); frame(t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

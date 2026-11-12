// Scene: one molecule, cut three ways (BRICS, junction tree, Murcko). Each cut is washed in like a brush stroke,
// and the views take turns; hovering a fragment lights up the fragments it overlaps in the other two views.
import MOL from '../../data/celecoxib.json'

export function threeCuts(cv, labelEl) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = cv.parentElement, ctx = cv.getContext("2d");
  const css = getComputedStyle(document.documentElement);
  const v = n => css.getPropertyValue(n).trim();
  const INK = v("--ink"), MUTED = v("--muted"), PAPER = v("--paper");
  const VIEWS = Object.keys(MOL.views);                  // BRICS, junction tree, Murcko
  const TINT = ["78,140,104", "70,122,170", "194,112,60"];  // green, blue, orange washes
  const het = i => MOL.a[i][0] !== "C";

  let W = 0, H = 0, dpr = 1, s = 30, cx = 0, cy = 0;
  const rad = Math.max(...MOL.a.map(([, x, y]) => Math.hypot(x, y)));
  function resize() {
    const r = box.getBoundingClientRect();
    dpr = devicePixelRatio || 1; W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    s = Math.min(W * .42, H * .44) / rad; cx = W / 2; cy = H / 2;
  }
  new ResizeObserver(resize).observe(box); resize();
  const P = () => MOL.a.map(([, x, y]) => ({ x: cx + x * s, y: cy + y * s }));

  // fragment lookup: which fragments (per view) contain each atom
  const owner = VIEWS.map(name => { const o = MOL.a.map(() => []); MOL.views[name].forEach((f, k) => f.forEach(i => o[i].push(k))); return o; });

  let view = 0, since = performance.now(), hover = null;   // hover: {view, frag}
  const HOLD = 3200;
  cv.addEventListener("pointermove", e => {
    const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    let best = -1, bd = 22;
    P().forEach((p, i) => { const d = Math.hypot(p.x - mx, p.y - my); if (d < bd) { bd = d; best = i; } });
    hover = best < 0 ? null : { atom: best };
  });
  cv.addEventListener("pointerleave", () => { hover = null; });
  cv.addEventListener("click", () => { view = (view + 1) % VIEWS.length; since = performance.now(); });

  function wash(frag, rgb, alpha, width) {
    const p = P();
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = `rgba(${rgb},${alpha})`; ctx.lineWidth = width;
    ctx.beginPath();
    let any = false;
    for (const [i, j] of MOL.b) if (frag.includes(i) && frag.includes(j)) { ctx.moveTo(p[i].x, p[i].y); ctx.lineTo(p[j].x, p[j].y); any = true; }
    ctx.stroke();
    if (!any || frag.length === 1) for (const i of frag) { ctx.fillStyle = `rgba(${rgb},${alpha})`; ctx.beginPath(); ctx.arc(p[i].x, p[i].y, width * .55, 0, Math.PI * 2); ctx.fill(); }
  }

  function draw(now) {
    if (!reduce && !hover && now - since > HOLD) { view = (view + 1) % VIEWS.length; since = now; }
    const t = reduce ? 1 : Math.min(1, (now - since) / 700);
    if (labelEl && labelEl.dataset.view !== String(view)) { labelEl.dataset.view = String(view); labelEl.textContent = VIEWS[view]; labelEl.style.setProperty("--tint", `rgb(${TINT[view]})`); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const p = P();

    // washes: the current view, fragments alternating in weight so neighbours stay distinct
    const frags = MOL.views[VIEWS[view]];
    frags.forEach((f, k) => {
      const lit = hover ? owner[view][hover.atom].includes(k) : false;
      wash(f, TINT[view], (lit ? .5 : (k % 2 ? .2 : .32)) * t, (f.length > 2 ? 22 : 16) * (s / 30));
    });
    // when hovering, outline the matching fragments of the other two views: the correspondences MAGNET links
    if (hover) VIEWS.forEach((name, vi) => {
      if (vi === view) return;
      owner[vi][hover.atom].forEach(k => wash(MOL.views[name][k], TINT[vi], .5, 3.2));
    });

    // the molecule itself, as a clean line drawing
    ctx.lineCap = "round"; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    for (const [i, j, o] of MOL.b) {
      let a = p[i], b = p[j];
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, g = 9 * (s / 30);
      if (het(i)) a = { x: a.x + ux * g, y: a.y + uy * g };
      if (het(j)) b = { x: b.x - ux * g, y: b.y - uy * g };
      ctx.globalAlpha = .85; ctx.beginPath();
      if (o === 2) { const nx = -uy * 2.6, ny = ux * 2.6; ctx.moveTo(a.x + nx, a.y + ny); ctx.lineTo(b.x + nx, b.y + ny); ctx.moveTo(a.x - nx, a.y - ny); ctx.lineTo(b.x - nx, b.y - ny); }
      else { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `italic 500 ${Math.round(16 * s / 30)}px "Newsreader", Georgia, serif`;
    MOL.a.forEach(([el], i) => { if (het(i)) { ctx.fillStyle = INK; ctx.fillText(el, p[i].x, p[i].y + 1); } });
    if (hover) { ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p[hover.atom].x, p[hover.atom].y, 9, 0, Math.PI * 2); ctx.stroke(); }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

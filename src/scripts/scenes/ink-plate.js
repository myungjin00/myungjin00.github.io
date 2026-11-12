// An ink plate: the molecule is painted once with washed rings and dry-brush bonds; touching it makes the ink ripple.
import MOL from '../../data/plate.json'

export function inkPlate(cv) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = cv.getContext("2d");
  const paint = document.createElement("canvas"), pg = paint.getContext("2d");
  const rand = (a, b) => a + Math.random() * (b - a);
  let W, H, dpr, S, P = [];
  const rot = -0.35;

  function layout() {
    const r = cv.getBoundingClientRect();
    dpr = devicePixelRatio || 1; W = r.width; H = r.height;
    cv.width = paint.width = Math.round(W * dpr); cv.height = paint.height = Math.round(H * dpr);
    const R = MOL.a.map(([, x, y]) => ({ x: x * Math.cos(rot) - y * Math.sin(rot), y: x * Math.sin(rot) + y * Math.cos(rot) }));
    const x0 = Math.min(...R.map(p => p.x)), x1 = Math.max(...R.map(p => p.x));
    const y0 = Math.min(...R.map(p => p.y)), y1 = Math.max(...R.map(p => p.y));
    const pad = 34;
    S = Math.min((W - pad * 2) / (x1 - x0), (H - pad * 2) / (y1 - y0));
    const ox = W / 2 - (x0 + x1) / 2 * S, oy = H / 2 - (y0 + y1) / 2 * S;
    P = R.map(p => ({ x: ox + p.x * S, y: oy + p.y * S }));
    repaint();
  }

  function repaint() {
    const g = pg;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    g.lineCap = "round"; g.lineJoin = "round";
    // washed ring pads, in the accent of the view they belong to
    MOL.r.forEach((ring, k) => {
      const tint = k === 1 ? "46,88,120" : "30,74,57";
      for (let pass = 0; pass < 6; pass++) {
        g.filter = `blur(${rand(4, 11)}px)`;
        g.globalAlpha = rand(.03, .055);
        g.fillStyle = `rgb(${tint})`;
        g.beginPath();
        ring.forEach((i, n) => { const p = P[i], j = rand(-S * .11, S * .11); n ? g.lineTo(p.x + j, p.y + j) : g.moveTo(p.x + j, p.y + j); });
        g.closePath(); g.fill();
      }
    });
    g.filter = "none";
    const brush = (a, b, w) => {
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      g.filter = "blur(2px)"; g.globalAlpha = .1; g.strokeStyle = "rgb(28,36,33)"; g.lineWidth = w * 2.1;
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.filter = "none";
      for (let h = 0; h < 8; h++) {
        const o = (h / 7 - .5) * w, bow = rand(-1.6, 1.6);
        g.globalAlpha = rand(.14, .42); g.lineWidth = rand(.5, 1.3);
        g.beginPath();
        g.moveTo(a.x + nx * o + rand(-.8, .8), a.y + ny * o + rand(-.8, .8));
        g.quadraticCurveTo((a.x + b.x) / 2 + nx * (o + bow), (a.y + b.y) / 2 + ny * (o + bow), b.x + nx * o, b.y + ny * o);
        g.stroke();
      }
    };
    for (const [i, j, o] of MOL.b) {
      const w = S * .095;
      if (o === 2) {
        const dx = P[j].x - P[i].x, dy = P[j].y - P[i].y, L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L * S * .085, ny = dx / L * S * .085;
        brush({ x: P[i].x + nx, y: P[i].y + ny }, { x: P[j].x + nx, y: P[j].y + ny }, w * .7);
        brush({ x: P[i].x - nx, y: P[i].y - ny }, { x: P[j].x - nx, y: P[j].y - ny }, w * .7);
      } else brush(P[i], P[j], w);
    }
    // heteroatoms: a drop of coloured ink with a little splatter
    MOL.a.forEach(([el], i) => {
      if (el === "C") return;
      const tint = el === "O" ? "46,88,120" : el === "N" ? "30,74,57" : "28,36,33";
      const p = P[i], r = S * rand(.17, .23);
      for (let pass = 0; pass < 3; pass++) {
        const grd = g.createRadialGradient(p.x + rand(-2, 2), p.y + rand(-2, 2), 0, p.x, p.y, r * rand(.8, 1.2));
        grd.addColorStop(0, `rgba(${tint},.45)`); grd.addColorStop(.55, `rgba(${tint},.17)`); grd.addColorStop(1, `rgba(${tint},0)`);
        g.globalAlpha = 1; g.fillStyle = grd;
        g.beginPath(); g.arc(p.x, p.y, r * 1.3, 0, Math.PI * 2); g.fill();
      }
      for (let s = 0; s < 5; s++) {
        const a = rand(0, 6.28), d = r * rand(1.1, 1.9);
        g.globalAlpha = rand(.12, .34); g.fillStyle = `rgb(${tint})`;
        g.beginPath(); g.arc(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, rand(.5, 1.5), 0, Math.PI * 2); g.fill();
      }
    });
    g.globalAlpha = 1;
  }

  const ripples = [];
  let lastAtom = -1;
  cv.addEventListener("pointermove", e => {
    if (reduce) return;
    const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    let best = -1, bd = S * .4;
    P.forEach((p, i) => { const d = Math.hypot(p.x - mx, p.y - my); if (d < bd) { bd = d; best = i; } });
    if (best >= 0 && best !== lastAtom) ripples.push({ x: P[best].x, y: P[best].y, t: performance.now() });
    lastAtom = best;
  });
  cv.addEventListener("pointerleave", () => { lastAtom = -1; });

  function frame(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(paint, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i], age = (t - r.t) / 1000, life = 1.1;
      if (age > life) { ripples.splice(i, 1); continue; }
      for (const lag of [0, .16]) {
        const a = age - lag; if (a < 0) continue;
        ctx.globalAlpha = .3 * (1 - a / life); ctx.strokeStyle = "#1E4A39"; ctx.lineWidth = 1;
        const rr = 5 + a * S * .8;
        ctx.beginPath(); ctx.ellipse(r.x, r.y, rr, rr * .64, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  new ResizeObserver(layout).observe(cv);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { layout(); requestAnimationFrame(frame); });
}

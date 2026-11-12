// The paper is blank until the pointer moves over it, and then a small patch of graph appears —
// irregular nodes joined by short edges, the way a molecule looks once a model has parsed it.
export function nodeField() {
  if (!matchMedia("(pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cv = document.createElement("canvas");
  cv.setAttribute("aria-hidden", "true");
  Object.assign(cv.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "0" });
  document.body.prepend(cv);
  const ctx = cv.getContext("2d");

  const css = getComputedStyle(document.documentElement);
  const GREEN = css.getPropertyValue("--green").trim() || "#1E4A39";
  const BLUE = css.getPropertyValue("--blue").trim() || "#2E5878";
  const CELL = 52;    // one node per cell, placed at random inside it: irregular but never clumped
  const LINK = 82;    // two nodes are joined if they are closer than this
  const R = 150;      // how far the pointer reaches

  let W = 0, H = 0, dpr = 1, nodes = [], edges = [];

  function build() {
    dpr = devicePixelRatio || 1; W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const cols = Math.ceil(W / CELL) + 1, rows = Math.ceil(H / CELL) + 1;
    nodes = [];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        nodes.push({
          x: i * CELL + (0.2 + Math.random() * 0.6) * CELL,
          y: j * CELL + (0.2 + Math.random() * 0.6) * CELL,
          big: Math.random() < 0.18,          // a few heavier nodes, like heteroatoms
          ph: Math.random() * 6.28,
        });
      }
    }
    // edges, computed once: only neighbouring cells can be close enough to link
    edges = [];
    const at = (i, j) => (i >= 0 && j >= 0 && i < cols && j < rows ? nodes[i * rows + j] : null);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const a = at(i, j);
        for (const [di, dj] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
          const b = at(i + di, j + dj);
          if (b && Math.hypot(a.x - b.x, a.y - b.y) < LINK) edges.push([a, b]);
        }
      }
    }
  }
  addEventListener("resize", build); build();

  let tx = -1e4, ty = -1e4, x = tx, y = ty, awake = 0, lastMove = 0;
  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    tx = e.clientX; ty = e.clientY; lastMove = performance.now();
  }, { passive: true });
  document.addEventListener("pointerleave", () => { lastMove = 0; });

  const ripples = [];
  addEventListener("pointerdown", e => {
    if (e.pointerType !== "mouse") return;
    ripples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (ripples.length > 4) ripples.shift();
  });

  const ease = t => t * t * (3 - 2 * t);
  const w = n => {
    const d = Math.hypot(n.x - x, n.y - y);
    return d > R ? 0 : ease(1 - d / R);
  };

  let prev = performance.now();
  (function frame(now) {
    const dt = Math.max(0, Math.min(0.05, (now - prev) / 1000)); prev = now;
    const want = now - lastMove < 2400 ? 1 : 0;
    awake += (want - awake) * (1 - Math.pow(0.02, dt));
    const k = 1 - Math.pow(0.0005, dt);
    x += (tx - x) * k; y += (ty - y) * k;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    if (awake > 0.01) {
      const drift = n => ({ x: n.x + Math.sin(now * 0.0004 + n.ph) * 1.6, y: n.y + Math.cos(now * 0.0005 + n.ph) * 1.6 });
      ctx.strokeStyle = GREEN; ctx.lineWidth = 1;
      for (const [a, b] of edges) {
        const wa = w(a), wb = w(b);
        if (wa <= 0 || wb <= 0) continue;
        const pa = drift(a), pb = drift(b);
        ctx.globalAlpha = awake * Math.min(wa, wb) * 0.3;
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      }
      for (const n of nodes) {
        const wn = w(n); if (wn <= 0.02) continue;
        const p = drift(n);
        ctx.globalAlpha = awake * wn * (n.big ? 0.6 : 0.45);
        ctx.fillStyle = n.big ? BLUE : GREEN;
        ctx.beginPath(); ctx.arc(p.x, p.y, (n.big ? 1.6 : 1) + 1.5 * wn, 0, Math.PI * 2); ctx.fill();
      }
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i], age = (now - r.t) / 1000, life = 1.3;
      if (age > life) { ripples.splice(i, 1); continue; }
      // two rings, the second trailing slightly behind
      for (const lag of [0, 0.14]) {
        const a = age - lag; if (a < 0) continue;
        ctx.globalAlpha = 0.42 * (1 - a / life); ctx.strokeStyle = GREEN; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(r.x, r.y, 6 + ease(a / life) * R * 1.1, 0, Math.PI * 2); ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  })(performance.now());
}

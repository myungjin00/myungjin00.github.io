// Scene: a schematic single-cell map of the liver. Cells sit in their clusters; a senescence score
// washes across them from time to time. Hover a cluster to name it. (Points are illustrative, not data.)
export function cellAtlas(cv) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = cv.parentElement, ctx = cv.getContext("2d");
  const css = getComputedStyle(document.documentElement);
  const v = n => css.getPropertyValue(n).trim();
  const BLUE = v("--blue"), MUTED = v("--muted"), PAPER = v("--paper");
  const WARM = "227,154,59";

  let W = 0, H = 0, dpr = 1, S = 100, cx = 0, cy = 0;
  function resize() {
    const r = box.getBoundingClientRect();
    dpr = devicePixelRatio || 1; W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    S = Math.min(W * .44, H * .5); cx = W / 2; cy = H / 2;
  }
  new ResizeObserver(resize).observe(box); resize();

  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() || 1e-6)) * Math.cos(2 * Math.PI * rnd());
  const CL = [
    { name: "hepatocytes", x: -.42, y: -.08, n: 240, sx: .3, sy: .22, shade: .95, sen: .3 },
    { name: "Kupffer cells", x: .52, y: -.5, n: 90, sx: .15, sy: .12, shade: .7, sen: .08 },
    { name: "stellate cells", x: .62, y: .36, n: 80, sx: .14, sy: .12, shade: .55, sen: .42 },
    { name: "endothelial cells", x: -.02, y: .66, n: 90, sx: .2, sy: .1, shade: .8, sen: .1 },
    { name: "cholangiocytes", x: -.98, y: .5, n: 50, sx: .1, sy: .09, shade: .45, sen: .06 },
    { name: "T cells", x: .2, y: -.72, n: 50, sx: .1, sy: .08, shade: .6, sen: .04 },
  ];
  const cells = [];
  CL.forEach((c, k) => { for (let i = 0; i < c.n; i++) cells.push({ k, x: c.x + gauss() * c.sx, y: c.y + gauss() * c.sy, score: rnd() < c.sen ? .55 + .45 * rnd() : .25 * rnd(), ph: rnd() * 6.28 }); });

  let hover = -1;
  cv.addEventListener("pointermove", e => {
    const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left - cx) / S, my = (e.clientY - r.top - cy) / S;
    let best = -1, bd = .12;
    for (const c of cells) { const d = Math.hypot(c.x - mx, c.y - my); if (d < bd) { bd = d; best = c.k; } }
    hover = best;
  });
  cv.addEventListener("pointerleave", () => { hover = -1; });

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // a slow sweep of the senescence score, left to right, every ~9 s
    const sweep = reduce ? 1 : ((t / 9000) % 1) * 1.6 - .3;
    for (const c of cells) {
      const x = cx + c.x * S + (reduce ? 0 : Math.sin(t * .0007 + c.ph) * 1.2), y = cy + c.y * S + (reduce ? 0 : Math.cos(t * .0006 + c.ph) * 1.2);
      const dim = hover >= 0 && c.k !== hover ? .35 : 1;
      ctx.globalAlpha = (.3 + .5 * CL[c.k].shade) * dim; ctx.fillStyle = BLUE;
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
      const front = reduce ? 1 : Math.max(0, 1 - Math.abs((c.x + 1.2) / 2.6 - sweep) * 5);
      const glow = c.score > .5 ? c.score * Math.max(front, .35) : 0;
      if (glow > .2) { ctx.globalAlpha = Math.min(1, glow) * dim; ctx.fillStyle = `rgb(${WARM})`; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill(); }
    }
    if (hover >= 0) {
      const c = CL[hover], x = cx + c.x * S, y = cy + (c.y - c.sy * 2.4) * S;
      ctx.globalAlpha = 1; ctx.font = `italic 500 16px "Newsreader", Georgia, serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = 5; ctx.strokeStyle = PAPER; ctx.strokeText(c.name, x, y);
      ctx.fillStyle = MUTED; ctx.fillText(c.name, x, y);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

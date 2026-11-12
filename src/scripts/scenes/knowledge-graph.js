// Scene: a schematic drug–protein–disease graph. A drug lights up its paths through proteins to diseases,
// and a dashed edge appears where a new drug–disease link is proposed. Hover a drug to follow it.
export function knowledgeGraph(cv) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = cv.parentElement, ctx = cv.getContext("2d");
  const css = getComputedStyle(document.documentElement);
  const v = n => css.getPropertyValue(n).trim();
  const INK = v("--ink"), GREEN = v("--green"), BLUE = v("--blue"), PAPER = v("--paper");

  let W = 0, H = 0, dpr = 1;
  function resize() {
    const r = box.getBoundingClientRect();
    dpr = devicePixelRatio || 1; W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }
  new ResizeObserver(resize).observe(box); resize();

  // deterministic random graph: drugs on the left band, proteins in the middle, diseases on the right
  let seed = 3;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const N = { drug: 14, protein: 22, disease: 12 };
  const nodes = [];
  const band = { drug: [.08, .3], protein: [.36, .64], disease: [.7, .92] };
  for (const type of ["drug", "protein", "disease"]) for (let i = 0; i < N[type]; i++)
    nodes.push({ type, fx: band[type][0] + rnd() * (band[type][1] - band[type][0]), fy: .1 + rnd() * .8, ph: rnd() * 6.28 });
  const of = t => nodes.map((n, i) => n.type === t ? i : -1).filter(i => i >= 0);
  const drugs = of("drug"), prots = of("protein"), dis = of("disease");
  const edges = [];
  for (const d of drugs) for (let k = 0; k < 2 + Math.floor(rnd() * 2); k++) edges.push([d, prots[Math.floor(rnd() * prots.length)]]);
  for (const p of prots) for (let k = 0; k < 1 + Math.floor(rnd() * 2); k++) edges.push([p, dis[Math.floor(rnd() * dis.length)]]);
  for (let k = 0; k < 8; k++) edges.push([drugs[Math.floor(rnd() * drugs.length)], dis[Math.floor(rnd() * dis.length)]]);   // known indications
  const nbr = nodes.map(() => new Set());
  edges.forEach(([a, b]) => { nbr[a].add(b); nbr[b].add(a); });

  // for a drug: proteins it touches, diseases reached through them, and one proposed new disease
  function story(d) {
    const ps = [...nbr[d]].filter(i => nodes[i].type === "protein");
    const known = new Set([...nbr[d]].filter(i => nodes[i].type === "disease"));
    const reach = new Map();
    ps.forEach(p => nbr[p].forEach(x => { if (nodes[x].type === "disease") reach.set(x, (reach.get(x) || 0) + 1); }));
    const fresh = [...reach.entries()].filter(([x]) => !known.has(x)).sort((a, b) => b[1] - a[1])[0]?.[0];
    return { d, ps, fresh, path: ps.filter(p => fresh !== undefined && nbr[p].has(fresh)) };
  }
  let focus = story(drugs[0]), since = performance.now(), hovered = false, k = 0;

  const pos = (n, t) => ({ x: n.fx * W + (reduce ? 0 : Math.sin(t * .0004 + n.ph) * 4), y: n.fy * H + (reduce ? 0 : Math.cos(t * .0005 + n.ph) * 4) });
  cv.addEventListener("pointermove", e => {
    const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, t = performance.now();
    let best = -1, bd = 16;
    drugs.forEach(i => { const p = pos(nodes[i], t), dd = Math.hypot(p.x - mx, p.y - my); if (dd < bd) { bd = dd; best = i; } });
    hovered = best >= 0;
    if (hovered && best !== focus.d) { focus = story(best); since = t; }
  });
  cv.addEventListener("pointerleave", () => { hovered = false; });

  function draw(t) {
    if (!reduce && !hovered && t - since > 4200) { k = (k + 1) % drugs.length; focus = story(drugs[k]); since = t; }
    const age = (t - since) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const P = nodes.map(n => pos(n, t));
    const lit = new Set([focus.d, ...focus.ps]);

    ctx.lineCap = "round";
    for (const [a, b] of edges) {
      const on = (a === focus.d && lit.has(b)) || (lit.has(a) && b === focus.fresh && focus.path.includes(a));
      ctx.globalAlpha = on ? .75 : .06; ctx.strokeStyle = on ? GREEN : INK; ctx.lineWidth = on ? 1.6 : 1;
      ctx.beginPath(); ctx.moveTo(P[a].x, P[a].y); ctx.lineTo(P[b].x, P[b].y); ctx.stroke();
    }
    // the proposed drug–disease link, drawn in as a dashed edge
    if (focus.fresh !== undefined) {
      const grow = reduce ? 1 : Math.min(1, Math.max(0, (age - .8) / 1.2));
      const a = P[focus.d], b = P[focus.fresh];
      ctx.globalAlpha = .9; ctx.strokeStyle = BLUE; ctx.lineWidth = 1.6; ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + (b.x - a.x) * grow, a.y + (b.y - a.y) * grow); ctx.stroke();
      ctx.setLineDash([]);
    }
    nodes.forEach((n, i) => {
      const p = P[i], on = lit.has(i) || i === focus.fresh;
      const r = n.type === "drug" ? 5 : n.type === "disease" ? 5.5 : 3.6;
      ctx.globalAlpha = on ? 1 : .55;
      ctx.beginPath(); ctx.arc(p.x, p.y, r + (on ? 1.5 : 0), 0, Math.PI * 2);
      if (n.type === "protein") { ctx.fillStyle = PAPER; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); }
      else { ctx.fillStyle = n.type === "drug" ? GREEN : BLUE; ctx.fill(); }
      if (i === focus.fresh) { ctx.globalAlpha = .5; ctx.strokeStyle = BLUE; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, 11 + Math.sin(t * .004) * 2, 0, Math.PI * 2); ctx.stroke(); }
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

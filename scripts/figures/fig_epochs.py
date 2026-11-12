"""Epoch, batch and iteration counted for 10,000 samples at batch size 32."""
import math, pathlib, torch
from torch.utils.data import DataLoader, TensorDataset
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G, B, A, L, M, I, P = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873", "#1C2421", "#F7F7F3"
MONO = "ui-monospace,monospace"

N, BS, EPOCHS = 10_000, 32, 50
ds = TensorDataset(torch.zeros(N, 1))
iters = len(DataLoader(ds, batch_size=BS))          # drop_last=False
last = N % BS
total = EPOCHS * iters
assert iters == math.ceil(N / BS) == 313 and last == 16 and total == 15_650

def t(x, y, s, sz=10, fl=M, an="start", w="normal"):
    return f'<text x="{x}" y="{y}" text-anchor="{an}" font-family="{MONO}" font-size="{sz}" fill="{fl}" font-weight="{w}">{s}</text>'

def box(x, y, w, h, st=L, fi="#FFFFFF", r=3, sw=1.2):
    return f'<rect x="{x:.1f}" y="{y}" width="{w:.1f}" height="{h}" rx="{r}" fill="{fi}" stroke="{st}" stroke-width="{sw}"/>'

VW, VH = 720, 316
o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{VW}" height="{VH}" viewBox="0 0 {VW} {VH}" role="img"'
     f' aria-label="Batches, iterations and epochs counted for {N:,} samples at batch size {BS}">',
     '<defs><marker id="ar0" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">'
     f'<path d="M0 0 L6 3 L0 6 z" fill="{M}"/></marker></defs>']
o.append(t(18, 22, f"N = {N:,} training samples &#183; batch size B = {BS}", 11, M))

# ---- one epoch, as batches ----
SHOWN, BW, GAP, X0, BY, BH = 7, 56, 8, 54, 74, 34
xs = [X0 + k * (BW + GAP) for k in range(SHOWN)]
ell = xs[-1] + BW + GAP + 10
LASTW = BW * last / BS
lx = ell + 34
for k, x in enumerate(xs):
    o.append(box(x, BY, BW, BH, st=B, fi="#FFFFFF"))
    o.append(t(x + BW / 2, BY + BH / 2 + 4, str(BS), 10.5, I, "middle", "600"))
    o.append(t(x + BW / 2, BY + BH + 15, str(k + 1), 9, M, "middle"))
o.append(t(ell + 8, BY + BH / 2 + 4, "&#183;&#183;&#183;", 12, M, "middle"))
o.append(box(lx, BY, LASTW, BH, st=B, fi=P))
o.append(t(lx + LASTW / 2, BY + BH / 2 + 4, str(last), 10.5, I, "middle", "600"))
o.append(t(lx + LASTW / 2, BY + BH + 15, str(iters), 9, M, "middle"))

# bracket over the whole epoch
X1 = lx + LASTW
o.append(f'<path d="M{X0} 60 L{X0} 52 L{X1:.1f} 52 L{X1:.1f} 60" fill="none" stroke="{L}" stroke-width="1.2"/>')
o.append(t((X0 + X1) / 2, 44, f"epoch 1 &#183; one full pass over the {N:,} samples", 10, M, "middle"))
o.append(t(X0, BY + BH + 32, "batch &#183; the samples averaged into one update", 9.5, B))

# ---- the iterations under it ----
IY = BY + BH + 58
for x in xs + [lx]:
    w = LASTW if x == lx else BW
    o.append(f'<line x1="{x + w/2:.1f}" y1="{IY - 24}" x2="{x + w/2:.1f}" y2="{IY - 7}" stroke="{M}" stroke-width="1.1" marker-end="url(#ar0)"/>')
    o.append(f'<circle cx="{x + w/2:.1f}" cy="{IY + 2}" r="5.5" fill="{A}"/>')
o.append(f'<circle cx="{ell + 8}" cy="{IY + 2}" r="2" fill="{M}"/>')
o.append(t(X0, IY + 28, "iteration &#183; one optimiser step", 9.5, A))
o.append(t(VW - 18, IY + 2 + 4, f"ceil({N:,} / {BS}) = {iters}", 11, I, "end", "600"))
o.append(t(VW - 18, IY + 24, "iterations per epoch", 9.5, M, "end"))
o.append(f'<line x1="18" y1="{IY + 52}" x2="{VW-18}" y2="{IY + 52}" stroke="{L}" stroke-width="1"/>')

# ---- 50 epochs ----
EY, EH, EW = IY + 82, 26, 9.6
o.append(t(18, EY - 14, f"the same epoch, {EPOCHS} times", 11, M))
for e in range(EPOCHS):
    o.append(box(X0 + e * EW, EY, EW - 2.2, EH, st=L, fi="#FFFFFF", r=2, sw=.9))
o.append(t(X0 + (EW - 2.2) / 2, EY + EH + 15, "1", 9, M, "middle"))
o.append(t(X0 + (EPOCHS - 1) * EW + (EW - 2.2) / 2, EY + EH + 15, str(EPOCHS), 9, M, "middle"))
o.append(t(VW - 18, EY + EH / 2 + 4, f"{EPOCHS} &#215; {iters} = {total:,}", 11, I, "end", "600"))
o.append(t(VW - 18, EY + EH / 2 + 22, "optimiser steps in total", 9.5, M, "end"))
o.append("</svg>")
(OUT / "epoch-batch-iteration.svg").write_text("\n".join(o) + "\n")
print(f"{N} / {BS}: {iters} iterations, last batch {last}, {EPOCHS} epochs = {total} steps")
print("wrote epoch-batch-iteration.svg")

"""Two runs over one wall-clock window: the GPU waiting for data, and the GPU busy."""
import pathlib
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G, B, A, L, M, I, P = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873", "#1C2421", "#F7F7F3"
MONO = "ui-monospace,monospace"

WINDOW = 20.0          # arbitrary time units, the same for both runs
GPU_WORK = 1.0         # the same GPU work per batch in both runs
# the two utilisations the note names
CASES = [("input-bound", 0.20), ("compute-bound", 0.95)]
PLAN = []
for name, util in CASES:
    step = GPU_WORK / util
    steps = int(round(WINDOW / step))
    PLAN.append((name, util, step, steps, steps * GPU_WORK / WINDOW))
assert [p[3] for p in PLAN] == [4, 19]
for *_, util, busy in [(p[1], p[4]) for p in PLAN]:
    assert abs(util - busy) < 0.01

def t(x, y, s, sz=10, fl=M, an="start", w="normal"):
    return f'<text x="{x}" y="{y}" text-anchor="{an}" font-family="{MONO}" font-size="{sz}" fill="{fl}" font-weight="{w}">{s}</text>'

def box(x, y, w, h, st=L, fi="#FFFFFF", r=2, sw=1.0):
    return f'<rect x="{x:.2f}" y="{y}" width="{max(w, 0.8):.2f}" height="{h}" rx="{r}" fill="{fi}" stroke="{st}" stroke-width="{sw}"/>'

VW, VH = 720, 304
X0, X1 = 126, 694
SCALE = (X1 - X0) / WINDOW
RH = 20
o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{VW}" height="{VH}" viewBox="0 0 {VW} {VH}" role="img"'
     ' aria-label="Timelines of GPU-busy and GPU-waiting time for an input-bound run and a compute-bound run">']
o.append(t(18, 22, "one wall-clock window &#183; the same GPU work per batch in both runs", 11, M))

for ci, (name, util, step, steps, _) in enumerate(PLAN):
    top = 48 + ci * 110
    o.append(t(18, top, f"{name} &#183; utilisation {util:.0%}", 11, I, "start", "500"))
    cy, gy = top + 14, top + 14 + RH + 8
    o.append(t(X0 - 10, cy + RH / 2 + 3.4, "data pipeline", 9, M, "end"))
    o.append(t(X0 - 10, gy + RH / 2 + 3.4, "GPU", 9, M, "end"))
    o.append(box(X0, cy, X1 - X0, RH, st=L, fi=P, sw=.8))
    o.append(box(X0, gy, X1 - X0, RH, st=L, fi=P, sw=.8))
    prep = step - GPU_WORK
    for k in range(steps):
        s0 = k * step
        o.append(box(X0 + s0 * SCALE, cy, prep * SCALE, RH, st=A, fi="#F3E3D6", sw=1.1))
        o.append(box(X0 + (s0 + prep) * SCALE, gy, GPU_WORK * SCALE, RH, st=B, fi="#DCE6EE", sw=1.1))
    o.append(t(X1, gy + RH + 18, f"{steps} optimiser steps in the window", 9.5, M, "end"))

# ---- scale key and legend ----
KY = 266
o.append(f'<line x1="{X0}" y1="{KY - 4}" x2="{X0 + GPU_WORK * SCALE:.1f}" y2="{KY - 4}" stroke="{M}" stroke-width="1.2"/>')
for x in (X0, X0 + GPU_WORK * SCALE):
    o.append(f'<line x1="{x:.1f}" y1="{KY - 8}" x2="{x:.1f}" y2="{KY}" stroke="{M}" stroke-width="1.2"/>')
o.append(t(X0 + GPU_WORK * SCALE + 10, KY, "one batch of GPU work", 9.5, M))
LY = 240 + 56
o.append(box(X0, LY - 10, 13, 13, st=A, fi="#F3E3D6", sw=1.1))
o.append(t(X0 + 20, LY, "preparing a batch", 9.5, M))
o.append(box(X0 + 170, LY - 10, 13, 13, st=B, fi="#DCE6EE", sw=1.1))
o.append(t(X0 + 190, LY, "GPU computing", 9.5, M))
o.append(box(X0 + 330, LY - 10, 13, 13, st=L, fi=P, sw=.8))
o.append(t(X0 + 350, LY, "idle", 9.5, M))
o.append("</svg>")
(OUT / "gpu-timeline.svg").write_text("\n".join(o) + "\n")
for name, util, step, steps, busy in PLAN:
    print(f"{name:14s} utilisation {util:.0%} | step {step:.3f} units | {steps} steps in {WINDOW:g} units"
          f" | busy fraction {busy:.2f}")
print("wrote gpu-timeline.svg")

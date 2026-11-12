"""Bergstra & Bengio's picture: 16 grid trials vs 16 random trials when only one axis matters."""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, numpy as np, pathlib
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G, B, A, L, M, S = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873", "#7E9C8B"
plt.rcParams.update({"figure.dpi":100,"savefig.transparent":True,"font.size":10,"axes.labelsize":10,
 "xtick.labelsize":9.5,"ytick.labelsize":9.5,"axes.edgecolor":L,"axes.linewidth":.8,"axes.labelcolor":M,
 "xtick.color":M,"ytick.color":M,"axes.spines.top":False,"axes.spines.right":False,
 "legend.frameon":False,"font.family":["DejaVu Sans"]})
SEED, N = 0, 16

# the score: x is the parameter that matters, y barely moves it (1/40 of the amplitude).
# the optimum is drawn from the same seed, so it is not hand-placed onto or off the grid.
score = lambda x, y, pk: np.exp(-((x - pk) ** 2) / (2 * 0.09 ** 2)) + 0.025 * np.cos(4 * np.pi * y)

g = (np.arange(4) + .5) / 4                                  # 4x4 grid, cell centres
gx, gy = (a.ravel() for a in np.meshgrid(g, g))
rng = np.random.default_rng(SEED)
peak = rng.uniform(.1, .9)
rx, ry = rng.random(N), rng.random(N)

best = {}
fig, axs = plt.subplots(1, 2, figsize=(7.2, 3.7), sharey=True)
gridX, gridY = np.meshgrid(np.linspace(0, 1, 400), np.linspace(0, 1, 400))
Z = score(gridX, gridY, peak)
for ax, (name, px, py) in zip(axs, [("grid search  ·  4 x 4", gx, gy), ("random search  ·  16 draws", rx, ry)]):
    ax.contourf(gridX, gridY, Z, levels=12, cmap="YlOrBr", alpha=.55)
    ax.scatter(px, py, s=26, color=M, zorder=3, linewidths=0)
    s = score(px, py, peak)
    i = int(np.argmax(s)); best[name.split()[0]] = (s[i], px[i], len(np.unique(np.round(px, 6))))
    ax.scatter(px[i], py[i], s=150, facecolor="none", edgecolor=G, linewidths=2.0, zorder=4)
    ax.annotate(f"best {s[i]:.3f}", xy=(px[i], py[i]), xytext=(px[i], py[i] + .13),
                fontsize=9.5, color=G, ha="center",
                arrowprops=dict(arrowstyle="-", color=G, lw=.9))
    ax.axvline(peak, color=B, linestyle="--", linewidth=1.1, zorder=2)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.set_xlabel("the parameter that matters")
    ax.set_title(f"{name}  ·  {best[name.split()[0]][2]} distinct x", fontsize=10.5, color=M, pad=7)
axs[0].set_ylabel("the parameter that does not")
axs[0].text(peak + .02, .035, "best x", fontsize=9, color=B)

fig.tight_layout(); fig.savefig(OUT/"random-vs-grid.svg", bbox_inches="tight", pad_inches=.06)
plt.close(fig)
for k, (s, x, nx) in best.items():
    print(f"{k:6s} best score {s:.3f} at x = {x:.3f} | distinct x values tried: {nx}")
print(f"optimum at x = {peak:.4f} (drawn from the seed); best possible score 1.025")
print("random beats grid on this seed:", best["random"][0] > best["grid"][0])

# one seed is one draw, so the same comparison over 2,000 replicates with the optimum
# in a random position each time: the grid is fixed, only the random draws move
win, gb, rb = [], [], []
for s_ in range(2000):
    r = np.random.default_rng(1000 + s_)
    pk = r.uniform(.1, .9); x, y = r.random(N), r.random(N)
    a, b = score(gx, gy, pk).max(), score(x, y, pk).max()
    win.append(b > a); gb.append(a); rb.append(b)
print(f"over 2,000 replicates: random wins {100*np.mean(win):.1f}% | "
      f"mean best grid {np.mean(gb):.3f} vs random {np.mean(rb):.3f}")

"""Confounding: three ways to put 24 samples into 4 batches, and what each costs the estimate."""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, numpy as np, pathlib
from matplotlib.patches import Rectangle
from matplotlib.lines import Line2D
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G, B, A, L, M, S = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873", "#7E9C8B"
plt.rcParams.update({"figure.dpi":100,"savefig.transparent":True,"font.size":10,"axes.labelsize":10,
 "xtick.labelsize":9.5,"ytick.labelsize":9.5,"axes.edgecolor":L,"axes.linewidth":.8,"axes.labelcolor":M,
 "xtick.color":M,"ytick.color":M,"axes.spines.top":False,"axes.spines.right":False,
 "legend.frameon":False,"font.family":["DejaVu Sans"]})

NB, PER = 4, 6                                   # 4 batches of 6 samples
BATCH = np.repeat(np.arange(NB), PER)
# how many of the 6 samples in each batch are disease
DESIGNS = {"fully confounded": [0, 0, 6, 6],
           "partially confounded": [1, 2, 4, 5],
           "balanced blocks": [3, 3, 3, 3]}
COND = {k: np.concatenate([np.r_[np.ones(d, int), np.zeros(PER - d, int)] for d in v])
        for k, v in DESIGNS.items()}

TRUE_COND, BATCH_SD, NOISE_SD, REPS = 1.0, 2.0, 0.5, 2000

def fit(y, cond, batch):
    """naive = difference of group means; adjusted = least squares with batch in the model."""
    naive = y[cond == 1].mean() - y[cond == 0].mean()
    Xd = np.column_stack([np.ones_like(y), cond] + [(batch == b).astype(float) for b in range(1, NB)])
    adj = np.linalg.pinv(Xd) @ y                 # pinv, so a rank-deficient design still returns
    return naive, adj[1], np.linalg.matrix_rank(Xd), Xd.shape[1]

rng = np.random.default_rng(0)
res, rank_info = {}, {}
for k, cond in COND.items():
    out = np.empty((REPS, 2))
    for i in range(REPS):
        be = rng.normal(0, BATCH_SD, NB)         # a fresh set of batch shifts each experiment
        y = TRUE_COND * cond + be[BATCH] + rng.normal(0, NOISE_SD, len(BATCH))
        out[i, 0], out[i, 1], rk, ncol = fit(y, cond, BATCH)
    res[k] = out; rank_info[k] = (rk, ncol)
    print(f"{k:22s} rank {rk}/{ncol} | naive {out[:,0].mean():+.2f} +/- {out[:,0].std():.2f} "
          f"| batch-adjusted {out[:,1].mean():+.2f} +/- {out[:,1].std():.2f} "
          f"| adjusted within 20% of truth: {np.mean(np.abs(out[:,1]-TRUE_COND)<.2)*100:.0f}%")

fig = plt.figure(figsize=(7.2, 5.6))
gs = fig.add_gridspec(2, 3, height_ratios=[1, 1.45], hspace=.05, wspace=.22, top=.92)

for j, (k, cond) in enumerate(COND.items()):
    ax = fig.add_subplot(gs[0, j])
    for i, (b, c) in enumerate(zip(BATCH, cond)):
        x, yy = i % PER, NB - 1 - b
        ax.add_patch(Rectangle((x + .08, yy + .08), .84, .84, facecolor=A if c else S,
                               edgecolor="none"))
    for b in range(NB):                          # the batch each row was processed in
        ax.add_patch(Rectangle((.02, NB - 1 - b + .02), PER - .04, .96, facecolor="none",
                               edgecolor=B, linewidth=1.4))
        ax.text(-.22, NB - 1 - b + .5, f"b{b+1}", fontsize=8.8, color=B, ha="right", va="center")
    ax.set_xlim(-.75, PER); ax.set_ylim(0, NB); ax.set_xticks([]); ax.set_yticks([])
    ax.set_aspect("equal"); ax.axis("off")
    ax.set_title(k, fontsize=10, color=M, pad=6)

ax = fig.add_subplot(gs[1, :])
names = list(COND); xs = np.arange(len(names)); w = .3
for j, (label, col) in enumerate([("ignoring batch", M), ("~ batch + condition", G)]):
    for i, k in enumerate(names):
        v = res[k][:, j]
        pos = i + (j - .5) * w
        ax.vlines(pos, np.percentile(v, 2.5), np.percentile(v, 97.5), color=col, linewidth=1.4)
        ax.plot([pos - .07, pos + .07], [v.mean()] * 2, color=col, linewidth=2.2)
        ax.scatter(pos + (np.random.default_rng(j).random(200) - .5) * .11, v[:200], s=4,
                   color=col, alpha=.18, linewidths=0, label=label if i == 0 else None)
        ax.text(pos, np.percentile(v, 97.5) + .25, f"{v.mean():+.2f}\n±{v.std():.2f}",
                fontsize=8.4, color=col, ha="center", va="bottom")
ax.axhline(TRUE_COND, color=A, linestyle="--", linewidth=1.3)
ax.text(-.45, TRUE_COND + .25, "true effect = 1.0", fontsize=9, color=A, ha="left")
ax.set_xticks(xs); ax.set_xticklabels(names); ax.set_xlim(-.5, 2.5)
ax.set_ylabel("estimated condition effect")
ax.set_title(f"{REPS:,} simulated experiments per design  ·  bars span the middle 95%",
             fontsize=10, color=M, pad=7)
ax.legend(handles=[Line2D([], [], color=M, lw=2, label="ignoring batch"),
                   Line2D([], [], color=G, lw=2, label="~ batch + condition")],
          fontsize=9, labelcolor=M, loc="lower left", borderaxespad=.3)
fig.legend(handles=[Line2D([], [], marker="s", color="none", markerfacecolor=S, markersize=8, label="control"),
                    Line2D([], [], marker="s", color="none", markerfacecolor=A, markersize=8, label="disease"),
                    Line2D([], [], color=B, lw=1.4, label="batch")],
           fontsize=9, labelcolor=M, loc="upper center", ncol=3, bbox_to_anchor=(.5, 1.0))

fig.savefig(OUT/"confounding.svg", bbox_inches="tight", pad_inches=.06)
plt.close(fig)
# the claim: only the confounded design is rank-deficient, and only it misses by more than the effect
assert rank_info["fully confounded"][0] < rank_info["fully confounded"][1]
assert all(rank_info[k][0] == rank_info[k][1] for k in list(COND)[1:])
print("wrote confounding.svg")

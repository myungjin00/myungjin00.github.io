"""Reading a differential expression result: the volcano and the heatmap.

Counts are simulated so the truth is known — which is the point. On real data you cannot
draw the line between a gene that really changed and one that did not.
"""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, numpy as np, pathlib
from matplotlib.lines import Line2D

OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
GREEN, BLUE, ATOM, LINE, MUTED = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873"
plt.rcParams.update({"figure.dpi": 100, "savefig.transparent": True, "font.size": 8,
    "axes.labelsize": 8, "xtick.labelsize": 7.5, "ytick.labelsize": 7.5, "axes.edgecolor": LINE,
    "axes.linewidth": .8, "axes.labelcolor": MUTED, "xtick.color": MUTED, "ytick.color": MUTED,
    "axes.spines.top": False, "axes.spines.right": False, "legend.frameon": False,
    "font.family": ["DejaVu Sans"]})
rng = np.random.default_rng(11)

# ---------------------------------------------------------------- simulate a two-group study
G, N = 4000, 6                              # genes, samples per group (young / old)
mu = 10 ** rng.uniform(0.6, 3.4, G)         # baseline expression, spread over three decades
lfc = np.zeros(G)

truly_de = rng.choice(G, 320, replace=False)                 # genes that really change
lfc[truly_de] = rng.normal(0, 1.1, 320)

# a pathway of interest — here "lipid metabolism" — that moves coherently in one direction
SET = rng.choice(np.setdiff1d(np.arange(G), truly_de), 60, replace=False)
lfc[SET] = rng.normal(0.85, 0.45, len(SET))                  # mostly up, modestly

disp = 0.02 + 6 / mu                                         # dispersion falls with expression
def counts(scale):
    m = mu * scale
    return rng.negative_binomial(1 / disp[:, None], 1 / (1 + m[:, None] * disp[:, None]), (G, N))
young, old = counts(1.0), counts(2.0 ** lfc)

# log2 fold change and a Wald-ish p value from the group means and pooled variance
ly, lo = np.log2(young + 1), np.log2(old + 1)
obs_lfc = lo.mean(1) - ly.mean(1)
se = np.sqrt(ly.var(1, ddof=1) / N + lo.var(1, ddof=1) / N) + 1e-9
from scipy import stats
p = 2 * stats.norm.sf(np.abs(obs_lfc / se))
order = np.argsort(p)                                        # Benjamini-Hochberg
padj = np.minimum.accumulate((p[order] * G / (np.arange(G) + 1))[::-1])[::-1]
q = np.empty(G); q[order] = np.clip(padj, 0, 1)
nlp = -np.log10(np.maximum(q, 1e-300))

# ================================================================= 1. volcano
fig, axs = plt.subplots(1, 2, figsize=(9.2, 3.5), gridspec_kw=dict(width_ratios=[1, 1]))

sig = (q < 0.05) & (np.abs(obs_lfc) > 1)
for ax, highlight in zip(axs, [False, True]):
    ax.scatter(obs_lfc[~sig], nlp[~sig], s=4, color=LINE, linewidths=0, zorder=1)
    ax.scatter(obs_lfc[sig], nlp[sig], s=5, color=MUTED, linewidths=0, zorder=2)
    if highlight:
        ax.scatter(obs_lfc[SET], nlp[SET], s=16, color=ATOM, linewidths=0, zorder=4)
    ax.axhline(-np.log10(0.05), color=MUTED, lw=.7, ls="--")
    ax.axvline(1, color=MUTED, lw=.7, ls=":"); ax.axvline(-1, color=MUTED, lw=.7, ls=":")
    ax.set_xlabel("log$_2$ fold change   (old / young)")
    ax.set_xlim(-4, 4)
axs[0].set_ylabel("$-\\log_{10}$ adjusted $p$")
axs[0].set_title("every gene", fontsize=8, color=MUTED, pad=6)
axs[1].set_title("with one pathway marked", fontsize=8, color=MUTED, pad=6)
axs[1].legend(handles=[
    Line2D([], [], marker="o", ls="", color=LINE, markersize=4, label="not significant"),
    Line2D([], [], marker="o", ls="", color=MUTED, markersize=4, label="significant"),
    Line2D([], [], marker="o", ls="", color=ATOM, markersize=5, label="lipid metabolism"),
], fontsize=7, labelcolor=MUTED, loc="upper left")
fig.tight_layout()
fig.savefig(OUT / "volcano.svg", bbox_inches="tight"); plt.close(fig)

n_set_sig = int(((q[SET] < 0.05) & (np.abs(obs_lfc[SET]) > 1)).sum())
print(f"volcano  : {sig.sum()} significant of {G}; "
      f"pathway {len(SET)} genes, {n_set_sig} pass the cut, "
      f"median log2FC {np.median(obs_lfc[SET]):.2f}")

# ================================================================= 2. heatmap, raw vs z-scored
top = np.argsort(q)[:40]
X = np.hstack([ly[top], lo[top]])                            # 40 genes x 12 samples
Z = (X - X.mean(1, keepdims=True)) / (X.std(1, keepdims=True) + 1e-9)
row = np.argsort(obs_lfc[top])                               # same row order in both panels

fig, axs = plt.subplots(1, 2, figsize=(8.4, 4.2))
for ax, M, title, cmap, lab in [
        (axs[0], X[row], "raw  log$_2$(count + 1)", "YlOrRd", "expression"),
        (axs[1], Z[row], "row z-score", "RdBu_r", "z")]:
    im = ax.imshow(M, aspect="auto", cmap=cmap, interpolation="nearest",
                   **({"vmin": -2.2, "vmax": 2.2} if lab == "z" else {}))
    ax.set_title(title, fontsize=8, color=MUTED, pad=6)
    ax.set_xticks([N / 2 - .5, N + N / 2 - .5]); ax.set_xticklabels(["young", "old"])
    ax.axvline(N - .5, color="white", lw=1.4)
    ax.set_yticks([])
    fig.colorbar(im, ax=ax, fraction=.046, pad=.03).ax.tick_params(labelsize=7, color=MUTED)
axs[0].set_ylabel("40 most significant genes", color=MUTED)
fig.tight_layout()
fig.savefig(OUT / "heatmap-zscore.svg", bbox_inches="tight"); plt.close(fig)

print(f"heatmap  : raw range {X.min():.1f}-{X.max():.1f} log2 units; "
      f"after z-scoring every row is centred at 0, sd 1")
print(f"           highest-expressed row mean {X.mean(1).max():.1f}, "
      f"lowest {X.mean(1).min():.1f} — a {X.mean(1).max() - X.mean(1).min():.1f} log2 gap "
      f"that the z-scored panel removes")
